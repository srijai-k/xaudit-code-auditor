
import { validateInput } from '../audit-engine';

interface TestCase {
    name: string;
    input: string;
    shouldBeValid: boolean;
    expectedReasonPart?: string;
}

export const MALICIOUS_TEST_CASES: TestCase[] = [
    {
        name: 'Basic XSS Script',
        input: '<script>alert(1)</script>',
        shouldBeValid: false,
        expectedReasonPart: 'Not enough code' // Fails length check first
    },
    {
        name: 'Long XSS Script',
        input: '<script>alert("This is a very long script content to bypass length check and see if it catches the script tag itself")</script>',
        shouldBeValid: true // It is valid code structure, but should be flagged by checkSecurity
    },
    {
        name: 'Img OnError',
        input: '<img src=x onerror=alert(1) />',
        shouldBeValid: false,
        expectedReasonPart: 'Not enough code'
    },
    {
        name: 'Long Img OnError',
        input: '<div className="p-4"><img src="invalid.jpg" onerror="alert(\'XSS\')" alt="User provided image with malicious payload" /></div>',
        shouldBeValid: true // Valid structure, security check handles it
    },
    {
        name: 'React DangerouslySetInnerHTML',
        input: `
export default function MaliciousComponent() {
    const html = "<img src=x onerror=alert(1)>";
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
        `,
        shouldBeValid: true
    },
    {
        name: 'Eval Injection',
        input: `
function calculate(input) {
    // Dangerous eval usage
    return eval(input);
    console.log("This is filler text to ensure we meet the minimum length requirements for the audit engine.");
}
        `,
        shouldBeValid: true
    },
    {
        name: 'JavaScript URI',
        input: '<a href="javascript:alert(1)">Click me for a surprise prize! This text is just padding.</a>',
        shouldBeValid: true
    },
    {
        name: 'Constructor Attack',
        input: `
const func = new Function("alert(1)");
func();
// Detailed comments to ensure sufficient length for the audit engine to process this input.
        `,
        shouldBeValid: true
    }
];

export function runSecurityTestSuite() {
    console.group('🛡️ XAudit Security Test Suite');
    let passed = 0;

    MALICIOUS_TEST_CASES.forEach(test => {
        const result = validateInput(test.input);
        const success = result.isValid === test.shouldBeValid;

        if (!success) {
            console.error(`❌ FAILED: ${test.name}`);
            console.log(`   Expected Valid: ${test.shouldBeValid}, Got: ${result.isValid}`);
            if (result.reason) console.log(`   Reason: ${result.reason}`);
        } else {
            // If it should fail validation, check reason
            if (!test.shouldBeValid && test.expectedReasonPart) {
                if (result.reason?.includes(test.expectedReasonPart)) {
                    console.log(`✅ PASSED: ${test.name}`);
                    passed++;
                } else {
                    console.error(`❌ FAILED: ${test.name} (Wrong reason)`);
                    console.log(`   Expected reason containing: "${test.expectedReasonPart}"`);
                    console.log(`   Got: "${result.reason}"`);
                }
            } else {
                console.log(`✅ PASSED: ${test.name}`);
                passed++;
            }
        }
    });

    console.log(`\nTest Results: ${passed}/${MALICIOUS_TEST_CASES.length} Passed`);
    console.groupEnd();
}
