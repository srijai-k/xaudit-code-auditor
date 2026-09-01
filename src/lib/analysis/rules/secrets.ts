import * as t from "@babel/types";
import type { NodePath } from "@babel/traverse";
import { traverseAst, locOf } from "../ast-utils";
import type { Rule, RuleContext } from "../rule";
import type { Finding, Severity } from "../types";

/**
 * Rule group D — conservative hardcoded-secret detection.
 *
 * This deliberately replaces the old scanner's ~40 generic "bare 32-hex" /
 * "bare 24-alphanumeric" style patterns, which had no vendor-identifying
 * prefix and collided constantly (a single real key would be mislabeled as
 * five different vendors' keys at once — see docs/baseline-audit.md #5).
 *
 * Two detection paths only:
 *   1. Vendor-specific prefixes with enough fixed structure to be a real
 *      identifying signal (OpenAI, Anthropic, Stripe, AWS, GitHub, GitLab,
 *      Slack, Google API key format, PEM private-key blocks).
 *   2. A string literal assigned to a variable/property whose name plainly
 *      says what it is (API_KEY, SECRET, TOKEN, PASSWORD, ...), with
 *      placeholder-shaped values excluded outright rather than merely
 *      downgraded.
 *
 * No bare hex/alphanumeric pattern without a vendor prefix or a naming
 * context is included. That is a deliberate precision-over-recall choice:
 * this rule will miss custom/internal secret formats (false negative,
 * disclosed) rather than mislabel arbitrary hashes/UUIDs as vendor keys.
 *
 * Every finding's `snippet` is masked (first 4 + last 4 characters) before
 * it is ever constructed — the raw secret value never appears in a
 * Finding, and therefore never reaches the UI, history, PDF export, or
 * fix-prompt clipboard text.
 */

export function maskSecret(raw: string): string {
    if (raw.length <= 10) return "*".repeat(raw.length);
    return `${raw.slice(0, 4)}${"*".repeat(Math.max(4, raw.length - 8))}${raw.slice(-4)}`;
}

interface VendorPattern {
    id: string;
    name: string;
    regex: RegExp;
    severity: Severity;
    action: string;
}

const VENDOR_PATTERNS: VendorPattern[] = [
    // Order matters: more specific prefixes must be checked before the
    // generic patterns they are a superset of (Anthropic keys also start
    // with "sk-", so they must be matched before the plain OpenAI pattern
    // or they would be misattributed — see tests/rules/secrets.test.ts).
    { id: "secret-anthropic", name: "Anthropic API key", regex: /sk-ant-api\d{2}-[A-Za-z0-9_-]{16,}/g, severity: "critical", action: "Rotate immediately in the Anthropic console and move to a server-side environment variable." },
    { id: "secret-openai", name: "OpenAI API key", regex: /sk-(proj-)?[A-Za-z0-9_-]{16,}/g, severity: "critical", action: "Rotate immediately in the OpenAI dashboard and move to a server-side environment variable." },
    { id: "secret-stripe", name: "Stripe secret key", regex: /sk_(live|test)_[A-Za-z0-9]{16,}/g, severity: "critical", action: "Roll the key in the Stripe dashboard immediately." },
    { id: "secret-aws", name: "AWS access key ID", regex: /AKIA[0-9A-Z]{16}/g, severity: "critical", action: "Deactivate the IAM credential immediately in the AWS console." },
    { id: "secret-github-pat", name: "GitHub personal access token", regex: /gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}/g, severity: "critical", action: "Revoke the token in GitHub Settings → Developer settings." },
    { id: "secret-gitlab-pat", name: "GitLab personal access token", regex: /glpat-[A-Za-z0-9_-]{20}/g, severity: "critical", action: "Revoke the token in GitLab → User Settings → Access Tokens." },
    { id: "secret-slack-token", name: "Slack token", regex: /xox[baprs]-[A-Za-z0-9-]{10,}/g, severity: "high", action: "Revoke the token in the Slack app configuration." },
    { id: "secret-rsa-private-key", name: "Private key block", regex: /-----BEGIN ((RSA|EC|OPENSSH|DSA) )?PRIVATE KEY-----/g, severity: "critical", action: "Treat the key as compromised. Rotate the corresponding certificate/credential." },
    { id: "secret-google-api-key", name: "Google API key", regex: /AIza[0-9A-Za-z_-]{35}/g, severity: "medium", action: "Confirm this key is restricted (HTTP referrer / API restrictions) in Google Cloud Console. If unrestricted, restrict or rotate it." },
];

const GENERIC_NAME_PATTERN = /(API[_-]?KEY|SECRET|TOKEN|PASSWORD|PASSWD|PWD|PRIVATE[_-]?KEY)/i;
const PLACEHOLDER_VALUE_PATTERN = /your[_-]?key|your[_-]?token|example|placeholder|xxxx|changeme|change_me|insert[_-]?key|replace[_-]?me|dummy|fake|test[_-]?key|sample|<[^>]+>/i;
const FIREBASE_CONTEXT_PATTERN = /firebase[_-]?config/i;
const FIREBASE_SIBLING_KEYS = new Set(["authDomain", "projectId", "messagingSenderId", "storageBucket", "appId"]);

function isPlaceholderValue(value: string): boolean {
    return PLACEHOLDER_VALUE_PATTERN.test(value) || value.length < 8;
}

function propertyKeyName(node: t.ObjectProperty): string | undefined {
    if (t.isIdentifier(node.key)) return node.key.name;
    if (t.isStringLiteral(node.key)) return node.key.value;
    return undefined;
}

