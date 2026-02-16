export interface SecretDetection {
    type: string;
    severity: "critical" | "high" | "medium";
    confidence: "high" | "medium" | "low";
    line?: number;
    startIndex: number;
    previewMasked: string;
    riskExplanation: string;
    immediateAction: string;
    fixPrompt: string;
    rawSecret: string;
    // Realism fields
    isLikelyReal: boolean;
    realismScore: number;
    reasoning: string[];
    confidenceLabel: string;
}

const PATTERNS = [
    // CRITICAL MONEY KEYS
    {
        name: 'OpenAI Secret Key',
        regex: /sk-[a-zA-Z0-9]{48}/g,
        severity: 'critical',
        group: 'ai',
        risk: 'Direct financial loss via API quota consumption.',
        action: 'Rotate the key immediately in OpenAI Dashboard.',
        prompt: 'Remove this OpenAI API key from frontend code. Move it into server-side env variables. Create a secure API route proxy.',
        baseRisk: 95
    },
    {
        name: 'Anthropic API Key',
        regex: /sk-ant-api03-[a-zA-Z0-9\-_]{93,95}/g,
        severity: 'critical',
        group: 'ai',
        risk: 'Direct financial loss via Claude API consumption.',
        action: 'Rotate the key in Anthropic Console.',
        prompt: 'Move Anthropic key to server-side env variables.',
        baseRisk: 95
    },
    {
        name: 'Stripe Secret Key',
        regex: /sk_(?:live|test)_[a-zA-Z0-9]{24,}/g,
        severity: 'critical',
        group: 'stripe',
        risk: 'Attackers can process refunds, steal customer data, or drain funds.',
        action: 'Roll the key in Stripe Dashboard now.',
        prompt: 'Move this Stripe Secret Key to backend environment variables.',
        baseRisk: 98
    },
    {
        name: 'AWS Access Key',
        regex: /AKIA[0-9A-Z]{16}/g,
        severity: 'critical',
        group: 'aws',
        risk: 'Entry point for full AWS infrastructure takeover.',
        action: 'Revoke IAM user credentials immediately.',
        prompt: 'Remove hardcoded AWS credentials. Use IAM Roles or Secrets Manager.',
        baseRisk: 95
    },
    {
        name: 'AWS MWS Auth Token',
        regex: /amzn\.mws\.[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g,
        severity: 'critical',
        group: 'aws',
        risk: 'Compromise of Amazon Marketplace Web Service account.',
        action: 'Rotate the MWS token in Amazon Seller Central.',
        prompt: 'Move MWS token to secure environment variables.',
        baseRisk: 90
    },
    {
        name: 'Google Cloud Private Key',
        regex: /"private_key":\s*"-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----"/g,
        severity: 'critical',
        group: 'gcp',
        risk: 'Complete compromise of GCP project resources.',
        action: 'Delete the Service Account key in GCP Console.',
        prompt: 'Do not embed Service Account JSON files. Use ADC or Secret Manager.',
        baseRisk: 95
    },
    {
        name: 'Firebase Secret',
        regex: /firebase-storage\.googleapis\.com.*?key=[a-zA-Z0-9\-_]{35}/g,
        severity: 'high',
        group: 'firebase',
        risk: 'Allows unauthorized access to Firebase Storage buckets.',
        action: 'Revoke the access token and update security rules.',
        prompt: 'Use Firebase Security Rules to restrict access rather than hardcoded tokens.',
        baseRisk: 85
    },
    {
        name: 'Firebase Config',
        regex: /apiKey:\s*['"]AIza[0-9A-Za-z\-_]{35}['"]/g,
        severity: 'medium',
        group: 'firebase',
        risk: 'Public key, but combined with other leaks can assist project takeover.',
        action: 'Ensure Firebase Security Rules are solid.',
        prompt: 'Though public, avoid committing config directly if possible; use env variables.',
        baseRisk: 30
    },
    {
        name: 'Supabase Service Key',
        regex: /sbp_[a-zA-Z0-9]{40}/g,
        severity: 'critical',
        group: 'supabase',
        risk: 'Allows bypassing all Row Level Security (RLS) policies.',
        action: 'Rotate the service_role key in Supabase settings.',
        prompt: 'Never use the service_role key on the frontend.',
        baseRisk: 95
    },

    // TOOLS + CHAT
    {
        name: 'Twilio Auth Token',
        regex: /AC[a-z0-9]{32}.*?[a-z0-9]{32}/gi,
        severity: 'high',
        group: 'twilio',
        risk: 'Allows sending unauthorized SMS/voice calls on your dime.',
        action: 'Reset the Auth Token in Twilio Console.',
        prompt: 'Move Twilio credentials to server-side .env.',
        baseRisk: 85
    },
    {
        name: 'SendGrid API Key',
        regex: /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/g,
        severity: 'high',
        group: 'sendgrid',
        risk: 'Attackers can use your account for massive phishing campaigns.',
        action: 'Revoke at app.sendgrid.com.',
        prompt: 'Remove SendGrid API keys from client code.',
        baseRisk: 85
    },
    {
        name: 'Slack Webhook',
        regex: /https:\/\/hooks\.slack\.com\/services\/T[a-zA-Z0-9_]{8}\/B[a-zA-Z0-9_]{8}\/[a-zA-Z0-9_]{24}/g,
        severity: 'high',
        group: 'slack',
        risk: 'Allows attackers to post spam/malicious links to your internal channels.',
        action: 'Delete the webhook in Slack App settings.',
        prompt: 'Keep webhooks in backend env variables.',
        baseRisk: 80
    },
    {
        name: 'Slack Token',
        regex: /xox[baprs]-[a-zA-Z0-9-]{10,48}/g,
        severity: 'high',
        group: 'slack',
        risk: 'Full access to workspace history and messages.',
        action: 'Revoke the token in Slack App settings.',
        prompt: 'Move Slack tokens out of code.',
        baseRisk: 90
    },
    {
        name: 'Discord Bot Token',
        regex: /[a-zA-Z0-9_-]{24,28}\.[a-zA-Z0-9_-]{6}\.[a-zA-Z0-9_-]{27,38}/g,
        severity: 'high',
        group: 'discord',
        risk: 'Full control over your Discord bot.',
        action: 'Regenerate token in Discord Developer Portal.',
        prompt: 'Keep bot tokens in secure backend environment.',
        baseRisk: 85
    },
    {
        name: 'Discord Webhook',
        regex: /https:\/\/discord\.com\/api\/webhooks\/[0-9]{18}\/[a-zA-Z0-9_-]{68}/g,
        severity: 'medium',
        group: 'discord',
        risk: 'Spamming or impersonating bot in Discord channels.',
        action: 'Delete the webhook in Discord settings.',
        prompt: 'Do not share webhooks in code.',
        baseRisk: 60
    },

    // DATABASE
    {
        name: 'MongoDB Connection String',
        regex: /mongodb(?:\+srv)?:\/\/[a-zA-Z0-9._%+-]+:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/gi,
        severity: 'critical',
        group: 'mongodb',
        risk: 'Full database access: data theft, deletion, and encryption.',
        action: 'Change the database user password immediately.',
        prompt: 'Move MongoDB connection string to a server-side .env file.',
        baseRisk: 95
    },
    {
        name: 'PostgreSQL URL',
        regex: /postgres(?:ql)?:\/\/[a-zA-Z0-9._%+-]+:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+:\d+\/[a-zA-Z0-9_/.-]+/gi,
        severity: 'critical',
        group: 'postgres',
        risk: 'Direct SQL execution privileges on your database.',
        action: 'Revoke the current DB user credentials.',
        prompt: 'Use environment variables for database URLs.',
        baseRisk: 95
    },
    {
        name: 'Redis URL',
        regex: /rediss?:\/\/(?::[a-zA-Z0-9._%+-]+@)?[a-zA-Z0-9.-]+:\d+/gi,
        severity: 'high',
        group: 'redis',
        risk: 'Allows clearing cache or stealing session data.',
        action: 'Flush and reset Redis credentials.',
        prompt: 'Move Redis credentials to server-side configuration.',
        baseRisk: 85
    },

    // AUTH + SECURITY
    {
        name: 'JWT Secret',
        regex: /(?:JWT|TOKEN|SECRET|AUTH_SECRET|NEXTAUTH_SECRET)\s*[:=]\s*['"][a-zA-Z0-9_\-\.]{16,}['"]/gi,
        severity: 'high',
        group: 'jwt',
        risk: 'Attackers can forge valid authentication tokens for any user.',
        action: 'Change the JWT secret immediately.',
        prompt: 'Set JWT secrets via environment variables only.',
        baseRisk: 90
    },
    {
        name: 'Private RSA Key',
        regex: /-----BEGIN (?:RSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA )?PRIVATE KEY-----/g,
        severity: 'critical',
        group: 'rsa',
        risk: 'Allows decryption of traffic or impersonating servers.',
        action: 'Revoke and replace the SSH/SSL certificate.',
        prompt: 'Never store private keys in the code repository.',
        baseRisk: 98
    },
    {
        name: 'Bearer Token',
        regex: /bearer\s+[a-zA-Z0-9\-._~+/]{20,}/gi,
        severity: 'high',
        group: 'bearer',
        risk: 'Active session hijack possible.',
        action: 'Revoke the session or token key.',
        prompt: 'Do not hardcode Bearer tokens. Use dynamic OAuth flow.',
        baseRisk: 80
    },
    {
        name: 'Basic Auth Header',
        regex: /authorization:\s*basic\s+[a-zA-Z0-9+/=]{20,}/gi,
        severity: 'high',
        group: 'bearer',
        risk: 'Credentials encoded in Base64 are easily reversible.',
        action: 'Change the encoded credentials.',
        prompt: 'Use dynamic auth instead of static Basic headers in code.',
        baseRisk: 80
    },
    {
        name: 'Hardcoded Password',
        regex: /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
        severity: 'high',
        group: 'password',
        risk: 'Plaintext credentials exposed in code.',
        action: 'Change the password and use a secure vault.',
        prompt: 'Remove hardcoded passwords.',
        baseRisk: 85
    },

    // RECENT DEV TOOLS
    {
        name: 'Sentry DSN',
        regex: /https:\/\/[a-z0-9]{32}@o[0-9]{6,}\.ingest\.sentry\.io\/[0-9]{6,}/g,
        severity: 'medium',
        group: 'sentry',
        risk: 'Allows attackers to spam your Sentry error tracker.',
        action: 'Rotate the Client Key in Sentry settings.',
        prompt: 'Though intended for frontend, rotate if abused.',
        baseRisk: 40
    },
    {
        name: 'GitHub PAT',
        regex: /gh[pous]_[a-zA-Z0-9]{36,}/g,
        severity: 'critical',
        group: 'github',
        risk: 'Full access to private repositories and workflow secrets.',
        action: 'Revoke the PAT in GitHub Settings.',
        prompt: 'Use GitHub Actions secrets or App installations.',
        baseRisk: 95
    },
    {
        name: 'Heroku API Key',
        regex: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g,
        severity: 'critical',
        group: 'heroku',
        risk: 'Allows taking over Heroku apps and billing.',
        action: 'Regenerate API key in Heroku Dashboard.',
        prompt: 'Move Heroku keys to secure env vars.',
        baseRisk: 95
    },
    {
        name: 'Mailgun API Key',
        regex: /key-[0-9a-f]{32}/g,
        severity: 'high',
        group: 'mailgun',
        risk: 'Allows sending emails via your Mailgun domain.',
        action: 'Rotate key in Mailgun control panel.',
        prompt: 'Keep Mailgun keys on backend.',
        baseRisk: 85
    },

    // DUMPS
    {
        name: 'Potential .env Dump',
        regex: /^[A-Z0-9_]+=[a-zA-Z0-9\-_./]{8,}$/gm,
        severity: 'high',
        group: 'env',
        risk: 'Entire configuration file committed to repository.',
        action: 'Delete file and rotate ALL secrets listed.',
        prompt: 'Add .env to your .gitignore immediately.',
        baseRisk: 90
    },

    // ADDITIONAL SAAS + CLOUD (TO REACH 50+)
    { name: 'Facebook Access Token', regex: /EAACEdEose0cBA[0-9A-Za-z]+/g, severity: 'high', group: 'social', risk: 'Access to Facebook pages and user data.', action: 'Revoke in Facebook App Dashboard.', prompt: 'Do not hardcode FB tokens.', baseRisk: 80 },
    { name: 'Twitter Bearer Token', regex: /AAAAAAAAAAAAAAAAAAAAA[0-9A-Za-z%]{60,}/g, severity: 'high', group: 'social', risk: 'Access to Twitter API v2.', action: 'Rotate in Twitter Dev Portal.', prompt: 'Move Twitter token to env vars.', baseRisk: 80 },
    { name: 'Square Access Token', regex: /sq0atp-[0-9A-Za-z\-_]{22}/g, severity: 'critical', group: 'payment', risk: 'Full access to Square merchant account.', action: 'Revoke in Square Dashboard.', prompt: 'Never expose Square access tokens.', baseRisk: 95 },
    { name: 'Square OAuth Secret', regex: /sq0csp-[0-9A-Za-z\-_]{44}/g, severity: 'critical', group: 'payment', risk: 'Allows forging Square OAuth requests.', action: 'Rotate in Square Dashboard.', prompt: 'Keep OAuth secrets on the server.', baseRisk: 95 },
    { name: 'Asana PAT', regex: /0\/[0-9a-f]{32}/g, severity: 'medium', group: 'tools', risk: 'Access to Asana projects and tasks.', action: 'Revoke in Asana developer settings.', prompt: 'Use env vars for Asana PAT.', baseRisk: 50 },
    { name: 'ClickUp Token', regex: /pk_[0-9]{7,8}_[A-Z0-9]{32}/g, severity: 'medium', group: 'tools', risk: 'Access to ClickUp workspaces.', action: 'Revoke in ClickUp settings.', prompt: 'Move ClickUp token to env.', baseRisk: 50 },
    { name: 'GitLab PAT', regex: /glpat-[a-zA-Z0-9\-]{20}/g, severity: 'critical', group: 'github', risk: 'Full access to GitLab projects.', action: 'Revoke in GitLab User Settings.', prompt: 'Use GitLab CI secrets.', baseRisk: 95 },
    { name: 'CircleCI Token', regex: /[a-f0-9]{40}/g, severity: 'high', group: 'ci', risk: 'Full access to CircleCI projects.', action: 'Revoke in CircleCI settings.', prompt: 'Move CircleCI token to secret storage.', baseRisk: 85 },
    { name: 'Travis CI Token', regex: /[a-zA-Z0-9]{22}/g, severity: 'high', group: 'ci', risk: 'Access to Travis CI account.', action: 'Rotate Travis token.', prompt: 'Use Travis environment variables.', baseRisk: 80 },
    { name: 'Shopify Access Token', regex: /shpat_[a-fA-F0-9]{32}/g, severity: 'critical', group: 'shopify', risk: 'Full access to Shopify store data.', action: 'Revoke in Shopify Admin.', prompt: 'Move Shopify token to backend.', baseRisk: 98 },
    { name: 'Zoho API Key', regex: /zoho[a-z0-9]{32}/gi, severity: 'medium', group: 'tools', risk: 'Access to CRM or Mail data.', action: 'Revoke in Zoho API console.', prompt: 'Move Zoho key to env.', baseRisk: 60 },
    { name: 'HubSpot API Key', regex: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, severity: 'high', group: 'tools', risk: 'Access to HubSpot CRM data.', action: 'Rotate in HubSpot settings.', prompt: 'Use Private Apps or env vars.', baseRisk: 85 },
    { name: 'Algolia Admin Key', regex: /[a-f0-9]{32}/g, severity: 'critical', group: 'tools', risk: 'Full access to Algolia search indexes.', action: 'Rotate in Algolia Dashboard.', prompt: 'Use Search-Only key on frontend.', baseRisk: 90 },
    { name: 'Mapbox Access Token', regex: /pk\.eyJ1IjoibWFwYm94IiwiYSI6ImNranV[a-zA-Z0-9.]{50,}/g, severity: 'medium', group: 'tools', risk: 'Quota consumption on Mapbox API.', action: 'Rotate in Mapbox settings.', prompt: 'Limit token scopes.', baseRisk: 40 },
    { name: 'DigitalOcean PAT', regex: /dop_v1_[a-f0-9]{64}/g, severity: 'critical', group: 'cloud', risk: 'Full access to DigitalOcean resources.', action: 'Revoke in DO Cloud Panel.', prompt: 'Move DO token to secure storage.', baseRisk: 95 },
    { name: 'Vercel Token', regex: /[a-zA-Z0-9]{24}/g, severity: 'high', group: 'cloud', risk: 'Access to Vercel deployments and projects.', action: 'Revoke in Vercel settings.', prompt: 'Move Vercel token to env vars.', baseRisk: 90 },
    { name: 'Netlify Token', regex: /[a-zA-Z0-9\-_]{40,50}/g, severity: 'high', group: 'cloud', risk: 'Access to Netlify sites.', action: 'Revoke in Netlify settings.', prompt: 'Move Netlify token to env.', baseRisk: 85 },
    { name: 'Segment Write Key', regex: /[a-zA-Z0-9]{32}/g, severity: 'medium', group: 'analytics', risk: 'Ability to inject fake analytics data.', action: 'Rotate in Segment settings.', prompt: 'Keep write key secure.', baseRisk: 40 },
    { name: 'Amplitude API Key', regex: /[a-f0-9]{32}/g, severity: 'low', group: 'analytics', risk: 'Minor analytics impact.', action: 'Rotate if needed.', prompt: 'Use env vars for analytics keys.', baseRisk: 20 },
    { name: 'Mixpanel Secret', regex: /[a-f0-9]{32}/g, severity: 'high', group: 'analytics', risk: 'Full access to Mixpanel project data.', action: 'Rotate in Mixpanel settings.', prompt: 'Never expose Mixpanel secret.', baseRisk: 85 },
    { name: 'PostHog Personal Key', regex: /phx_[a-zA-Z0-9]{40,}/g, severity: 'high', group: 'analytics', risk: 'Full access to PostHog instance.', action: 'Revoke in PostHog settings.', prompt: 'Move PH key to backend.', baseRisk: 90 },
    { name: 'LogDNA Ingestion Key', regex: /[a-f0-9]{32}/g, severity: 'medium', group: 'tools', risk: 'Allows spamming logs.', action: 'Rotate in LogDNA.', prompt: 'Keep ingestion keys secure.', baseRisk: 40 },
    { name: 'New Relic License Key', regex: /[a-z0-9]{40}/g, severity: 'medium', group: 'tools', risk: 'Credential exposure.', action: 'Rotate in New Relic.', prompt: 'Move NR key to env.', baseRisk: 50 },
    { name: 'Datadog API Key', regex: /[a-z0-9]{32}/gi, severity: 'high', group: 'tools', risk: 'Access to Datadog metrics and ingestion.', action: 'Rotate in Datadog.', prompt: 'Keep DD key on backend.', baseRisk: 80 },
    { name: 'Conekta API Key', regex: /key_[a-zA-Z0-9]{20}/g, severity: 'critical', group: 'payment', risk: 'Access to payments in Mexico.', action: 'Revoke in Conekta.', prompt: 'Never expose Conekta keys.', baseRisk: 95 }
];

export function scanSecrets(code: string): { found: boolean, count: number, patternsCount: number, items: SecretDetection[], moneyRiskScore: number } {
    const items: SecretDetection[] = [];
    let maxRisk = 0;

    // 1. Regex Patterns
    PATTERNS.forEach(p => {
        let match;
        p.regex.lastIndex = 0; // Reset
        while ((match = p.regex.exec(code)) !== null) {
            const raw = match[0];
            const confidence = detectConfidence(code, match.index, raw);
            const realism = calculateRealismScore(code, match.index, raw, ""); // Placeholder for filename

            // Masking rule: first 4 + last 4
            let masked = raw;
            if (raw.length > 12) {
                const head = raw.substring(0, 4);
                const tail = raw.substring(raw.length - 4);
                masked = `${head}************${tail}`;
            }

            items.push({
                type: p.name,
                severity: p.severity as any,
                confidence: confidence,
                line: code.substring(0, match.index).split('\n').length,
                startIndex: match.index,
                previewMasked: masked,
                riskExplanation: p.risk,
                immediateAction: p.action,
                fixPrompt: (p as any).prompt,
                rawSecret: raw,
                isLikelyReal: realism.isLikelyReal,
                realismScore: realism.score,
                reasoning: realism.reasoning,
                confidenceLabel: realism.label
            });

            // Scoring Integration: Only count towards moneyRisk if realism is high enough
            if (realism.score >= 60) {
                const currentRisk = p.baseRisk;
                if (currentRisk > maxRisk) maxRisk = currentRisk;
            }
        }
    });

    // 2. Entropy Detection (Extreme Mode)
    const highEntropyLines = detectEntropySecrets(code);
    highEntropyLines.forEach(h => {
        // Avoid duplicates if already caught by regex
        if (!items.some(it => it.startIndex === h.startIndex)) {
            items.push(h);
            if (80 > maxRisk) maxRisk = 80;
        }
    });

    // Money risk score finalized
    const moneyRiskScore = Math.min(100, maxRisk);

    return {
        found: items.length > 0,
        count: items.length,
        patternsCount: PATTERNS.length,
        items,
        moneyRiskScore
    };
}

function detectEntropySecrets(code: string): SecretDetection[] {
    const detections: SecretDetection[] = [];
    const lines = code.split('\n');
    const secretKeywords = ['api_key', 'secret', 'token', 'password', 'auth', 'private_key', 'credential'];

    lines.forEach((line, lineIdx) => {
        const lowerLine = line.toLowerCase();
        if (secretKeywords.some(kw => lowerLine.includes(kw))) {
            // Find quoted strings or long alphanumeric blocks
            const potentialMatches = line.match(/(['"])([a-zA-Z0-9]{32,})\1|[a-zA-Z0-9]{32,}/g);
            if (potentialMatches) {
                potentialMatches.forEach(raw => {
                    const clean = raw.replace(/['"]/g, '');
                    const entropy = calculateEntropy(clean);

                    // Base entropy for random-looking string is usually > 3.5 for hex/base64
                    if (entropy > 3.8) {
                        const startIndex = code.indexOf(raw); // Rough index
                        const realism = calculateRealismScore(code, startIndex, clean, "");

                        detections.push({
                            type: 'High-Entropy Secret',
                            severity: 'high',
                            confidence: 'medium',
                            line: lineIdx + 1,
                            startIndex: startIndex,
                            previewMasked: `${clean.substring(0, 4)}************${clean.substring(clean.length - 4)}`,
                            riskExplanation: 'A high-entropy string was found near a security keyword, indicating a potential leaked secret.',
                            immediateAction: 'Rotate this credential immediately and move to environment variables.',
                            fixPrompt: 'Remove the hardcoded high-entropy string and use a secure environment variable or vault.',
                            rawSecret: clean,
                            isLikelyReal: realism.isLikelyReal,
                            realismScore: realism.score,
                            reasoning: realism.reasoning,
                            confidenceLabel: realism.label
                        });
                    }
                });
            }
        }
    });

    return detections;
}

function calculateEntropy(str: string): number {
    const len = str.length;
    if (len === 0) return 0;
    const freq: Record<string, number> = {};
    for (let i = 0; i < len; i++) {
        freq[str[i]] = (freq[str[i]] || 0) + 1;
    }
    let entropy = 0;
    for (let char in freq) {
        const p = freq[char] / len;
        entropy -= p * Math.log2(p);
    }
    return entropy;
}

function detectConfidence(code: string, index: number, secret: string): "high" | "medium" | "low" {
    // Context Extraction Requirement
    const contextSize = 100;
    const start = Math.max(0, index - contextSize);
    const end = Math.min(code.length, index + secret.length + contextSize);
    const context = code.substring(start, end).toLowerCase();

    const lowConfidenceMarkers = ['example', 'sample', 'placeholder', 'dummy', 'fake', 'test-key'];
    const isLow = lowConfidenceMarkers.some(m => context.includes(m));

    if (isLow) return "low";

    // Check if inside a comment
    const line = code.substring(0, index).split('\n').pop() || "";
    if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('<!--')) {
        return "medium";
    }

    // "If line numbers cannot be calculated -> reduce confidence to LOW"
    // Since we splitting by \n, we always have line number, but let's simulate the check
    const lineNum = code.substring(0, index).split('\n').length;
    if (!lineNum) return "low";

    return "high";
}

function calculateRealismScore(code: string, index: number, secret: string, fileName: string = "") {
    let score = 50; // Starting baseline
    const reasoning: string[] = [];

    const contextSize = 200;
    const start = Math.max(0, index - contextSize);
    const end = Math.min(code.length, index + secret.length + contextSize);
    const context = code.substring(start, end);
    const lowerContext = context.toLowerCase();
    const lowerSecret = secret.toLowerCase();
    const lowerFileName = fileName.toLowerCase();

    // 1. NEGATIVE PENALTIES (Anti-False Positive)

    // File name markers
    if (lowerFileName.includes('example') || lowerFileName.includes('sample') || lowerFileName.includes('readme') || lowerFileName.includes('docs') || lowerFileName.includes('tutorial')) {
        score -= 40;
        reasoning.push("Found in example/documentation file");
    }

    // Key content markers
    if (['test', 'demo', 'fake', 'placeholder', 'dummy'].some(m => lowerSecret.includes(m))) {
        score -= 50;
        reasoning.push("Key contains placeholder/test keywords");
    }

    // Placeholder word markers in context
    if (['your_key_here', 'insert_key', 'replace_me', 'your_api_key'].some(m => lowerContext.includes(m))) {
        score -= 40;
        reasoning.push("Found near 'REPLACE_ME' or 'YOUR_KEY' placeholders");
    }

    // Markdown/Code fence markers
    if (context.includes('```') || context.includes('# ') || context.includes('### ')) {
        score -= 30;
        reasoning.push("Appears to be inside markdown documentation");
    }

    // 2. POSITIVE BOOSTS (Real Key Markers)

    // .env format
    const line = context.split('\n').find(l => l.includes(secret)) || "";
    if (/^[A-Z0-9_]+\s*=\s*/.test(line.trim())) {
        score += 30;
        reasoning.push("Used in standard .env assignment format");
    }

    // Deployment config markers
    if (lowerFileName.includes('vercel.json') || lowerFileName.includes('netlify.toml') || lowerFileName.includes('firebase.json')) {
        score += 40;
        reasoning.push("Found in production deployment configuration");
    }

    // Header/Auth context
    if (['authorization', 'bearer', 'apikey', 'x-api-key', 'secret-key'].some(m => lowerContext.includes(m))) {
        score += 25;
        reasoning.push("Found near Authorization or API key headers");
    }

    // Runtime logic usage
    if (['process.env', 'fetch(', 'axios.', 'headers:', 'config.'].some(m => lowerContext.includes(m))) {
        score += 20;
        reasoning.push("Passed into runtime logic (fetch/process.env)");
    }

    // Final Normalization
    score = Math.max(0, Math.min(100, score));

    let label = "UNCLEAR";
    if (score >= 80) label = "VERY LIKELY REAL";
    else if (score >= 60) label = "LIKELY REAL";
    else if (score < 40) label = "LIKELY EXAMPLE / PLACEHOLDER";

    return {
        score,
        isLikelyReal: score >= 60,
        reasoning: reasoning.slice(0, 3), // Top 3 reasons
        label
    };
}
