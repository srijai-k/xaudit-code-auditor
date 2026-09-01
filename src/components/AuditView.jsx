import React, { useState, useEffect, useRef } from 'react';
import { runAudit } from '../lib/run-audit';
import { saveReportLocally, isSaveLocallyEnabled, setSaveLocallyEnabled } from '../lib/storage';
import { saveAuditToHistory } from '../lib/storage/history';
import { MAX_SOURCE_BYTES } from '../lib/analysis/types';
import { motion } from 'framer-motion';

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
    Auto: `// Paste any HTML, JavaScript, TypeScript, or React/JSX code and let the checker detect it automatically.`
};

const STAGE_LABELS = {
    parsing: 'Parsing',
    analyzing: 'Analyzing',
    rendering: 'Rendering findings',
};

export default function AuditView({ onViewReport }) {
    const [activeTab, setActiveTab] = useState('HTML');
    const [hoverData, setHoverData] = useState(null);
    const [code, setCode] = useState('');
    const [status, setStatus] = useState('empty'); // 'empty', 'loading', 'result', 'error'
    const [stageLine, setStageLine] = useState(null);
    const [report, setReport] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [saveLocally, setSaveLocally] = useState(false);
    const textAreaRef = useRef(null);

    useEffect(() => {
        setSaveLocally(isSaveLocallyEnabled());
    }, []);

    const toggleSaveLocally = () => {
        const next = !saveLocally;
        setSaveLocally(next);
        setSaveLocallyEnabled(next);
    };

    const sizeBytes = new TextEncoder().encode(code).length;
    const overLimit = sizeBytes > MAX_SOURCE_BYTES;

    const handleRunAudit = async () => {
        if (!code.trim() || overLimit) return;

        setStatus('loading');
        setErrorMessage(null);
        setStageLine(null);

        try {
            const result = await runAudit(code, activeTab === 'Auto' ? 'auto' : (activeTab === 'HTML' ? 'html' : 'script'), {
                onStage: (stage, detail) => {
                    setStageLine(`${STAGE_LABELS[stage] || stage}${detail ? ` — ${detail}` : ''}`);
                },
            });

            if (result.status !== 'ok') {
                setErrorMessage(result.statusMessage || 'Analysis could not complete.');
                setStatus('error');
                return;
            }

            setReport(result);
            saveReportLocally(result, code);
            saveAuditToHistory(result, code);
            setStatus('result');
        } catch (error) {
            console.error('Audit failed:', error);
            setErrorMessage('Something went wrong while analyzing this code. Try again with a smaller or simpler snippet.');
            setStatus('error');
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
        setStatus('empty');
    };

    return (
        <main className="w-full max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 pt-20 md:pt-12 flex flex-col md:flex-row gap-8 min-h-screen md:h-[calc(100vh-80px)] overflow-y-auto md:overflow-hidden">

            {/* Left Panel: Context & Config */}
            <div className="w-full md:w-1/3 flex flex-col gap-6 h-full">
                <div className="glass-panel p-8 rounded-2xl relative overflow-hidden group shrink-0">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/10 rounded-full blur-3xl -z-10 group-hover:bg-brand-blue/20 transition-colors"></div>

                    <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4 text-white">
                        NEW <span className="text-brand-blue">CHECK</span>
                    </h1>
                    <p className="text-gray-400 mb-4 leading-relaxed">
                        Paste HTML, JavaScript, TypeScript, or React/JSX. Analysis runs entirely in your browser via a small set of pattern rules (see the README for exactly what is and isn't checked).
                    </p>
                    <p className="text-xs text-gray-500 mb-8 leading-relaxed border-l-2 border-white/10 pl-3">
                        Findings are patterns that require human review — not proof of a vulnerability. A clean result does not mean this code is secure.
                    </p>

                    <div className="space-y-4">
                        <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Input type</div>
                        <div className="grid grid-cols-2 gap-3" onMouseLeave={() => setHoverData(null)}>
                            {['HTML', 'React', 'JavaScript', 'Auto'].map(tab => {
                                const isSelected = activeTab === tab;
                                const isHighlight = hoverData ? hoverData === tab : isSelected;
                                return (
                                    <button
                                        key={tab}
                                        onMouseEnter={() => setHoverData(tab)}
                                        onClick={() => { setActiveTab(tab); setCode(''); setStatus('empty'); }}
                                        className={`relative px-4 py-3 text-sm font-bold transition-all cyber-shape ${isSelected ? '' : 'text-gray-400 hover:text-white bg-white/5'}`}
                                    >
                                        {isHighlight && (
                                            <motion.div
                                                layoutId="audit-pill"
                                                className={`absolute inset-0 z-0 cyber-shape ${isHighlight ? 'bg-brand-blue' : 'bg-transparent'}`}
                                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                            />
                                        )}
                                        <span className={`relative z-10 ${isHighlight ? 'text-white' : 'text-gray-400'}`}>{tab}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-[11px] text-gray-600 leading-relaxed">
                            "HTML" runs basic markup hygiene checks. "React", "JavaScript", and "Auto" all run the same AST-based rule set — there is one script analyzer, not a separate engine per framework. Vue, Svelte, Next.js-specific, and other frameworks are not supported; see README.
                        </p>
                    </div>

                    <label className="flex items-center gap-2 mt-6 text-xs text-gray-400 cursor-pointer select-none">
                        <input type="checkbox" checked={saveLocally} onChange={toggleSaveLocally} className="accent-brand-blue" />
                        Save report summaries locally (metadata + a masked excerpt only — never raw code or secret values). Off by default.
                    </label>
                </div>

                {/* Status / Output Log */}
                <div className="glass-panel p-6 rounded-2xl flex-1 min-h-[200px] font-mono text-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full bg-white/5 p-2 text-xs text-gray-400 uppercase tracking-widest border-b border-white/5 flex justify-between">
                        <span>Status</span>
                        <span className="animate-pulse">●</span>
                    </div>
                    <div className="mt-8 space-y-2 text-gray-300">
                        {status === 'loading' && (
                            <div className="text-brand-blue">{stageLine || 'Starting...'}</div>
                        )}
                        {status === 'error' && (
                            <div className="text-yellow-400">{errorMessage}</div>
                        )}
                        {status === 'result' && (
                            <div>
                                <div className="text-green-400 mb-4">
                                    Analysis complete. {report?.findings?.length ?? 0} finding(s)
                                    {report?.findings?.length > 0 && (
                                        <> — {Object.entries(report.countsBySeverity).filter(([, c]) => c > 0).map(([s, c]) => `${c} ${s}`).join(', ')}</>
                                    )}.
                                </div>
                                <button
                                    onClick={() => onViewReport(report, code)}
                                    className="px-4 py-2 bg-brand-blue text-white text-xs font-bold uppercase tracking-widest rounded hover:bg-blue-600 transition-colors"
                                >
                                    View Findings &rarr;
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
                    <div className="flex items-center justify-between px-6 py-4 bg-black/40 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <div className="flex gap-2 mr-4">
                                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                            </div>
                            <span className="font-mono text-sm text-gray-400">source_code.js</span>
                            <div className="flex items-center gap-2 ml-4">
                                <button onClick={handlePaste} className="px-3 py-1 bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 rounded border border-white/10 transition-colors uppercase tracking-wider">Paste</button>
                                <button onClick={loadSample} className="px-3 py-1 bg-white/5 hover:bg-white/10 text-xs font-bold text-brand-blue/80 hover:text-brand-blue rounded border border-white/10 transition-colors uppercase tracking-wider">Insert Example</button>
                            </div>
                        </div>
                        <div className={`text-xs font-mono ${overLimit ? 'text-red-400 font-bold' : 'text-gray-500'}`}>
                            {(sizeBytes / 1024).toFixed(1)} KB / {(MAX_SOURCE_BYTES / 1024).toFixed(0)} KB
                        </div>
                    </div>

                    <textarea
                        ref={textAreaRef}
                        value={code}
                        onChange={(e) => { setCode(e.target.value); setStatus('empty'); }}
                        placeholder="// Paste your code here..."
                        spellCheck="false"
                        className="flex-1 w-full bg-black/20 p-6 font-mono text-sm md:text-base leading-relaxed text-gray-300 resize-none focus:outline-none custom-scrollbar selection:bg-brand-blue/30 placeholder:text-gray-700"
                    />

                    {overLimit && (
                        <div className="px-6 py-2 bg-red-500/10 border-t border-red-500/30 text-red-300 text-xs">
                            This input is over the {(MAX_SOURCE_BYTES / 1024).toFixed(0)} KB analysis limit and will be rejected rather than analyzed. Paste a smaller excerpt.
                        </div>
                    )}

                    <div className="p-4 bg-black/40 border-t border-white/10 flex justify-end">
                        <button
                            onClick={handleRunAudit}
                            disabled={status === 'loading' || !code.trim() || overLimit}
                            className={`relative overflow-hidden group px-8 py-3 rounded-xl font-bold tracking-wide uppercase transition-all ${(!code.trim() || overLimit) ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-brand-blue text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_40px_rgba(59,130,246,0.7)] hover:scale-105 active:scale-95'}`}
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {status === 'loading' ? (
                                    <>
                                        <svg className="animate-spin -ml-1 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {stageLine || 'Processing'}
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
