import React, { useState, useEffect, useRef } from 'react';
import { checkRateLimit } from '../lib/rate-limit';
import { runAudit } from '../lib/run-audit';
import { saveReport, saveCode } from '../lib/storage';
import { saveAudit } from '../lib/storage/history';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const SAMPLES = {
    HTML: `<!DOCTYPE html>
<html>
<head>
    <title>Sample Page</title>
</head>
<body>
    <h1>Hello World</h1>
    <img src="https://example.com/logo.png">
    <button onclick="alert('hi')">Submit</button>
</body>
</html>`,
    React: `import React, { useState } from 'react';

export default function UserProfile() {
  const [user, setUser] = useState(null);

  // AI generated generic fetch
  useEffect(() => {
    fetch('/api/user').then(d => setUser(d));
  }, []);

  return (
    <div className="card">
      <img src={user.avatar} />
      <button onClick={() => alert('Hi')}>Click</button>
    </div>
  );
}`,
    JavaScript: `function processUser(user) {
  const secret = "sk-1234567890abcdef1234567890abcdef";
  eval("console.log('Processing' + user.name)");
  
  if (user.width > 500) {
    document.getElementById('profile').style.width = '800px';
  }
}`,
    Auto: `// Paste any code here and let the engine detect the language automatically.`
};

