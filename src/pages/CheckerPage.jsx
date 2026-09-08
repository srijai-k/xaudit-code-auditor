import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TopTicker, HeaderNav } from '../components/Navbar';
import { runAnalysis } from '../lib/analysis/client';
import { saveReportLocally } from '../lib/storage';
import { saveAuditToHistory } from '../lib/storage/history';
import CodeInput from '../components/checker/CodeInput';
import FindingsResults from '../components/checker/FindingsResults';
import PrivacyControls from '../components/checker/PrivacyControls';
import HistoryDrawer from '../components/checker/HistoryDrawer';
import '../landing.css';

const STAGE_LABELS = {
    parsing: 'Parsing AST',
    analyzing: 'Evaluating rules',
    rendering: 'Building findings',
};

export default function CheckerPage() {
    const navigate = useNavigate();
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
            setResult({ status: 'parse-error', error: 'Something went wrong while analyzing this code. Try again with a smaller snippet.', findings: [], countsBySeverity: {}, language: 'unknown', durationMs: 0, timestamp: Date.now() });
        } finally {
            setRunning(false);
            setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
        }
    };

    return (
        <div className="landing-wrapper">
            <TopTicker />
            <main className="page-shell">
                <HeaderNav onOpenHistory={() => setHistoryOpen(true)} />

                <div className="page-shell-body">
                    <div className="checker-shell">
                        <div className="checker-hero">
                            <p className="eyebrow purple"><span></span>Client-Side Audit Engine</p>
                            <h1>Client-side AST code analysis</h1>
                            <p>
                                Paste JavaScript, TypeScript, React/JSX, HTML, or package.json code below. Analysis executes locally in your browser's Web Worker off the UI thread — zero network requests are made.
                            </p>
                        </div>

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

                        <PrivacyControls />
                    </div>

                    <footer style={{ marginTop: '80px' }}>
                        <div className="footer-cta">
                            <h2>Audit the claim before you trust the result.</h2>
                            <button className="cta dark" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                                <span>↑</span> Top of Checker
                            </button>
                        </div>
                        <div className="footer-bottom">
                            <span>XAUDIT</span>
                            <span>Client-side static checker · no network audit path</span>
                            <span>PDF / SARIF / JSON</span>
                        </div>
                    </footer>
                </div>
            </main>

            <HistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} />
        </div>
    );
}
