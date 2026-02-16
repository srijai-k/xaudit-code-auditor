interface MaliciousPattern {
    pattern: RegExp;
    severity: 'critical' | 'high' | 'medium';
    description: string;
    fix: string;
}

const MALICIOUS_PATTERNS: MaliciousPattern[] = [
    {
        pattern: /\beval\s*\(/gi,
        severity: 'critical',
        description: 'eval() detected - allows arbitrary code execution',
        fix: 'Remove eval() and use safer alternatives like JSON.parse() or Function constructors with validation'
    },
    {
        pattern: /new\s+Function\s*\(/gi,
        severity: 'high',
        description: 'Function() constructor - potential code injection',
        fix: 'Avoid dynamic code execution. Use predefined functions instead'
    },
    {
        pattern: /dangerouslySetInnerHTML\s*=\s*\{\{/gi,
        severity: 'critical',
        description: 'dangerouslySetInnerHTML without sanitization',
        fix: 'Sanitize HTML with DOMPurify before rendering'
    },
    {
        pattern: /on(click|load|error|mouse\w+)\s*=\s*["']/gi,
        severity: 'high',
        description: 'Inline event handlers detected - XSS vector',
        fix: 'Use addEventListener() instead of inline event handlers'
    },
    {
        pattern: /atob\s*\(|btoa\s*\(/gi,
        severity: 'medium',
        description: 'Base64 encoding/decoding - potential obfuscation',
        fix: 'Avoid base64 encoding for code. Keep logic readable'
    },
    {
        pattern: /<script[^>]*src\s*=\s*["']https?:\/\/(?!localhost|127\.0\.0\.1)([^"']+)["']/gi,
        severity: 'high',
        description: 'External script from untrusted source',
        fix: 'Only load scripts from trusted CDNs or self-hosted sources'
    },
    {
        pattern: /(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE)\s+.*\s+(FROM|INTO|TABLE)/gi,
        severity: 'critical',
        description: 'SQL query pattern detected - potential SQL injection',
        fix: 'Use parameterized queries or ORM instead of string concatenation'
    },
    {
        pattern: /<iframe[^>]*src\s*=/gi,
        severity: 'medium',
        description: 'iframe detected - potential security risk',
        fix: 'Ensure iframe sources are trusted and use sandbox attribute'
    },
    {
        pattern: /document\.write\s*\(/gi,
        severity: 'high',
        description: 'document.write() - can inject malicious content',
        fix: 'Use safer DOM manipulation methods like createElement()'
    },
    {
        pattern: /crypto|miner|coinhive/gi,
        severity: 'critical',
        description: 'Potential crypto mining code detected',
        fix: 'Remove any cryptocurrency mining scripts'
    }
];

export function detectMaliciousCode(code: string): {
    found: boolean;
    issues: Array<{
        pattern: string;
        severity: string;
        description: string;
        fix: string;
        line?: number;
    }>;
} {
    const issues: any[] = [];

    for (const { pattern, severity, description, fix } of MALICIOUS_PATTERNS) {
        const matches = code.matchAll(pattern);

        for (const match of matches) {
            // Find line number
            const lineNumber = code.substring(0, match.index).split('\n').length;

            issues.push({
                pattern: match[0],
                severity,
                description,
                fix,
                line: lineNumber
            });
        }
    }

    return {
        found: issues.length > 0,
        issues
    };
}