export default function AuditView({ onViewReport }) {
    const navigate = useNavigate();
    const [status, setStatus] = useState('empty'); // 'empty', 'loading', 'result'
    const [activeTab, setActiveTab] = useState('HTML');
    const [hoverData, setHoverData] = useState(null);
    const [progressStep, setProgressStep] = useState(0);
    const [code, setCode] = useState('');
    const [report, setReport] = useState(null);
    const textAreaRef = useRef(null);

    // ... (existing imports)

    const handleRunAudit = async () => {
        if (!code.trim()) return;

        // RATE LIMIT CHECK
        const limit = checkRateLimit('local-session');
        if (!limit.allowed) {
            alert(`Rate Limit Exceeded\n\nYou have reached the limit of 10 audits per hour.\nTry again in ${limit.waitMinutes} minutes.`);
            return;
        }

        setStatus('loading');
        setProgressStep(0);

        try {
            // Simulation steps
            const steps = [
                'Parsing Syntax Tree...',
                'Analyzing Control Flow...',
                'Detecting Vulnerabilities...',
                'Checking Best Practices...',
                'Calculating Risk Score...'
            ];

            for (let i = 0; i < steps.length; i++) {
                await new Promise(r => setTimeout(r, 600));
                setProgressStep(i + 1);
            }

            const result = runAudit(code, activeTab === 'Auto' ? 'auto' : activeTab.toLowerCase());
            if (!result) throw new Error("Audit returned null result");

            setReport(result);

            // Save history
            saveReport(result);
            saveCode(code);
            saveAudit(result, code, activeTab);

            setStatus('result');

            // Slight delay then auto-nav (if user doesn't click)
            setTimeout(() => onViewReport(result), 1500);
        } catch (error) {
            console.error("Audit Failed:", error);
            // Revert to simple error message for user, but log details
            alert("Audit failed. Please try again or check console.");
            setStatus('empty');
        }
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setCode(text);
        } catch (err) {
            console.error('Failed to read clipboard contents: ', err);
        }
    };

    const loadSample = () => {
        setCode(SAMPLES[activeTab]);
    };

    return (
        <main
            className="w-full max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 pt-20 md:pt-12 flex flex-col md:flex-row gap-8 min-h-screen md:h-[calc(100vh-80px)] overflow-y-auto md:overflow-hidden"
        >

            {/* Left Panel: Context & Config */}
            <div className="w-full md:w-1/3 flex flex-col gap-6 h-full">
                <div className="glass-panel p-8 rounded-2xl relative overflow-hidden group shrink-0">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/10 rounded-full blur-3xl -z-10 group-hover:bg-brand-blue/20 transition-colors"></div>

                    <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4 text-white">
                        NEW <span className="text-brand-blue">AUDIT</span>
                    </h1>
                    <p className="text-gray-400 mb-8 leading-relaxed">
                        Select your framework and paste your code. Our neural engine will analyze it for security vulnerabilities, performance bottlenecks, and code quality issues in real-time.
                    </p>

                    <div className="space-y-4">
                        <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Select Environment</div>
                        <div className="grid grid-cols-2 gap-3" onMouseLeave={() => setHoverData(null)}>
                            {['HTML', 'React', 'JavaScript', 'Auto'].map(tab => {
                                // Simplified active check based on current activeTab state
                                const isSelected = activeTab === tab;
                                const isHighlight = hoverData ? hoverData === tab : isSelected;

                                return (
                                    <button
                                        key={tab}
                                        onMouseEnter={() => setHoverData(tab)}
                                        onClick={() => { setActiveTab(tab); setCode(''); }}
                                        className={`relative px-4 py-3 text-sm font-bold transition-all cyber-shape
                                            ${isSelected ? '' : 'text-gray-400 hover:text-white bg-white/5'}
                                        `}
                                    >
                                        {isHighlight && (
                                            <motion.div
                                                layoutId="audit-pill"
                                                className={`absolute inset-0 z-0 cyber-shape ${isHighlight ? 'bg-brand-blue' : 'bg-transparent'}`}
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            />
                                        )}
                                        <span className={`relative z-10 ${isHighlight ? 'text-white' : 'text-gray-400'}`}>
                                            {tab}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Status / Output Log */}
                <div className="glass-panel p-6 rounded-2xl flex-1 min-h-[200px] font-mono text-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full bg-white/5 p-2 text-xs text-gray-400 uppercase tracking-widest border-b border-white/5 flex justify-between">
                        <span>Terminal Output</span>
                        <span className="animate-pulse">●</span>
                    </div>
                    <div className="mt-8 space-y-2 text-gray-300">
                        <div className="opacity-50">$ init_audit_sequence</div>
                        {status === 'loading' && (
                            <>
                                <div className="text-brand-blue">$ loading_modules... [OK]</div>
                                {progressStep >= 1 && <div>$ parsing_syntax... [OK]</div>}
                                {progressStep >= 2 && <div>$ analyzing_flow... [OK]</div>}
                                {progressStep >= 3 && <div className="text-yellow-400">$ detecting_vulns... [SCANNING]</div>}
                                {progressStep >= 4 && <div>$ checking_compl... [OK]</div>}
                                {progressStep >= 5 && <div className="text-green-400">$ finalizing_report... [DONE]</div>}
                            </>
                        )}
                        {status === 'result' && (
                            <div className="animate-pulse">
                                <div className="text-green-400 mb-4">$ audit_complete. found {report?.topFixes?.length || 0} issues.</div>
                                <button
                                    onClick={() => onViewReport(report)}
                                    className="px-4 py-2 bg-brand-blue text-white text-xs font-bold uppercase tracking-widest rounded hover:bg-blue-600 transition-colors"
                                >
                                    View Full Report &rarr;
                                </button>
                            </div>
                        )}
                        {status === 'empty' && <div className="text-gray-600 italic">// Waiting for input...</div>}
                    </div>
                </div>
            </div>

            {/* Right Panel: Code Editor */}
            <div className="w-full md:w-2/3 h-full flex flex-col relative">
                <div className="glass-panel rounded-2xl flex-1 flex flex-col overflow-hidden border-brand-blue/30 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                    {/* Editor Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-black/40 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <div className="flex gap-2 mr-4">
                                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                            </div>
                            <span className="font-mono text-sm text-gray-400">source_code.js</span>
                            <div className="flex items-center gap-2 ml-4">
                                <button
                                    onClick={handlePaste}
                                    className="px-3 py-1 bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 rounded border border-white/10 transition-colors uppercase tracking-wider"
                                >
                                    Paste
                                </button>
                                <button
                                    onClick={loadSample}
                                    className="px-3 py-1 bg-white/5 hover:bg-white/10 text-xs font-bold text-brand-blue/80 hover:text-brand-blue rounded border border-white/10 transition-colors uppercase tracking-wider"
                                >
                                    Insert Example
                                </button>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500 font-mono">Ln {code.split('\n').length}, Col 1</div>
                    </div>

                    {/* TextArea */}
                    <textarea
                        ref={textAreaRef}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="// Paste your code here..."
                        spellCheck="false"
                        className="flex-1 w-full bg-black/20 p-6 font-mono text-sm md:text-base leading-relaxed text-gray-300 resize-none focus:outline-none custom-scrollbar selection:bg-brand-blue/30 placeholder:text-gray-700"
                    />

                    {/* Action Bar */}
                    <div className="p-4 bg-black/40 border-t border-white/10 flex justify-end">
                        <button
                            onClick={handleRunAudit}
                            disabled={status === 'loading' || !code.trim()}
                            className={`
                                relative overflow-hidden group px-8 py-3 rounded-xl font-bold tracking-wide uppercase transition-all
                                ${!code.trim() ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-brand-blue text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_40px_rgba(59,130,246,0.7)] hover:scale-105 active:scale-95'}
                            `}
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {status === 'loading' ? (
                                    <>
                                        <svg className="animate-spin -ml-1 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing
                                    </>
                                ) : (
                                    <>
                                        Run Analysis
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                    </>
                                )}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
