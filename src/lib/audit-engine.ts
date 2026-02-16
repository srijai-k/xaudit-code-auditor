import { AuditCategory, IssueItem, SmellItem, IssueSeverity, FixDifficulty } from './types';
import { SEVERITY_POINTS } from './scoring';

export function validateInput(code: string): { isValid: boolean; reason?: string } {
    const trimmed = code.trim();

    // 1. Minimum Length Rule (Increased to 40)
    if (trimmed.length < 40) {
        return { isValid: false, reason: "Not enough code to audit. Paste a real file or component (min 40 chars)." };
    }

    // 2. Minimum Line Count Rule
    const lineCount = trimmed.split('\n').length;
    if (lineCount < 3) {
        return { isValid: false, reason: "Code must be at least 3 lines long." };
    }

    // 3. Symbol Check
    if (!/[<={};]/.test(trimmed)) {
        return { isValid: false, reason: "Input lacks common code symbols (<, {, ;, =)." };
    }

    // 4. Type Detection Logic (Strict)
    // HTML: Must have some structure, not just a single tag
    const isHtml = /<html|<head|<body|<section|<script|<style/i.test(trimmed) || (/<div/i.test(trimmed) && /<\/div>/i.test(trimmed));

    // React/JSX: Specific patterns
    const isReact = /export\s+default|import\s+React|return\s*\(\s*<|<[A-Z][a-zA-Z0-9]+\s*\/>/i.test(trimmed);

    // JavaScript: Meaningful code patterns
    const isJs = /(?:function\s+\w+|const\s+\w+\s*=|import\s+.*?from|=>)/i.test(trimmed);

    if (!isHtml && !isReact && !isJs) {
        return { isValid: false, reason: "XAudit can’t grade this because the input doesn’t look like real code (HTML, React, or JS)." };
    }

    return { isValid: true };
}

// ... existing runHeuristicAudit ...
export function runHeuristicAudit(code: string, mode: string) {
    const issues: IssueItem[] = [];
    const aiSmells: SmellItem[] = [];
    const positives: string[] = [];

    // 1. Accessibility Checks
    const accIssues = checkAccessibility(code, code);
    issues.push(...accIssues);
    if (accIssues.length === 0) positives.push("Strong semantic landmarks detected.");

    // 2. Performance Checks
    const perfIssues = checkPerformance(code);
    issues.push(...perfIssues);
    if (perfIssues.length === 0) positives.push("Assets appear properly optimized.");

    // 3. Mobile UX Checks
    const mobIssues = checkMobile(code);
    issues.push(...mobIssues);
    if (mobIssues.length === 0) positives.push("Viewport and responsive patterns found.");

    // 4. Security Checks
    const secIssues = checkSecurity(code);
    issues.push(...secIssues);
    if (secIssues.length === 0) positives.push("No obvious hardcoded secrets detected.");

    // 5. Code Quality Checks
    const cqIssues = checkCodeQuality(code);
    issues.push(...cqIssues);
    if (cqIssues.length === 0) positives.push("Clean component structure.");

    // AI Smells
    const smells = detectAiSmells(code);
    aiSmells.push(...smells);

    // Deep Nesting Calculation
    const nestingDepth = calculateNestingDepth(code);

    return { issues, aiSmells, positives, nestingDepth };
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

export function detectFrameworkConfidence(code: string): { isConfident: boolean, framework?: string } {
    const isReact = /import\s+React|export\s+default\s+function|useState|useEffect|className=/i.test(code);
    const isVue = /<template>|<script\s+setup>|v-if|v-for/i.test(code);
    const isHtml = /<!DOCTYPE\s+html>|<head>|<body>|<section/i.test(code);

    if (isReact) return { isConfident: true, framework: 'react' };
    if (isVue) return { isConfident: true, framework: 'vue' };
    if (isHtml) return { isConfident: true, framework: 'html' };

    return { isConfident: false };
}

function checkAccessibility(code: string, html: string): IssueItem[] {
    const items: IssueItem[] = [];

    // Missing alt tags
    const imgMatches = code.match(/<img[^>]*>/gi) || [];
    imgMatches.forEach(img => {
        if (!img.match(/alt=/i) || img.match(/alt=["']\s*["']/i)) {
            items.push({
                id: 'acc-alt',
                category: 'accessibility',
                title: 'Missing Alt Attribute',
                severity: 'high',
                description: 'Images without descriptive alt text are invisible to screen readers.',
                whyItMatters: 'Essential for WCAG compliance and inclusive design.',
                suggestion: 'Add alt="description of image" to all <img> tags.',
                snippet: img
            });
        }
    });

    // Buttons without labels
    const btnMatches = code.match(/<button[^>]*>([\s\S]*?)<\/button>/gi) || [];
    btnMatches.forEach(btn => {
        const content = btn.replace(/<[^>]*>/g, '').trim();
        if (!content && !btn.match(/aria-label=/i)) {
            items.push({
                id: 'acc-btn-label',
                category: 'accessibility',
                title: 'Empty Button Label',
                severity: 'critical',
                description: 'Buttons with icons but no text must have an aria-label.',
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
            severity: 'medium',
            description: 'The <main> element helps screen readers jump to original content.',
            whyItMatters: 'Navigation is harder for keyboard and screen reader users.',
            suggestion: 'Wrap your primary content in a <main> tag.'
        });
    }

    return items;
}

function checkPerformance(code: string): IssueItem[] {
    const items: IssueItem[] = [];

    if (code.match(/style={{/i) || code.match(/style="/i)) {
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
    }

    const scriptMatches = code.match(/<script[^>]+src=['"][^'"]+['"]/gi) || [];
    if (scriptMatches.length > 0) {
        items.push({
            id: 'perf-external-scripts',
            category: 'performance',
            title: 'External Blocking Scripts',
            severity: 'medium',
            description: 'External scripts can block rendering and increase load time.',
            whyItMatters: 'Affects Largest Contentful Paint (LCP).',
            suggestion: 'Use async or defer attributes for external scripts.',
            snippet: scriptMatches[0]
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
            description: `${missingLazy} images are missing the loading="lazy" attribute.`,
            whyItMatters: 'Forces browser to download all images immediately, even off-screen.',
            suggestion: 'Add loading="lazy" to non-critical images.'
        });
    }

    if (missingSize > 0) {
        items.push({
            id: 'perf-img-size',
            category: 'performance',
            title: 'Missing Image Dimensions',
            severity: 'low',
            description: `${missingSize} images are missing width/height attributes.`,
            whyItMatters: 'Causes Layout Shift (CLS) as images load.',
            suggestion: 'Add explicit width and height to prevent layout jumps.'
        });
    }

    const styleBlocks = code.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
    styleBlocks.forEach(block => {
        const lineCount = block.split('\n').length;
        if (lineCount > 30) {
            items.push({
                id: 'perf-large-style',
                category: 'performance',
                title: 'Large Inline Style Block',
                severity: 'medium',
                description: `Inline style block is too large (${lineCount} lines).`,
                whyItMatters: 'Increases initial HTML size and prevents CSS caching.',
                suggestion: 'Move large style blocks to external .css files.'
            });
        }
    });

    const scriptBlocks = code.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
    scriptBlocks.forEach(block => {
        const lineCount = block.split('\n').length;
        if (lineCount > 20) {
            items.push({
                id: 'perf-heavy-script',
                category: 'performance',
                title: 'Large Inline Script',
                severity: 'medium',
                description: `Inline script block is too large (${lineCount} lines).`,
                whyItMatters: 'Increases HTML weight and blocks parser.',
                suggestion: 'Move heavy scripts to external files with defer/async.'
            });
        }
    });

    const tagCount = (code.match(/<[a-z1-6]+/gi) || []).length;
    if (tagCount > 150) {
        items.push({
            id: 'perf-dom-size',
            category: 'performance',
            title: 'Excessive DOM Size',
            severity: 'medium',
            description: `Found ${tagCount} tags. Large DOM trees impact rendering performance.`,
            whyItMatters: 'Increases memory usage and layout calculation time.',
            suggestion: 'Simplify structure or implement virtualization.'
        });
    }

    const consoleLogs = (code.match(/console\.log/gi) || []).length;
    if (consoleLogs > 3) {
        items.push({
            id: 'perf-console-logs',
            category: 'performance',
            title: 'Frequent Console Logging',
            severity: 'low',
            description: `Detected ${consoleLogs} console logs. Excessive logging impacts performance.`,
            whyItMatters: 'The console API syncs with the UI thread in some browsers.',
            suggestion: 'Remove logs or use a production-safe logging bridge.'
        });
    }

    const wideContainers = code.match(/(?:width|max-width):\s*(\d{4,})px/gi) || [];
    if (wideContainers.length > 0) {
        items.push({
            id: 'perf-wide-container',
            category: 'performance',
            title: 'Fixed Large Width Container',
            severity: 'medium',
            description: 'Detected container widths >= 1000px.',
            whyItMatters: 'Breaks responsiveness on smaller desktop screens and tablets.',
            suggestion: 'Use max-width with percentages or relative units like 90vw.'
        });
    }

    if (code.match(/<img[^>]*src={?['"]data:image/i)) {
        items.push({
            id: 'perf-base64',
            category: 'performance',
            title: 'Inlined Base64 Images',
            severity: 'medium',
            description: 'Large base64 strings increase initial HTML/JS size significantly.',
            whyItMatters: 'Increases Time to Interactive (TTI).',
            suggestion: 'Serve images as separate files or use lazy loading.'
        });
    }

    if (!code.match(/<link[^>]+rel=['"](?:preconnect|dns-prefetch)['"]/i) && code.includes('<head>')) {
        items.push({
            id: 'perf-missing-hints',
            category: 'performance',
            title: 'Missing Resource Hints',
            severity: 'low',
            description: 'No preconnect or dns-prefetch tags found for external assets.',
            whyItMatters: 'Increases asset discovery time on high-latency networks.',
            suggestion: 'Add <link rel="preconnect" href="..."> for CDNs or APIs.'
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
            severity: 'critical',
            description: 'Without a viewport meta tag, mobile browsers will render at desktop width.',
            whyItMatters: 'Essential for responsive behavior.',
            suggestion: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0" /> to <head>.'
        });
    }

    if (code.match(/width:\s*\d{3,}px/i)) {
        items.push({
            id: 'mob-fixed-width',
            category: 'mobile',
            title: 'Fixed Pixel Widths',
            severity: 'high',
            description: 'Detected large fixed pixel widths that will break on mobile.',
            whyItMatters: 'Causes horizontal scrolling on small screens.',
            suggestion: 'Use max-width: 100% or relative units like rem/vw.'
        });
    }



    return items;
}

function checkSecurity(code: string): IssueItem[] {
    const items: IssueItem[] = [];

    // CRITICAL: Malicious Injection Patterns
    const injectionPatterns = [
        { pattern: /<script/i, name: 'Script Tag Injection' },
        { pattern: /onerror=/i, name: 'Inline Error Handler' },
        { pattern: /onclick=/i, name: 'Inline Click Handler' },
        { pattern: /eval\(/i, name: 'Eval Execution' },
        { pattern: /new\s+Function\(/i, name: 'Dynamic Function Execution' },
        { pattern: /dangerouslySetInnerHTML/i, name: 'Unsafe HTML Injection' }
    ];

    injectionPatterns.forEach(p => {
        if (code.match(p.pattern)) {
            items.push({
                id: 'sec-critical-injection',
                category: 'security',
                title: `CRITICAL: ${p.name} Detected`,
                severity: 'critical',
                description: `Found potentially malicious pattern: ${p.name}. XAudit has flagged this as a severe security risk.`,
                whyItMatters: 'These patterns can lead to Remote Code Execution (RCE) or Cross-Site Scripting (XSS).',
                suggestion: 'Remove this code immediately. Do not run it.',
                snippet: code.match(p.pattern)?.[0]
            });
        }
    });

    const secrets = [
        { pattern: /AIza[0-9A-Za-z-_]{35}/, name: 'Google API Key' },
        { pattern: /sk-[0-9A-Za-z]{48}/, name: 'OpenAI Secret' },
        { pattern: /bearer\s+[0-9A-Za-z-_~.]{20,}/i, name: 'Auth Token' }
    ];

    secrets.forEach(s => {
        if (code.match(s.pattern)) {
            items.push({
                id: 'sec-leak',
                category: 'security',
                title: `Hardcoded ${s.name}`,
                severity: 'critical',
                description: `Found a potential ${s.name} hardcoded in the source.`,
                whyItMatters: 'Publicly exposed keys allow attackers to use your quota or data.',
                suggestion: 'Use environment variables (.env) for secrets.',
                snippet: code.match(s.pattern)?.[0]
            });
        }
    });

    // Unknown External Script Domains
    const scriptMatches = code.match(/<script[^>]*src=["']([^"']+)["']/gi) || [];
    // Trusted Domains for third-party scripts and APIs
    const TRUSTED_DOMAINS = [
        'cdnjs.cloudflare.com', 'unpkg.com', 'cdn.jsdelivr.net',
        'fonts.googleapis.com', 'google-analytics.com',
        'api.github.com', 'api.stripe.com', 'api.openai.com',
        'vercel.app', 'netlify.app'
    ];

    scriptMatches.forEach(script => {
        const srcMatch = script.match(/src=["']([^"']+)["']/i);
        if (srcMatch && srcMatch[1]) {
            const url = srcMatch[1];
            if (url.startsWith('http') || url.startsWith('//')) {
                const isSafe = TRUSTED_DOMAINS.some(domain => url.includes(domain));
                if (!isSafe) {
                    items.push({
                        id: 'sec-unknown-script',
                        category: 'security',
                        title: 'Unknown External Script',
                        severity: 'high',
                        description: 'Loading scripts from untrusted domains is a massive security risk.',
                        whyItMatters: 'Allows third-party code injection (Supply chain attack).',
                        suggestion: 'Host scripts locally or use a trusted CDN like cdnjs.',
                        snippet: script
                    });
                }
            }
        }
    });

    // STRICTOR: Suspicious Fetch
    const fetchMatches = code.match(/fetch\(['"](https?:\/\/[^'"]+)['"]/g) || [];
    fetchMatches.forEach(f => {
        const url = f.match(/['"](https?:\/\/[^'"]+)['"]/)?.[1];
        if (url && !TRUSTED_DOMAINS.some(d => url.includes(d))) {
            items.push({
                id: 'sec-suspicious-fetch',
                category: 'security',
                title: 'Suspicious Fetch Destination',
                severity: 'high',
                description: `Code is fetching from an unknown domain: ${url}`,
                whyItMatters: 'Could be exfiltrating data to an attacker-controlled server.',
                suggestion: 'Verify all external API domains and use a proxy if possible.'
            });
        }
    });

    // CONTEXT-AWARE CSP CHECK
    // Only flag if it's an HTML document
    if (code.match(/<html/i) || code.match(/<!DOCTYPE html>/i)) {
        const hasMetaCSP = code.match(/<meta\s+http-equiv=["']Content-Security-Policy["']/i);

        if (!hasMetaCSP) {
            // Check for High Risk Conditions
            const hasScripts = code.match(/<script/i);
            const hasInlineEvents = code.match(/\son[a-z]+=['"]/i); // onclick, onload, etc.
            const hasEval = code.match(/eval\(|new Function\(/i);
            const hasDangerHtml = code.match(/dangerouslySetInnerHTML/i);
            const hasInnerHtml = code.match(/\.innerHTML/i);

            const isHighRisk = hasScripts || hasInlineEvents || hasEval || hasDangerHtml || hasInnerHtml;

            if (isHighRisk) {
                items.push({
                    id: 'sec-no-csp-high',
                    category: 'security',
                    title: 'Missing CSP (High Risk)',
                    severity: 'high',
                    description: 'No Content-Security-Policy found in a page with scripts or unsafe patterns.',
                    whyItMatters: 'Scripts vary widely in trust. Without CSP, XSS is trivial.',
                    suggestion: 'Add a CSP meta tag or server header (Netlify/Vercel) to restrict script sources.'
                });
            } else {
                // Low Risk (Static Content)
                items.push({
                    id: 'sec-no-csp-low',
                    category: 'security', // Keep in security but low impact
                    title: 'Missing CSP Suggestion',
                    severity: 'low',
                    description: 'Content-Security-Policy is recommended even for static pages.',
                    whyItMatters: 'Prevents future injection attacks if content changes.',
                    suggestion: 'Consider adding a CSP header in your production environment (e.g. Vercel/Nginx).'
                });
            }
        }
    }

    return items;
}

function checkCodeQuality(code: string): IssueItem[] {
    const items: IssueItem[] = [];

    if (code.match(/eval\(|new Function\(/i)) {
        items.push({
            id: 'cq-eval',
            category: 'codeQuality',
            title: 'Use of eval()',
            severity: 'critical',
            description: 'Using eval() is a major code smell and security risk.',
            whyItMatters: 'Impossible to optimize, hard to debug, and dangerously insecure.',
            suggestion: 'Refactor logic to use JSON.parse or direct object access.'
        });
    }

    const inlineEvents = code.match(/\son[a-z]+=['"]/gi) || [];
    if (inlineEvents.length > 0) {
        items.push({
            id: 'cq-inline-event',
            category: 'codeQuality',
            title: 'Inline Event Handlers',
            severity: 'medium',
            description: `Found ${inlineEvents.length} inline event handlers (onclick, etc).`,
            whyItMatters: 'Violates separation of concerns and hinders maintainability.',
            suggestion: 'Use addEventListener or React event props instead.',
            snippet: inlineEvents[0]
        });
    }

    if (code.match(/console\.log/gi)) {
        const logs = (code.match(/console\.log/gi) || []).length;
        items.push({
            id: 'cq-console',
            category: 'codeQuality',
            title: 'Console Logs in Production',
            severity: 'low',
            description: `Found ${logs} console.log statements.`,
            whyItMatters: 'Clutters the user console and can leak sensitive information.',
            suggestion: 'Remove all console.log statements before deployment.'
        });
    }

    const inlineStyles = code.match(/\sstyle=['"]/gi) || [];
    if (inlineStyles.length > 0) {
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

    // Div Soup & Nesting Depth
    const divTokens = code.match(/<div|<\/div/gi) || [];
    const divCount = divTokens.filter(t => t.toLowerCase() === '<div').length;
    if (divCount > 25) {
        items.push({
            id: 'cq-div-soup',
            category: 'codeQuality',
            title: 'Excessive Div Count (Div Soup)',
            severity: 'medium',
            description: `Component uses ${divCount} div tags.`,
            whyItMatters: 'Semantic HTML is lost and DOM tree becomes unnecessarily heavy.',
            suggestion: 'Use semantic elements like <section>, <article>, or <header>.'
        });
    }

    // Heuristic nesting depth
    let maxDepth = 0;
    let currentDepth = 0;
    const tokens = code.match(/<[a-zA-Z1-6]+|<\/[a-zA-Z1-6]+/gi) || [];
    tokens.forEach(token => {
        if (token.startsWith('</')) {
            currentDepth = Math.max(0, currentDepth - 1);
        } else {
            currentDepth++;
            if (currentDepth > maxDepth) maxDepth = currentDepth;
        }
    });

    if (maxDepth > 8) {
        items.push({
            id: 'cq-nesting',
            category: 'codeQuality',
            title: 'Deeply Nested Structure',
            severity: 'high',
            description: `Maximum nesting depth is ${maxDepth}.`,
            whyItMatters: 'Makes code extremely difficult to follow and maintain.',
            suggestion: 'Break down large components into smaller, reusable sub-components.'
        });
    }

    const semanticTags = ['<section', '<article', '<header', '<footer', '<aside', '<nav', '<main'];
    const semanticCount = semanticTags.filter(tag => code.toLowerCase().includes(tag)).length;
    if (semanticCount === 0 && (code.match(/<div/gi) || []).length > 5) {
        items.push({
            id: 'cq-no-semantic',
            category: 'codeQuality',
            title: 'Lack of Semantic HTML',
            severity: 'medium',
            description: 'No semantic tags used for layout.',
            whyItMatters: 'Makes document structure opaque to both developers and machines.',
            suggestion: 'Replace structural <div> tags with semantic counterparts where applicable.'
        });
    }

    if (code.match(/const\s+\w+\s*=\s*(['"])(?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/.*)?\1/gi)) {
        items.push({
            id: 'cq-hardcoded-urls',
            category: 'codeQuality',
            title: 'Hardcoded API URLs',
            severity: 'low',
            description: 'Detected hardcoded absolute URLs for API or assets.',
            whyItMatters: 'Breaks local development and makes multi-environment setup difficult.',
            suggestion: 'Use environment variables or relative paths for internal resources.'
        });
    }

    return items;
}

function detectAiSmells(code: string): SmellItem[] {
    const smells: SmellItem[] = [];

    // 1. Placeholder / AI Signature Content
    if (code.match(/\/\/ AI generated|\/\/ This was created by|lorem ipsum|TODO:|FIXME:|\/\/ Fill this in/i)) {
        smells.push({
            title: 'Placeholder / Bot Content',
            severity: 'low',
            explanation: 'Unfiltered AI comments or placeholder data (Lorem Ipsum/TODOs) detected in source.',
            suggestion: 'Remove system-generated commentary and replace placeholders with real data.'
        });
    }

    // 2. Generic Grid Patterns (LLM favorite)
    if (code.match(/\b(container|row|col)\b/g)) {
        const gridPoints = (code.match(/\b(container|row|col)\b/g) || []).length;
        if (gridPoints > 5) {
            smells.push({
                title: 'Generic Grid Overuse',
                severity: 'low',
                explanation: 'Typical LLM pattern using container/row/col structures excessively.',
                suggestion: 'Use CSS Grid or Flexbox for more semantic, modern layouts.'
            });
        }
    }

    // 3. Excessive Div Ratio
    const divs = (code.match(/<div/gi) || []).length;
    const semantic = ['<section', '<article', '<header', '<footer', '<aside', '<nav', '<main'].filter(tag => code.toLowerCase().includes(tag)).length;
    if (divs > 10 && semantic === 0) {
        smells.push({
            title: 'Excessive Div-to-Semantic Ratio',
            severity: 'medium',
            explanation: 'High reliance on nested divs without any structural semantic tags.',
            suggestion: 'Transition layout containers to semantic elements like <header> or <main>.'
        });
    }

    // 4. Repeated Utility Blocks (Tailwind repetitive noise)
    const utilityPatterns = code.match(/class=['"][^'"]*(?:flex|items-center|justify-between|bg-|p-|m-)[^'"]*['"]/g) || [];
    const uniqueShortPatterns = new Set(utilityPatterns.map(p => p.slice(0, 40))).size;
    if (utilityPatterns.length > 8 && uniqueShortPatterns < (utilityPatterns.length / 2)) {
        smells.push({
            title: 'Repetitive Class Blocks',
            severity: 'low',
            explanation: 'Detected multiple identical or highly similar Tailwind/CSS class sequences.',
            suggestion: 'Consolidate repetitive utility strings into reusable components or CSS classes.'
        });
    }

    // 5. Duplicate Element Blocks
    const matches = code.match(/<(button|a|input|li|img|div)[^>]*>[\s\S]*?<\/\1>|<(img|input)[^>]*>/gi) || [];
    if (matches.length > 3) {
        const counts: Record<string, number> = {};
        matches.forEach(m => {
            const clean = m.trim().replace(/\s+/g, ' ');
            if (clean.length > 10) { // Ignore tiny things like <div></div>
                counts[clean] = (counts[clean] || 0) + 1;
            }
        });
        const hasDuplicate = Object.values(counts).some(c => c >= 3);
        if (hasDuplicate) {
            smells.push({
                title: 'Identical Duplicate Components',
                severity: 'medium',
                explanation: 'Multiple identical structural blocks detected (likely AI copy-paste).',
                suggestion: 'Map over an array of data instead of manual duplication.'
            });
        }
    }

    // 6. Deep Nesting Smell (Lower threshold than the "Issue")
    let currentDepth = 0;
    let maxDepth = 0;
    const selfClosing = ['img', 'br', 'hr', 'input', 'link', 'meta'];
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
    if (maxDepth > 6) {
        smells.push({
            title: 'Deep Nesting Smell',
            severity: 'low',
            explanation: `Nesting depth of ${maxDepth} is a common LLM structural smell.`,
            suggestion: 'Flatten the component tree by extracting logic into helpers.'
        });
    }

    return smells;
}
