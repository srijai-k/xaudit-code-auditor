import React, { useState } from 'react';
import { SEVERITY_ORDER, SEVERITY_COLOR } from './severity';
import { generatePDF } from '../../lib/export/pdf-generator';
import { generateSarif } from '../../lib/export/sarif-generator';
import { generateJsonExport } from '../../lib/export/json-generator';
import FindingDetailModal from './FindingDetailModal';
import ReportOverview from './ReportOverview';

/** Client-side-only file download — a Blob + a programmatically-clicked anchor. No network call. */
function downloadTextFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Renders findings for a completed analysis. Handles the non-"ok" statuses
 * (empty/too-large/parse-error) as plain messages, not as if they were
 * empty-but-successful results — those are meaningfully different things.
 */
export default function FindingsResults({ result, resultsRef }) {
    const [selectedFinding, setSelectedFinding] = useState(null);
    const [isExporting, setIsExporting] = useState(false);

    if (!result) return null;

    if (result.status !== 'ok') {
        const messages = {
            empty: 'Nothing to analyze — paste some code first.',
            'too-large': result.error,
            'parse-error': result.error,
        };
        return (
            <div ref={resultsRef} className="mt-6 px-5 py-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-200 text-sm">
                {messages[result.status] || 'Analysis could not complete.'}
            </div>
        );
    }

    const sortedFindings = [...result.findings].sort(
        (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
    );

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            await new Promise((r) => setTimeout(r, 30));
            generatePDF(result);
        } catch (error) {
            console.error('PDF generation failed:', error);
            alert(`Failed to generate PDF: ${error instanceof Error ? error.message : String(error)}`);
        }
        setIsExporting(false);
    };

    const handleExportSarif = () => {
        try {
            const sarif = generateSarif(result);
            downloadTextFile(`xaudit-report-${result.timestamp}.sarif`, JSON.stringify(sarif, null, 2), 'application/sarif+json');
        } catch (error) {
            console.error('SARIF export failed:', error);
            alert(`Failed to generate SARIF: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    const handleExportJson = () => {
        try {
            const json = generateJsonExport(result);
            downloadTextFile(`xaudit-report-${result.timestamp}.json`, JSON.stringify(json, null, 2), 'application/json');
        } catch (error) {
            console.error('JSON export failed:', error);
            alert(`Failed to generate JSON: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    return (
        <div ref={resultsRef} className="mt-6">
            <div className="mb-4 px-4 py-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-yellow-200 text-sm">
                These are pattern matches that require human review, not confirmed vulnerabilities. <strong>A clean result does not mean this code is secure.</strong>
            </div>

            <div className="flex items-center justify-between gap-3 mb-4">
                <div className="text-xs text-gray-500 font-mono">
                    {new Date(result.timestamp).toLocaleTimeString()} • {result.language} • {result.durationMs.toFixed(0)}ms
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="px-3 py-1.5 border border-white/10 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-gray-300 transition-colors"
                    >
                        {isExporting ? 'Exporting…' : 'Export PDF'}
                    </button>
                    <button
                        onClick={handleExportSarif}
                        title="SARIF 2.1.0 — readable by GitHub Code Scanning, VS Code's SARIF viewer, and most CI security tooling"
                        className="px-3 py-1.5 border border-white/10 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-gray-300 transition-colors"
                    >
                        Export SARIF
                    </button>
                    <button
                        onClick={handleExportJson}
                        className="px-3 py-1.5 border border-white/10 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-gray-300 transition-colors"
                    >
                        Export JSON
                    </button>
                </div>
            </div>

            <ReportOverview result={result} />

            <div className="text-xs uppercase tracking-wider text-gray-500 mb-3">
                Detailed findings {sortedFindings.length > 0 && `(${sortedFindings.length})`}
            </div>

            {sortedFindings.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-sm border border-white/10 rounded-xl">
                    No findings from the implemented rule set. This does not mean the code is free of issues outside that rule set — see the README for exactly what is checked.
                </div>
            ) : (
                <div className="space-y-2">
                    {sortedFindings.map((f, i) => (
                        <button
                            key={i}
                            onClick={() => setSelectedFinding(f)}
                            className={`w-full text-left rounded-xl border p-4 bg-white/[0.02] hover:bg-white/[0.05] transition-colors ${SEVERITY_COLOR[f.severity].border}`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${SEVERITY_COLOR[f.severity].bg} ${SEVERITY_COLOR[f.severity].text}`}>{f.severity}</span>
                                <span className="text-[10px] text-gray-500 uppercase">{f.category}</span>
                                {f.location && <span className="text-[10px] text-gray-600 font-mono">line {f.location.line}</span>}
                            </div>
                            <div className="font-bold text-white text-sm">{f.title}</div>
                            <div className="text-xs text-gray-400 mt-1">{f.message}</div>
                        </button>
                    ))}
                </div>
            )}

            {selectedFinding && (
                <FindingDetailModal finding={selectedFinding} onClose={() => setSelectedFinding(null)} />
            )}
        </div>
    );
}
