import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { runAnalysis } from '../lib/analysis/client';
import { saveReportLocally } from '../lib/storage';
import { saveAuditToHistory } from '../lib/storage/history';
import CodeInput from '../components/checker/CodeInput';
import FindingsResults from '../components/checker/FindingsResults';
import PrivacyControls from '../components/checker/PrivacyControls';
import HistoryDrawer from '../components/checker/HistoryDrawer';
import logoXa from '../assets/logo-xa.png';

const STAGE_LABELS = {
    parsing: 'Parsing',
    analyzing: 'Analyzing',
    rendering: 'Rendering',
};

export default function CheckerPage() {
    const [code, setCode] = useState('');
    const [mode, setMode] = useState('auto');
    const [running, setRunning] = useState(false);
    const [stageLine, setStageLine] = useState(null);
    const [result, setResult] = useState(null);
    const [historyOpen, setHistoryOpen] = useState(false);
    const resultsRef = useRef(null);

    const handleRun = async () => {
        if (!code.trim() || running) return;
        setRunning(true);
        setStageLine(null);
        setResult(null);

        try {
            const analysis = await runAnalysis(code, mode, {
                onStage: (stage, detail) => setStageLine(`${STAGE_LABELS[stage] || stage}${detail ? ` — ${detail}` : ''}`),
            });
            setResult(analysis);
            if (analysis.status === 'ok') {
                saveReportLocally(analysis, code);
                saveAuditToHistory(analysis, code);
            }
        } catch (error) {
            console.error('Analysis failed:', error);
            setResult({ status: 'parse-error', error: 'Something went wrong while analyzing this code. Try again with a smaller or simpler snippet.', findings: [], countsBySeverity: {}, language: 'unknown', durationMs: 0, timestamp: Date.now() });
        } finally {
            setRunning(false);
            // Reveal the results without a page navigation.
            setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <header className="sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur-md">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <img src={logoXa} alt="XAUDIT" className="h-7 object-contain mix-blend-screen" />
                        <span className="font-bold tracking-tight">XAUDIT</span>
                    </Link>
                    <button
                        onClick={() => setHistoryOpen(true)}
                        className="px-3 py-1.5 text-xs font-bold uppercase rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition-colors"
                    >
                        History
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Check your code</h1>
                <p className="text-gray-400 text-sm mb-8 max-w-2xl">
                    Paste HTML, JavaScript, TypeScript, or React/JSX. Analysis runs entirely in your browser in a Web Worker — nothing is sent anywhere. Findings are pattern matches that need human review, not proof of a vulnerability.
                </p>

                <CodeInput
                    code={code}
                    onCodeChange={setCode}
                    mode={mode}
                    onModeChange={setMode}
                    onRun={handleRun}
                    running={running}
                    stageLine={stageLine}
                />

                <FindingsResults result={result} resultsRef={resultsRef} />

                <div className="mt-8">
                    <PrivacyControls />
                </div>
            </main>

            <HistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} />
        </div>
    );
}