/** Walks up from a string literal to see if it sits in a Firebase web-config object. */
function isInsideFirebaseConfigObject(path: NodePath<t.StringLiteral>): boolean {
    const objectParent = path.findParent((p) => t.isObjectExpression(p.node));
    if (!objectParent || !t.isObjectExpression(objectParent.node)) return false;
    const siblingNames = objectParent.node.properties
        .filter((p): p is t.ObjectProperty => t.isObjectProperty(p))
        .map(propertyKeyName)
        .filter(Boolean) as string[];
    if (siblingNames.some((n) => FIREBASE_SIBLING_KEYS.has(n))) return true;

    const varParent = path.findParent((p) => t.isVariableDeclarator(p.node));
    if (varParent && t.isVariableDeclarator(varParent.node) && t.isIdentifier(varParent.node.id)) {
        if (FIREBASE_CONTEXT_PATTERN.test(varParent.node.id.name)) return true;
    }
    return false;
}

export const secretsRule: Rule = {
    id: "secrets",
    category: "secrets",
    title: "Hardcoded secrets",
    run(ctx: RuleContext): Finding[] {
        const findings: Finding[] = [];
        const seenRanges = new Set<string>();
        const { ast, code } = ctx;

        function addFinding(f: Finding, rangeKey: string) {
            if (seenRanges.has(rangeKey)) return; // dedupe by source range
            seenRanges.add(rangeKey);
            findings.push(f);
        }

        traverseAst(ast, {
            StringLiteral(path) {
                const { node } = path;
                const value = node.value;
                const rangeKey = `${node.start}-${node.end}`;

                // 1. Vendor-specific prefixes.
                for (const vp of VENDOR_PATTERNS) {
                    vp.regex.lastIndex = 0;
                    const match = vp.regex.exec(value);
                    if (!match) continue;

                    const isGoogleKey = vp.id === "secret-google-api-key";
                    const isPublicFirebaseKey = isGoogleKey && isInsideFirebaseConfigObject(path);

                    addFinding(
                        {
                            ruleId: vp.id,
                            title: isPublicFirebaseKey ? `${vp.name} (Firebase web config — likely intended to be public)` : `Hardcoded ${vp.name}`,
                            severity: isPublicFirebaseKey ? "info" : vp.severity,
                            category: "secrets",
                            message: isPublicFirebaseKey
                                ? "This matches Google's API key format and sits inside what looks like a Firebase web app config object. Firebase web config values are designed to be shipped to the browser and are not equivalent to a server-side secret — but they should still be paired with Firebase Security Rules and, ideally, HTTP-referrer restrictions."
                                : `This string matches the known format for a ${vp.name}.`,
                            whyItMatters: isPublicFirebaseKey
                                ? "This is informational, not a leak: the risk (if any) is a misconfigured Firebase Security Rules setup, not this key being visible."
                                : "If this is a real, active credential, anyone with access to this code (or this deployed bundle, if it ships to the browser) can use it to consume your quota, access your data, or incur cost on your account.",
                            saferExample: isPublicFirebaseKey
                                ? "Keep this key, but confirm Firebase Security Rules deny unauthorized reads/writes, and add HTTP referrer restrictions in Google Cloud Console."
                                : "Move this value to a server-side environment variable and load it with process.env / import.meta.env — never ship it in client-side bundles.",
                            limitations:
                                "Format match only — this rule cannot verify the key is still active, nor distinguish a real key from a syntactically valid but revoked or fabricated one.",
                            location: locOf(node),
                            snippet: maskSecret(match[0]),
                        },
                        rangeKey,
                    );
                    return; // vendor match takes priority over the generic check below for this literal
                }

                // 2. Generic name-context match: StringLiteral assigned to an
                //    identifier/property whose name says what it is.
                if (isPlaceholderValue(value)) return;

                let contextName: string | undefined;
                const parent = path.parent;
                if (t.isVariableDeclarator(parent) && t.isIdentifier(parent.id)) {
                    contextName = parent.id.name;
                } else if (t.isObjectProperty(parent) && !parent.computed) {
                    contextName = propertyKeyName(parent);
                } else if (t.isAssignmentExpression(parent) && t.isIdentifier(parent.left)) {
                    contextName = parent.left.name;
                }
                if (!contextName || !GENERIC_NAME_PATTERN.test(contextName)) return;

                addFinding(
                    {
                        ruleId: "secret-generic-assignment",
                        title: `Hardcoded value assigned to "${contextName}"`,
                        severity: "medium",
                        category: "secrets",
                        message: `A string literal is assigned directly to "${contextName}", a name that suggests a credential. No known vendor format matched, so this is a lower-confidence, name-based signal only.`,
                        whyItMatters: "If this is a real credential, hardcoding it means it ships wherever this source does, and cannot be rotated without a code change.",
                        saferExample: `Load ${contextName} from an environment variable (process.env.${contextName.toUpperCase()} or your framework's env mechanism) instead of a literal.`,
                        limitations:
                            "Name-based heuristic, not a format match — this can miss secrets assigned to unconventionally-named variables (false negative) and can still occasionally flag a non-secret string that happens to sit in a credential-shaped variable (false positive). Placeholder-shaped values (containing 'example', 'your_key', etc.) are excluded outright, not just downgraded.",
                        location: locOf(node),
                        snippet: maskSecret(value),
                    },
                    rangeKey,
                );
            },
        });

        return findings;
    },
};
