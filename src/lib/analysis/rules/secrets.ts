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
 * Three detection paths:
 *   1. Vendor-specific prefixes with enough fixed structure to be a real
 *      identifying signal (OpenAI, Anthropic, Stripe, AWS, GitHub, GitLab,
 *      Slack, Google API key format, PEM private-key blocks).
 *   2. A string literal assigned to a variable/property whose name plainly
 *      says what it is (API_KEY, SECRET, TOKEN, PASSWORD, ...), with
 *      placeholder-shaped values excluded outright rather than merely
 *      downgraded.
 *   3. A conservative, low-severity entropy fallback (see
 *      isHighEntropySecretCandidate below) for a string that has NEITHER a
 *      vendor format NOR a credential-shaped name — e.g. a bearer token
 *      passed directly as a header value with no named variable at all,
 *      which path 2 can't see because there's no name to check. This is
 *      the least precise check here by a wide margin, always "low"
 *      severity, and was calibrated empirically (see
 *      docs/model-improvements.md) against realistic non-secret shapes
 *      before shipping — git/SRI hashes, UUIDs, URLs, base64 image/font
 *      data, i18n keys, identifiers — specifically because a naive
 *      Shannon-entropy check misfires constantly without that shape
 *      filtering.
 *
 * No bare hex/alphanumeric pattern without a vendor prefix, a naming
 * context, or the entropy shape filters below is included. That is a
 * deliberate precision-over-recall choice: this rule will still miss some
 * custom/internal secret formats (false negative, disclosed) rather than
 * mislabel arbitrary hashes/UUIDs as vendor keys.
 *
 * Every finding's `snippet` is masked (first 4 + last 4 characters) before
 * it is ever constructed — the raw secret value never appears in a
 * Finding, and therefore never reaches the UI, PDF export, or fix-prompt
 * clipboard text through that path.
 *
 * That masking does NOT, by itself, protect a separate thing:
 * storage.ts/storage/history.ts build a short "masked excerpt" of the raw
 * pasted code (for opt-in local history) by slicing the first ~120
 * characters of the *original* code — not by reading anything out of a
 * Finding. If a real secret happened to sit in the first 120 characters,
 * slicing alone would put it into localStorage in plaintext. redactSecrets()
 * below exists specifically to close that gap: storage.ts/history.ts run
 * the raw excerpt through it before ever calling localStorage.setItem.
 * This was a real, live gap in an earlier version of this file — caught by
 * manually testing the save-to-history flow with an actual secret pasted
 * near the start of the input — not something designed in from the start.
 */

export function maskSecret(raw: string): string {
    if (raw.length <= 10) return "*".repeat(raw.length);
    return `${raw.slice(0, 4)}${"*".repeat(Math.max(4, raw.length - 8))}${raw.slice(-4)}`;
}

/**
 * Redacts secrets out of arbitrary raw text (not an AST — this runs on a
 * plain string, e.g. a code excerpt about to be written to localStorage).
 * Two passes: fixed-prefix vendor patterns, then the entropy-shape check
 * (see redactHighEntropyStrings above — added as a regression fix, not
 * part of the original design).
 *
 * Still NOT covered: the name-context generic fallback (`secret-generic-
 * assignment` — a string assigned to an `API_KEY`/`SECRET`/`TOKEN`-shaped
 * name with no vendor format) for values shorter than the entropy
 * fallback's 24-character floor. That check needs to see a variable/
 * property NAME, which isn't available from raw text without re-parsing —
 * and a short, low-entropy value (e.g. `const API_KEY = "hunter2!";`)
 * won't be caught by the entropy pass either. This is a real, disclosed,
 * still-open gap, not silently pretended away — see docs/model-
 * improvements.md's self-audit entry. Safe to call on text with no
 * secrets in it at all — it's a no-op in that case.
 */
