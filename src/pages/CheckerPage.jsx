import React, { useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { TopTicker, HeaderNav } from '../components/Navbar';
import { runAnalysis } from '../lib/analysis/client';
import { compareRuns } from '../lib/analysis/compare';
import { SEVERITY_ORDER } from '../components/checker/severity';
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
    const [code, setCode] = useState('');
    const [mode, setMode] = useState('auto');
    const [running, setRunning] = useState(false);
    const [stageLine, setStageLine] = useState(null);
    const [result, setResult] = useState(null);
    const [historyOpen, setHistoryOpen] = useState(false);
    // The exact code the current result came from: highlights only make
    // sense while the editor still shows that code.
    const [analyzedCode, setAnalyzedCode] = useState(null);
    // "Check your AI's fix": the earlier run being compared against, and
    // the comparison once the fixed version has been checked.
    const [baseline, setBaseline] = useState(null);
    const [comparison, setComparison] = useState(null);
    const resultsRef = useRef(null);
    const editorTopRef = useRef(null);
    const jumpRef = useRef(null);

    const highlights = useMemo(() => {
        if (!result || result.status !== 'ok' || code !== analyzedCode) return null;
        const worst = new Map();
        for (const f of result.findings) {
            const line = f.location?.line;
            if (!line) continue;
            const prev = worst.get(line);
            if (!prev || SEVERITY_ORDER.indexOf(f.severity) < SEVERITY_ORDER.indexOf(prev)) worst.set(line, f.severity);
        }
        return worst;
    }, [result, code, analyzedCode]);

    const startFixCheck = () => {
        if (!result || result.status !== 'ok') return;
        setBaseline({ result, code });
        setComparison(null);
        setResult(null);
        setCode('');
        setTimeout(() => {
            editorTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            document.querySelector('.code-editor-input')?.focus({ preventScroll: true });
        }, 50);
    };

    const cancelFixCheck = () => {
        if (!baseline) return;
        setCode(baseline.code);
        setResult(baseline.result);
        setAnalyzedCode(baseline.code);
        setBaseline(null);
    };

    const handleRun = async () => {
        if (!code.trim() || running) return;
        setRunning(true);
        setStageLine(null);
        setResult(null);
        const comparingTo = baseline;
        const analyzed = code;

        try {
            const analysis = await runAnalysis(code, mode, {
                onStage: (stage, detail) => setStageLine(`${STAGE_LABELS[stage] || stage}${detail ? ` — ${detail}` : ''}`),
            });
            setResult(analysis);
            setAnalyzedCode(analyzed);
            if (comparingTo && analysis.status === 'ok') {
                setComparison(compareRuns(comparingTo.result.findings, analysis.findings));
                setBaseline(null);
            } else if (!comparingTo) {
                setComparison(null);
            }
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
                            <p className="eyebrow purple"><span></span>The checker</p>
                            <h1>Paste it in. Hit run.</h1>
                            <p>
                                JavaScript, TypeScript, React, HTML and package.json all work. The checking happens in a Web Worker in this tab, so your code doesn't go anywhere.
                            </p>
                        </div>

                        <div ref={editorTopRef} />
                        {baseline && (
                            <div className="fix-check-banner">
                                <span>
                                    Comparing against your last check ({baseline.result.findings.length} {baseline.result.findings.length === 1 ? 'finding' : 'findings'}). Paste your AI's fixed version below and hit Run Analysis.
                                </span>
                                <button className="checker-action-btn" onClick={cancelFixCheck}>Cancel</button>
                            </div>
                        )}

                        <CodeInput
                            code={code}
                            highlights={highlights}
                            jumpRef={jumpRef}
                            placeholder={baseline ? "// Paste the version your AI gave you after you asked it to fix the findings..." : undefined}
                            onCodeChange={setCode}
                            mode={mode}
                            onModeChange={setMode}
                            onRun={handleRun}
                            running={running}
                            stageLine={stageLine}
                        />

                        <FindingsResults
                            result={result}
                            resultsRef={resultsRef}
                            comparison={comparison}
                            onCheckFix={startFixCheck}
                            onJumpToLine={code === analyzedCode ? (line) => jumpRef.current?.(line) : undefined}
                        />

                        <PrivacyControls />
                    </div>

                    <footer style={{ marginTop: '80px' }}>
                        <div className="footer-cta">
                            <h2>Found something? Fix it and run it again.</h2>
                            <button className="cta dark" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                                <span>↑</span> Top of Checker
                            </button>
                        </div>
                        <div className="footer-bottom">
                            <span>XAUDIT</span>
                            <span>Runs in your browser · nothing uploaded</span>
                            <span>PDF / SARIF / JSON</span>
                        </div>
                    </footer>
                </div>
            </main>

            <HistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} />
        </div>
    );
}
