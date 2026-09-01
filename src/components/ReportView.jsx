import React, { useState } from 'react';
import { generatePDF } from '../lib/export/pdf-generator';
import { clearLocalData, setSaveLocallyEnabled, isSaveLocallyEnabled } from '../lib/storage';
import { clearAuditHistory } from '../lib/storage/history';
import logoXa from '../assets/logo-xa.png';
import cursorLogo from '../assets/cursor logo.png';
import copilotLogo from '../assets/copilot logo.png';
import claudeLogo from '../assets/claude logo.png';
import chatgptLogo from '../assets/chatgpt logo 2.png';
import '../pages/AuditTool.css';

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'];
const SEVERITY_COLOR = {
    critical: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
    high: { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
    medium: { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
    low: { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    info: { text: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30' },
};

const TOOLS = [
    { id: 'cursor', name: 'Cursor', image: cursorLogo },
    { id: 'copilot', name: 'Copilot', image: copilotLogo },
    { id: 'claude', name: 'Claude', image: claudeLogo },
    { id: 'chatgpt', name: 'ChatGPT', image: chatgptLogo },
];

function generatePrompt(tool, finding) {
    const snippet = finding.snippet ? `\n\`\`\`\n${finding.snippet}\n\`\`\`` : '';
    const body = `**Finding**: ${finding.title}\n**What matched**: ${finding.message}\n**Why it matters**: ${finding.whyItMatters}\n**Safer approach**: ${finding.saferExample}\n**Limitations of this check**: ${finding.limitations}${snippet}`;
    switch (tool) {
        case 'cursor':
            return `(In Cursor)\n\nReview and, if applicable, fix this finding.\n\n${body}`;
        case 'claude':
            return `Act as a senior engineer reviewing a static-analysis finding. This is a pattern match, not a confirmed vulnerability — verify it applies before changing anything.\n\n${body}\n\nIf it applies, return only the fixed code.`;
        case 'copilot':
            return `/fix Review: ${finding.title}. ${finding.saferExample}`;
        case 'chatgpt':
        default:
            return `Review this finding (pattern match, not a confirmed vulnerability):\n\n${body}`;
    }
}

export default function ReportView({ onBack, reportData, rawCode }) {
    const [isExporting, setIsExporting] = useState(false);
    const [selectedFinding, setSelectedFinding] = useState(null);
    const [selectedTool, setSelectedTool] = useState(null);
    const [saveLocally, setSaveLocally] = useState(isSaveLocallyEnabled());
    const [clearedNotice, setClearedNotice] = useState(false);

    const report = reportData;

    const handleExportPDF = async () => {
        if (!report) return;
        setIsExporting(true);
        try {
            await new Promise((r) => setTimeout(r, 50));
            generatePDF(report, logoXa);
        } catch (error) {
            console.error('PDF generation failed:', error);
            alert(`Failed to generate PDF: ${error instanceof Error ? error.message : String(error)}`);
        }
        setIsExporting(false);
    };

    const handleClearLocalData = () => {
        clearLocalData();
        clearAuditHistory();
        setClearedNotice(true);
        setTimeout(() => setClearedNotice(false), 2500);
    };

    const toggleSaveLocally = () => {
        const next = !saveLocally;
        setSaveLocally(next);
        setSaveLocallyEnabled(next);
    };

    if (!report) {
        return (
            <main className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="glass-panel p-12 rounded-2xl border flex flex-col items-center max-w-md mx-auto" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    <h2 className="text-3xl font-bold text-white mb-2">No Report In This Session</h2>
                    <p className="text-gray-400 mb-8 max-w-xs leading-relaxed">
                        Reports aren't saved by default (see Privacy). Run a new analysis to see findings here.
                    </p>
                    <button className="btn-cyber px-8 py-3 bg-white text-black hover:bg-gray-200 transition-colors" onClick={onBack}>
                        Return to Checker
                    </button>
                </div>
            </main>
        );
    }

    if (report.status === 'invalid' || report.status === 'parse-error' || report.status === 'too-large' || report.status === 'empty') {
        return (
            <main className="w-full max-w-4xl mx-auto p-6 pt-20 text-center">
                <h2 className="text-3xl font-bold text-white mb-4">Could Not Analyze This Input</h2>
                <p className="text-red-400 mb-6">{report.statusMessage}</p>
                <button onClick={onBack} className="px-6 py-2 bg-white text-black font-bold rounded-lg">Try Again</button>
            </main>
        );
    }

    const sortedFindings = [...report.findings].sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));
    const totalFindings = report.findings.length;

    return (
        <main id="report-container" className="app-container max-w-[1400px] mx-auto p-4 md:p-8">
            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 rounded-full hover:bg-[rgba(255,255,255,0.05)] text-gray-400 transition-colors">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Findings</h1>
                        <p className="text-xs text-gray-500 font-mono">{new Date(report.timestamp).toLocaleString()} • {report.language} • {(report.durationMs).toFixed(0)}ms</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors hover:bg-white/5"
                        style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
                    >
                        {isExporting ? <span className="animate-spin">⏳</span> : 'Export PDF'}
                    </button>
                </div>
            </div>

            <div className="mb-6 px-4 py-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-yellow-200 text-sm">
                These are pattern matches that require human review, not confirmed vulnerabilities. <strong>A clean result does not mean this code is secure.</strong> This tool does not detect all vulnerability classes — see the README for exactly what is checked.
            </div>

            {/* Severity counts */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
                {SEVERITY_ORDER.map((sev) => (
                    <div key={sev} className={`rounded-xl border p-4 ${SEVERITY_COLOR[sev].bg} ${SEVERITY_COLOR[sev].border}`}>
                        <div className="text-xs uppercase tracking-wider text-gray-400">{sev}</div>
                        <div className={`text-3xl font-bold ${SEVERITY_COLOR[sev].text}`}>{report.countsBySeverity[sev] ?? 0}</div>
                    </div>
                ))}
            </div>

            {/* Findings list */}
            <div className="glass-panel rounded-2xl p-6 mb-8">
                <h3 className="text-lg font-bold text-white mb-4">{totalFindings} finding(s)</h3>
                {totalFindings === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <span className="text-sm">No findings from the implemented rule set for this input. This does not mean the code is free of issues outside that rule set.</span>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sortedFindings.map((f, i) => (
                            <div key={i} className={`rounded-xl border p-4 ${SEVERITY_COLOR[f.severity].border} bg-white/[0.02]`}>
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${SEVERITY_COLOR[f.severity].bg} ${SEVERITY_COLOR[f.severity].text}`}>{f.severity}</span>
                                            <span className="text-[10px] text-gray-500 uppercase">{f.category}</span>
                                            {f.location && <span className="text-[10px] text-gray-600 font-mono">line {f.location.line}</span>}
                                        </div>
                                        <h4 className="font-bold text-white text-sm">{f.title}</h4>
                                        <p className="text-xs text-gray-400 mt-1">{f.message}</p>
                                    </div>
                                    <button
                                        onClick={() => { setSelectedFinding(f); setSelectedTool(null); }}
                                        className="px-4 py-2 rounded-lg text-xs font-bold text-white border transition-colors shrink-0"
                                        style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
                                    >
                                        Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Privacy controls */}
            <div className="glass-panel rounded-2xl p-6 mb-8">
                <h3 className="text-lg font-bold text-white mb-3">Local data</h3>
                <p className="text-xs text-gray-500 mb-4">
                    Nothing is sent anywhere by this app. By default, nothing is saved to this browser either. localStorage, if enabled below, is plaintext (not encrypted) and stores only counts, language, and a short masked excerpt — never your raw code or a full secret value.
                </p>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none">
                        <input type="checkbox" checked={saveLocally} onChange={toggleSaveLocally} className="accent-brand-blue" />
                        Save report summaries locally
                    </label>
                    <button onClick={handleClearLocalData} className="px-4 py-2 text-xs font-bold uppercase rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/10 transition-colors">
                        {clearedNotice ? 'Cleared ✓' : 'Clear local data'}
                    </button>
                </div>
            </div>

            {/* Finding detail modal */}
            {selectedFinding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedFinding(null)}>
                    <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 max-w-2xl w-full shadow-2xl relative max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setSelectedFinding(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${SEVERITY_COLOR[selectedFinding.severity].bg} ${SEVERITY_COLOR[selectedFinding.severity].text}`}>{selectedFinding.severity}</span>
                        <h3 className="text-xl font-bold text-white mt-3 mb-4">{selectedFinding.title}</h3>

                        <div className="space-y-4 text-sm">
                            <div>
                                <div className="text-xs uppercase text-gray-500 mb-1">What matched</div>
                                <p className="text-gray-300">{selectedFinding.message}</p>
                            </div>
                            <div>
                                <div className="text-xs uppercase text-gray-500 mb-1">Why it matters</div>
                                <p className="text-gray-300">{selectedFinding.whyItMatters}</p>
                            </div>
                            <div>
                                <div className="text-xs uppercase text-gray-500 mb-1">Safer example</div>
                                <p className="text-green-300 font-mono text-xs bg-black/40 p-3 rounded-lg">{selectedFinding.saferExample}</p>
                            </div>
                            <div>
                                <div className="text-xs uppercase text-gray-500 mb-1">Limitations of this check</div>
                                <p className="text-gray-500 text-xs italic">{selectedFinding.limitations}</p>
                            </div>
                            {selectedFinding.snippet && (
                                <div>
                                    <div className="text-xs uppercase text-gray-500 mb-1">Excerpt</div>
                                    <p className="text-gray-400 font-mono text-xs bg-black/40 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">{selectedFinding.snippet}</p>
                                </div>
                            )}
                        </div>

                        {!selectedTool ? (
                            <>
                                <h4 className="text-sm font-bold text-white mt-6 mb-3">Send to a coding assistant</h4>
                                <div className="grid grid-cols-4 gap-3">
                                    {TOOLS.map((tool) => (
                                        <button key={tool.id} onClick={() => setSelectedTool(tool.id)} className="p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 flex flex-col items-center gap-2">
                                            <img src={tool.image} alt={tool.name} className="w-6 h-6 object-contain" />
                                            <span className="text-[11px] text-gray-300">{tool.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 mt-6 mb-3">
                                    <button onClick={() => setSelectedTool(null)} className="text-gray-400 hover:text-white text-xs">&larr; back</button>
                                    <h4 className="text-sm font-bold text-white">Prompt for {TOOLS.find((t) => t.id === selectedTool)?.name}</h4>
                                </div>
                                <div className="rounded-xl p-4 border font-mono text-xs text-gray-300 mb-4 overflow-x-auto whitespace-pre-wrap max-h-[240px] bg-black/40 border-white/5">
                                    {generatePrompt(selectedTool, selectedFinding)}
                                </div>
                                <button
                                    onClick={() => navigator.clipboard.writeText(generatePrompt(selectedTool, selectedFinding))}
                                    className="px-6 py-2 bg-brand-blue text-white text-sm font-bold rounded-lg"
                                >
                                    Copy Prompt
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}