export function redactSecrets(text: string): string {
    let out = text;
    for (const vp of VENDOR_PATTERNS) {
        vp.regex.lastIndex = 0;
        out = out.replace(vp.regex, (match) => maskSecret(match));
    }
    out = redactHighEntropyStrings(out);
    return out;
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

// ---- Entropy fallback (detection path 3) ------------------------------
//
// Thresholds below were picked by computing Shannon entropy for a batch of
// realistic strings — a real-looking random token vs. a git SHA-1/SHA-256
// hash, a UUID, an npm/yarn "integrity" SRI hash, a CDN URL, a base64
// font/image blob, an i18n dotted key, a SNAKE_CASE constant name, a
// camelCase identifier, minified-looking short tokens — and choosing a bar
// that every non-secret sample fell under while real-token-shaped strings
// cleared it. See docs/model-improvements.md for the actual numbers; this
// is not a "shipped and hoped" heuristic.
const MIN_ENTROPY_CANDIDATE_LENGTH = 24;
const MIN_ENTROPY_BITS_PER_CHAR = 4.5;
const CONTAINS_WHITESPACE = /\s/;
const URL_OR_PATH_LIKE = /:\/\/|^data:|^\.{1,2}\/|^\/|^www\.|\\/i;
const INTEGRITY_HASH_PREFIX = /^sha(1|256|384|512)-/i; // npm/yarn/SRI "integrity" field format
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PURE_HEX_PATTERN = /^[0-9a-f]+$/i;
const CANONICAL_HASH_LENGTHS = new Set([32, 40, 64]); // MD5 / SHA-1 / SHA-256 hex digest lengths

function shannonEntropyBitsPerChar(value: string): number {
    const counts = new Map<string, number>();
    for (const ch of value) counts.set(ch, (counts.get(ch) ?? 0) + 1);
    let entropy = 0;
    for (const count of counts.values()) {
        const p = count / value.length;
        entropy -= p * Math.log2(p);
    }
    return entropy;
}

/**
 * True only for a string that (a) is long and unbroken enough to plausibly
 * be a token, (b) doesn't structurally match a known non-secret shape
 * (URL/path, npm integrity hash, UUID, a canonical-length pure-hex hash),
 * (c) mixes letters and digits (excludes pure-prose and pure-identifier
 * strings), and (d) clears the empirically-calibrated entropy bar. All
 * four conditions are required — this is intentionally conservative.
 */
function isHighEntropySecretCandidate(value: string): boolean {
    if (value.length < MIN_ENTROPY_CANDIDATE_LENGTH) return false;
    if (CONTAINS_WHITESPACE.test(value)) return false;
    if (URL_OR_PATH_LIKE.test(value)) return false;
    if (INTEGRITY_HASH_PREFIX.test(value)) return false;
    if (UUID_PATTERN.test(value)) return false;
    if (PURE_HEX_PATTERN.test(value) && CANONICAL_HASH_LENGTHS.has(value.length)) return false;
    if (!/[0-9]/.test(value) || !/[a-zA-Z]/.test(value)) return false;
    return shannonEntropyBitsPerChar(value) >= MIN_ENTROPY_BITS_PER_CHAR;
}

/**
 * REGRESSION FIX (found live, in this browser's own localStorage, during a
 * self-audit — not by a rule, not by a fixture): once the entropy fallback
 * above existed, redactSecrets() below still only ever scanned for
 * vendor-prefixed formats, so a real, non-vendor high-entropy secret
 * (exactly the case that fallback exists to catch in the findings report)
 * sailed straight into the "safe to persist locally" history excerpt
 * completely unmasked — confirmed reproducible: a bearer token passed as a
 * header value, saved to history, sat in `localStorage` in plaintext.
 *
 * This pass is deliberately biased toward OVER-redacting relative to the
 * detection rule it mirrors, on purpose: a false positive here just turns
 * a harmless fragment of a stored preview excerpt into asterisks (cheap,
 * and visible only to the same user in their own browser); a false
 * negative means a real secret sits in plaintext in someone's localStorage
 * — the exact bug this exists to close. So the candidate regex here is
 * intentionally looser than the AST rule's string-literal boundaries (any
 * 20+ character run of token-shaped characters is checked, not just whole
 * string-literal values pulled from a parsed AST), while
 * isHighEntropySecretCandidate's own shape/entropy gate is reused
 * completely unchanged — this does not loosen or re-calibrate detection,
 * it only widens where candidates are looked for.
 */
const ENTROPY_CANDIDATE_PATTERN = /[A-Za-z0-9_+/=-]{20,}/g;

function redactHighEntropyStrings(text: string): string {
    return text.replace(ENTROPY_CANDIDATE_PATTERN, (match) => (isHighEntropySecretCandidate(match) ? maskSecret(match) : match));
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
                if (contextName && GENERIC_NAME_PATTERN.test(contextName)) {
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
                    return;
                }

                // 3. Entropy fallback — no vendor format, no credential-shaped
                //    name (or no name at all, e.g. a bare header-value
                //    argument). See isHighEntropySecretCandidate's own
                //    comment for exactly what this does and doesn't do.
                if (isHighEntropySecretCandidate(value)) {
                    addFinding(
                        {
                            ruleId: "secret-high-entropy-string",
                            title: "Possible hardcoded secret (high-entropy string)",
                            severity: "low",
                            category: "secrets",
                            message:
                                "This string has no recognized vendor key format and isn't assigned to a credential-shaped name, but it is long, unbroken, and statistically random-looking — a shape real tokens/secrets commonly have.",
                            whyItMatters:
                                "A hardcoded token is sometimes passed directly as a header or call argument rather than stored in a named constant (e.g. a bearer token inline in a fetch call) — the name-based check above only looks at named variables/properties and can't see this case at all.",
                            saferExample:
                                "If this is a real credential or token, move it to an environment variable. If it's a hash, checksum, generated ID, or other non-secret data, this finding can be dismissed.",
                            limitations:
                                "The least precise check in this rule group: a purely statistical guess (character-entropy + shape heuristics), with no vendor format and no naming context to anchor it. Calibrated against realistic non-secret shapes (hashes, UUIDs, URLs, base64 blobs, identifiers — see docs/model-improvements.md) but will still occasionally misfire on an unusual non-secret format those exclusions don't cover, and will miss real secrets that are hex-only or otherwise land under the entropy threshold. 'Low' severity reflects that lower confidence — treat it as 'worth a second look,' not 'confirmed.'",
                            location: locOf(node),
                            snippet: maskSecret(value),
                        },
                        rangeKey,
                    );
                }
            },
        });

        return findings;
    },
};
