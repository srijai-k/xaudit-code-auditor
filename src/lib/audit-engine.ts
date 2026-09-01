import { IssueItem, PatternSmell } from './types';

/**
 * Legacy, non-security pattern checks. These are regex-based text checks
 * over raw HTML/JSX-shaped input — accessibility/performance/mobile hygiene
 * and boilerplate-pattern observations. They are NOT security rules and are
 * kept entirely separate from the AST-based security engine in
 * src/lib/analysis/. Nothing here is described as AI-detected; "pattern
 * smells" are plain structural heuristics (repeated markup, placeholder
 * text, excessive nesting), stated as such.
 *
 * The former checkSecurity() function that lived in this file (eval/
 * onclick/onerror/dangerouslySetInnerHTML/script-tag/CSP regex checks) has
 * been removed. Those checks are superseded by the AST rules in
 * src/lib/analysis/rules/xss.ts and dynamic-exec.ts, which fixed the
 * false-positive bug documented in docs/baseline-audit.md finding #3
 * (JSX `onClick={handler}` was being reported as a critical XSS/RCE
 * finding by a case-insensitive `/onclick=/i` regex that also matched the
 * JSX prop text).
 */

export function validateInput(code: string): { isValid: boolean; reason?: string } {
    const trimmed = code.trim();

    if (trimmed.length < 40) {
        return { isValid: false, reason: "Not enough code to analyze. Paste a real file or component (min 40 characters)." };
    }

    const lineCount = trimmed.split('\n').length;
    if (lineCount < 3) {
        return { isValid: false, reason: "Code must be at least 3 lines long." };
    }

    if (!/[<={};]/.test(trimmed)) {
        return { isValid: false, reason: "Input lacks common code symbols (<, {, ;, =)." };
    }

    const isHtml = /<html|<head|<body|<section|<script|<style/i.test(trimmed) || (/<div/i.test(trimmed) && /<\/div>/i.test(trimmed));
    const isReact = /export\s+default|import\s+React|return\s*\(\s*<|<[A-Z][a-zA-Z0-9]+\s*\/>/i.test(trimmed);
    const isJs = /(?:function\s+\w+|const\s+\w+\s*=|import\s+.*?from|=>)/i.test(trimmed);

    if (!isHtml && !isReact && !isJs) {
        return { isValid: false, reason: "This doesn't look like HTML, JavaScript, TypeScript, or React/JSX — those are the only inputs this checker analyzes." };
    }

    return { isValid: true };
}

export function runLegacyPatternChecks(code: string) {
    const issues: IssueItem[] = [];
    const patternSmells: PatternSmell[] = [];
    const positives: string[] = [];

    const accIssues = checkAccessibility(code);
    issues.push(...accIssues);
    if (accIssues.length === 0) positives.push("No missing alt text, empty buttons, or missing <main> landmark found.");

    const perfIssues = checkPerformance(code);
    issues.push(...perfIssues);
    if (perfIssues.length === 0) positives.push("No obvious performance hygiene issues found (lazy loading, image sizing, DOM size).");

    const mobIssues = checkMobile(code);
    issues.push(...mobIssues);
    if (mobIssues.length === 0) positives.push("Viewport and fixed-width checks found nothing.");

    const cqIssues = checkCodeQuality(code);
    issues.push(...cqIssues);
    if (cqIssues.length === 0) positives.push("No obvious structural code-quality smells found.");

    patternSmells.push(...detectPatternSmells(code));

    const nestingDepth = calculateNestingDepth(code);

    return { issues, patternSmells, positives, nestingDepth };
}

function calculateNestingDepth(code: string): number {
    let maxDepth = 0;
    let currentDepth = 0;
    const selfClosing = ['img', 'br', 'hr', 'input', 'link', 'meta', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr'];
    const tokens = code.match(/<[a-z1-6]+|<\/[a-z1-6]+/gi) || [];

    tokens.forEach(token => {
        if (token.startsWith('</')) {
            currentDepth = Math.max(0, currentDepth - 1);
        } else {
            const tagName = token.substring(1).toLowerCase();
            if (!selfClosing.includes(tagName)) {
                currentDepth++;
                if (currentDepth > maxDepth) maxDepth = currentDepth;
            }
        }
    });
    return maxDepth;
}

function checkAccessibility(code: string): IssueItem[] {
    const items: IssueItem[] = [];

    const imgMatches = code.match(/<img[^>]*>/gi) || [];
    imgMatches.forEach(img => {
        if (!img.match(/alt=/i) || img.match(/alt=["']\s*["']/i)) {
            items.push({
                id: 'acc-alt',
                category: 'accessibility',
                title: 'Missing Alt Attribute',
                severity: 'medium',
                description: 'Images without descriptive alt text are invisible to screen readers.',
                whyItMatters: 'Affects inclusive design and WCAG compliance. This is an accessibility hygiene check, not a security finding.',
                suggestion: 'Add alt="description of image" to all <img> tags.',
                snippet: img
            });
        }
    });

    const btnMatches = code.match(/<button[^>]*>([\s\S]*?)<\/button>/gi) || [];
    btnMatches.forEach(btn => {
        const content = btn.replace(/<[^>]*>/g, '').trim();
        if (!content && !btn.match(/aria-label=/i)) {
            items.push({
                id: 'acc-btn-label',
                category: 'accessibility',
                title: 'Empty Button Label',
                severity: 'medium',
                description: 'Buttons with icons but no text should have an aria-label.',
                whyItMatters: 'Screen readers cannot announce the purpose of an empty button.',
                suggestion: 'Add aria-label="Action description" to the button.',
                snippet: btn
            });
        }
    });

    if (!code.match(/<main/i)) {
        items.push({
            id: 'acc-main',
            category: 'accessibility',
            title: 'Missing <main> Landmark',
            severity: 'low',
            description: 'The <main> element helps screen readers jump to primary content.',
            whyItMatters: 'Navigation is harder for keyboard and screen reader users.',
            suggestion: 'Wrap your primary content in a <main> tag.'
        });
    }

    return items;
}

function checkPerformance(code: string): IssueItem[] {
    const items: IssueItem[] = [];

    if ((code.match(/style=/g) || []).length > 5) {
        items.push({
            id: 'perf-inline-css',
            category: 'performance',
            title: 'Excessive Inline Styles',
            severity: 'low',
            description: 'Using inline styles prevents CSS caching and increases bundle size.',
            whyItMatters: 'Harder to maintain and suboptimal for browser rendering.',
            suggestion: 'Move styles to a separate CSS file or a CSS-in-JS library.'
        });
    }

    const imgMatches = code.match(/<img[^>]*>/gi) || [];
    let missingLazy = 0;
    let missingSize = 0;
    imgMatches.forEach(img => {
        if (!img.match(/loading=['"]lazy['"]/i)) missingLazy++;
        if (!img.match(/width=['"]\d+['"]/i) || !img.match(/height=['"]\d+['"]/i)) missingSize++;
    });
    if (missingLazy > 0) {
        items.push({
            id: 'perf-lazy-load',
            category: 'performance',
            title: 'Missing Lazy Loading',
            severity: 'low',
            description: `${missingLazy} image(s) are missing the loading="lazy" attribute.`,
            whyItMatters: 'Forces the browser to download all images immediately, even off-screen ones.',
            suggestion: 'Add loading="lazy" to non-critical images.'
        });
    }
    if (missingSize > 0) {
        items.push({
            id: 'perf-img-size',
            category: 'performance',
            title: 'Missing Image Dimensions',
            severity: 'low',
            description: `${missingSize} image(s) are missing width/height attributes.`,
            whyItMatters: 'Causes layout shift (CLS) as images load.',
            suggestion: 'Add explicit width and height to prevent layout jumps.'
        });
    }

    const consoleLogs = (code.match(/console\.log/gi) || []).length;
    if (consoleLogs > 3) {
        items.push({
            id: 'perf-console-logs',
            category: 'performance',
            title: 'Frequent Console Logging',
            severity: 'low',
            description: `Detected ${consoleLogs} console.log calls.`,
            whyItMatters: 'Excessive logging adds overhead and can leak internal information.',
            suggestion: 'Remove logs or use a production-safe logging bridge.'
        });
    }

    const tagCount = (code.match(/<[a-z1-6]+/gi) || []).length;
    if (tagCount > 150) {
        items.push({
            id: 'perf-dom-size',
            category: 'performance',
            title: 'Large DOM Size',
            severity: 'medium',
            description: `Found ${tagCount} tags. Large DOM trees impact rendering performance.`,
            whyItMatters: 'Increases memory usage and layout calculation time.',
            suggestion: 'Simplify structure or implement virtualization for long lists.'
        });
    }

    return items;
}

function checkMobile(code: string): IssueItem[] {
    const items: IssueItem[] = [];

    if (!code.match(/name=['"]viewport['"]/i) && code.match(/<html|<head|<body/i)) {
        items.push({
            id: 'mob-viewport',
            category: 'mobile',
            title: 'Missing Viewport Meta',
            severity: 'medium',
            description: 'Without a viewport meta tag, mobile browsers render at desktop width.',
            whyItMatters: 'Breaks responsive rendering on mobile devices.',
            suggestion: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0" /> to <head>.'
        });
    }

    if (code.match(/width:\s*\d{3,}px/i)) {
        items.push({
            id: 'mob-fixed-width',
            category: 'mobile',
            title: 'Fixed Pixel Widths',
            severity: 'low',
            description: 'Detected large fixed pixel widths that may break on mobile.',
            whyItMatters: 'Can cause horizontal scrolling on small screens.',
            suggestion: 'Use max-width: 100% or relative units like rem/vw.'
        });
    }

    return items;
}

function checkCodeQuality(code: string): IssueItem[] {
    const items: IssueItem[] = [];

    const inlineStyles = code.match(/\sstyle=['"]/gi) || [];
    if (inlineStyles.length > 5) {
        items.push({
            id: 'cq-inline-styles',
            category: 'codeQuality',
            title: 'Inline Style Attributes',
            severity: 'low',
            description: `Found ${inlineStyles.length} inline style attributes.`,
            whyItMatters: 'Makes it harder to maintain a consistent design system.',
            suggestion: 'Use CSS classes or a styling library instead.'
        });
    }

    const divTokens = code.match(/<div|<\/div/gi) || [];
    const divCount = divTokens.filter(t => t.toLowerCase() === '<div').length;
    if (divCount > 25) {
        items.push({
            id: 'cq-div-soup',
            category: 'codeQuality',
            title: 'Excessive Div Count',
            severity: 'low',
            description: `Component uses ${divCount} div tags.`,
            whyItMatters: 'Semantic HTML is lost and the DOM tree becomes unnecessarily heavy.',
            suggestion: 'Use semantic elements like <section>, <article>, or <header>.'
        });
    }

    let maxDepth = 0;
    let currentDepth = 0;
    const tokens = code.match(/<[a-zA-Z1-6]+|<\/[a-zA-Z1-6]+/gi) || [];
    tokens.forEach(token => {
        if (token.startsWith('</')) currentDepth = Math.max(0, currentDepth - 1);
        else { currentDepth++; if (currentDepth > maxDepth) maxDepth = currentDepth; }
    });
    if (maxDepth > 8) {
        items.push({
            id: 'cq-nesting',
            category: 'codeQuality',
            title: 'Deeply Nested Structure',
            severity: 'low',
            description: `Maximum nesting depth is ${maxDepth}.`,
            whyItMatters: 'Makes code harder to follow and maintain.',
            suggestion: 'Break down large components into smaller, reusable sub-components.'
        });
    }

    return items;
}

function detectPatternSmells(code: string): PatternSmell[] {
    const smells: PatternSmell[] = [];

    if (code.match(/\/\/ AI generated|\/\/ This was created by|lorem ipsum|TODO:|FIXME:|\/\/ Fill this in/i)) {
        smells.push({
            title: 'Placeholder / boilerplate content',
            severity: 'low',
            explanation: 'Placeholder comments or filler text (Lorem Ipsum/TODOs) detected in source.',
            suggestion: 'Remove placeholder commentary and replace placeholders with real data before shipping.'
        });
    }

    const divs = (code.match(/<div/gi) || []).length;
    const semantic = ['<section', '<article', '<header', '<footer', '<aside', '<nav', '<main'].filter(tag => code.toLowerCase().includes(tag)).length;
    if (divs > 10 && semantic === 0) {
        smells.push({
            title: 'No semantic HTML elements used',
            severity: 'low',
            explanation: 'High reliance on nested divs without any structural semantic tags.',
            suggestion: 'Use semantic elements like <header> or <main> for layout structure.'
        });
    }

    const matches = code.match(/<(button|a|input|li|img|div)[^>]*>[\s\S]*?<\/\1>|<(img|input)[^>]*>/gi) || [];
    if (matches.length > 3) {
        const counts: Record<string, number> = {};
        matches.forEach(m => {
            const clean = m.trim().replace(/\s+/g, ' ');
            if (clean.length > 10) counts[clean] = (counts[clean] || 0) + 1;
        });
        if (Object.values(counts).some(c => c >= 3)) {
            smells.push({
                title: 'Repeated identical markup blocks',
                severity: 'low',
                explanation: 'Multiple identical structural blocks detected — likely hand-duplicated instead of mapped from data.',
                suggestion: 'Map over an array of data instead of manually duplicating markup.'
            });
        }
    }

    return smells;
}
