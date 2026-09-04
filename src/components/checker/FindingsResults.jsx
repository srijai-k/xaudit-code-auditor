import React, { useState } from 'react';
import { SEVERITY_ORDER } from './severity';
import { generatePDF } from '../../lib/export/pdf-generator';
import { generateSarif } from '../../lib/export/sarif-generator';
import { generateJsonExport } from '../../lib/export/json-generator';
import ReportOverview from './ReportOverview';

const SEVERITY_STYLES = {
    critical: { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' },
    high: { bg: 'rgba(249, 115, 22, 0.15)', text: '#fb923c', border: 'rgba(249, 115, 22, 0.3)' },
    medium: { bg: 'rgba(234, 179, 8, 0.15)', text: '#fde047', border: 'rgba(234, 179, 8, 0.3)' },
    low: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' },
    info: { bg: 'rgba(167, 139, 250, 0.15)', text: '#c4b5fd', border: 'rgba(167, 139, 250, 0.3)' },
};

const AI_TOOLS = ['ChatGPT', 'Claude', 'Cursor', 'v0'];

function generateAssistantPrompt(tool, finding) {
    const snippet = finding.snippet ? `\n\`\`\`\n${finding.snippet}\n\`\`\`` : '';
    const body = `**Finding**: ${finding.title}\n**What matched**: ${finding.message}\n**Why it matters**: ${finding.whyItMatters}\n**Safer approach**: ${finding.saferExample}\n**Limitations of this check**: ${finding.limitations}${snippet}`;
    switch (tool) {
        case 'Cursor':
            return `(In Cursor)\n\nReview and, if applicable, fix this finding.\n\n${body}`;
        case 'Claude':
            return `Act as a senior engineer reviewing a static-analysis finding. This is a pattern match, not a confirmed vulnerability — verify it applies before changing anything.\n\n${body}\n\nIf it applies, return only the fixed code.`;
        case 'v0':
            return `Review this finding and preserve layout/styling while addressing it if applicable:\n\n${body}`;
        case 'ChatGPT':
        default:
            return `Review this finding (pattern match, not a confirmed vulnerability):\n\n${body}`;
    }
}

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

export default function FindingsResults({ result, resultsRef }) {
    const [expandedFindingId, setExpandedFindingId] = useState(null);
    const [selectedToolMap, setSelectedToolMap] = useState({});
    const [copiedMap, setCopiedMap] = useState({});
    const [isExporting, setIsExporting] = useState(false);

    if (!result) return null;

    if (result.status !== 'ok') {
        const messages = {
            empty: 'Nothing to analyze — paste some code first.',
            'too-large': result.error,
            'parse-error': result.error,
        };
        return (
            <div ref={resultsRef} className="checker-disclaimer" style={{ borderColor: 'rgba(255, 82, 82, 0.4)', background: 'rgba(255, 82, 82, 0.08)', color: '#ff8a8a' }}>
                {messages[result.status] || 'Analysis could not complete.'}
            </div>
        );
    }

    const sortedFindings = [...result.findings].sort(
        (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
    );

    const toggleExpand = (index) => {
        setExpandedFindingId(expandedFindingId === index ? null : index);
    };

    const handleSelectTool = (findingIdx, tool) => {
        setSelectedToolMap((prev) => ({ ...prev, [findingIdx]: tool }));
    };

    const handleCopyPrompt = (findingIdx, finding) => {
        const tool = selectedToolMap[findingIdx] || 'ChatGPT';
        const promptText = generateAssistantPrompt(tool, finding);
        navigator.clipboard.writeText(promptText);
        setCopiedMap((prev) => ({ ...prev, [findingIdx]: true }));
        setTimeout(() => {
            setCopiedMap((prev) => ({ ...prev, [findingIdx]: false }));
        }, 1800);
    };

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
        <div ref={resultsRef} style={{ marginTop: '36px' }}>
            {/* Disclaimer notice */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '16px 20px', borderRadius: '16px', background: '#161616', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '24px', fontSize: '13px', color: '#ccc', lineHeight: 1.5 }}>
                <span style={{ fontSize: '16px', lineHeight: 1 }}>⚠️</span>
                <div>
                    These findings are pattern matches that require human review, not confirmed vulnerabilities. <strong style={{ color: '#fff' }}>A clean result does not mean this code is free of security flaws.</strong>
                </div>
            </div>

            {/* Metadata bar & export buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#888', letterSpacing: '0.03em' }}>
                    {new Date(result.timestamp).toLocaleTimeString()} <span style={{ color: '#444', margin: '0 6px' }}>•</span> {result.language.toUpperCase()} <span style={{ color: '#444', margin: '0 6px' }}>•</span> <span style={{ color: 'var(--lav)' }}>{result.durationMs.toFixed(0)}ms</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        style={{
                            padding: '8px 18px',
                            borderRadius: '999px',
                            background: '#1a1a1a',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--lav)'; e.currentTarget.style.background = '#222'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'; e.currentTarget.style.background = '#1a1a1a'; }}
                    >
                        {isExporting ? 'Exporting…' : 'Export PDF'}
                    </button>
                    <button
                        onClick={handleExportSarif}
                        title="SARIF 2.1.0 — readable by GitHub Code Scanning and VS Code SARIF viewers"
                        style={{
                            padding: '8px 18px',
                            borderRadius: '999px',
                            background: '#1a1a1a',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--lav)'; e.currentTarget.style.background = '#222'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'; e.currentTarget.style.background = '#1a1a1a'; }}
                    >
                        Export SARIF
                    </button>
                    <button
                        onClick={handleExportJson}
                        style={{
                            padding: '8px 18px',
                            borderRadius: '999px',
                            background: '#1a1a1a',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--lav)'; e.currentTarget.style.background = '#222'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'; e.currentTarget.style.background = '#1a1a1a'; }}
                    >
                        Export JSON
                    </button>
                </div>
            </div>

            {/* Report Overview Breakdown */}
            <ReportOverview result={result} />

            {/* Detailed Findings Header */}
            <p className="eyebrow purple" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '32px 0 16px' }}>
                <span></span>Detailed Findings {sortedFindings.length > 0 && `(${sortedFindings.length})`}
            </p>

            {sortedFindings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', color: '#888', background: '#161616', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', fontSize: '14px' }}>
                    No findings from the active rule modules. This does not guarantee that the snippet is vulnerability-free.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {sortedFindings.map((f, i) => {
                        const sevStyle = SEVERITY_STYLES[f.severity] || SEVERITY_STYLES.info;
                        const isExpanded = expandedFindingId === i;
                        const currentTool = selectedToolMap[i] || 'ChatGPT';
                        const isCopied = copiedMap[i];

                        return (
                            <div
                                key={i}
                                style={{
                                    background: '#161616',
                                    border: isExpanded ? '1px solid rgba(167, 139, 250, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '20px',
                                    padding: '22px 26px',
                                    transition: 'all 0.25s ease',
                                }}
                            >
                                {/* Header Row with Badges + Action Button */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{
                                            fontSize: '11px',
                                            fontWeight: 800,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.06em',
                                            padding: '4px 10px',
                                            borderRadius: '999px',
                                            backgroundColor: sevStyle.bg,
                                            color: sevStyle.text,
                                            border: `1px solid ${sevStyle.border}`,
                                        }}>
                                            {f.severity}
                                        </span>
                                        <span style={{ fontSize: '11px', color: 'var(--lav)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>
                                            {f.category}
                                        </span>
                                        {f.location && <span style={{ fontSize: '11px', color: '#666', fontFamily: 'monospace' }}>Line {f.location.line}</span>}
                                    </div>

                                    {/* Inline Expand Button */}
                                    <button
                                        onClick={() => toggleExpand(i)}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 14px',
                                            borderRadius: '999px',
                                            background: isExpanded ? 'rgba(167, 139, 250, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                                            border: isExpanded ? '1px solid rgba(167, 139, 250, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                                            color: isExpanded ? 'var(--lav)' : '#ccc',
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isExpanded) {
                                                e.currentTarget.style.borderColor = 'var(--lav)';
                                                e.currentTarget.style.color = '#fff';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isExpanded) {
                                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                                e.currentTarget.style.color = '#ccc';
                                            }
                                        }}
                                    >
                                        <span>{isExpanded ? 'Hide Analysis' : 'View Analysis'}</span>
                                        <span className={`analysis-arrow ${isExpanded ? 'is-open' : ''}`}>↓</span>
                                    </button>
                                </div>

                                <div style={{ fontWeight: 700, color: '#fff', fontSize: '18px', marginBottom: '8px' }}>
                                    {f.title}
                                </div>
                                <div style={{ fontSize: '14px', color: '#aaa', lineHeight: 1.6 }}>
                                    {f.message}
                                </div>

                                {/* Smooth Accordion Expanded Detailed Analysis Panel */}
                                <div className={`analysis-expand-wrapper ${isExpanded ? 'is-open' : ''}`}>
                                    <div className="analysis-expand-inner">
                                        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', marginTop: '20px', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {/* Why it Matters */}
                                            {f.whyItMatters && (
                                                <div>
                                                    <div style={{ fontSize: '11px', color: '#888', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                                                        Why it Matters
                                                    </div>
                                                    <div style={{ color: '#ddd', fontSize: '14px', lineHeight: 1.6 }}>
                                                        {f.whyItMatters}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Safer Example */}
                                            {f.saferExample && (
                                                <div>
                                                    <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                                                        Safer Approach
                                                    </div>
                                                    <pre style={{ background: '#0a0a0a', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#34d399', padding: '14px 18px', borderRadius: '14px', fontFamily: 'monospace', fontSize: '13px', overflowX: 'auto', margin: 0, lineHeight: 1.5 }}>
                                                        {f.saferExample}
                                                    </pre>
                                                </div>
                                            )}

                                            {/* Excerpt */}
                                            {f.snippet && (
                                                <div>
                                                    <div style={{ fontSize: '11px', color: '#888', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                                                        Code Excerpt
                                                    </div>
                                                    <pre style={{ background: '#0a0a0a', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#ccc', padding: '14px 18px', borderRadius: '14px', fontFamily: 'monospace', fontSize: '13px', overflowX: 'auto', margin: 0, lineHeight: 1.5 }}>
                                                        {f.snippet}
                                                    </pre>
                                                </div>
                                            )}

                                            {/* Rule Limitations */}
                                            {f.limitations && (
                                                <div>
                                                    <div style={{ fontSize: '11px', color: '#777', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                                                        Limitations of this Check
                                                    </div>
                                                    <div style={{ color: '#888', fontSize: '13px', fontStyle: 'italic', lineHeight: 1.5 }}>
                                                        {f.limitations}
                                                    </div>
                                                </div>
                                            )}

                                            {/* AI Coding Assistant Prompt Section */}
                                            <div style={{ marginTop: '8px', background: '#0e0e0e', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '16px', padding: '18px' }}>
                                                <div style={{ fontSize: '11px', color: '#888', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                                                    Copy Prompt for Coding Assistant
                                                </div>
                                                
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                                                    {AI_TOOLS.map((tool) => (
                                                        <button
                                                            key={tool}
                                                            onClick={() => handleSelectTool(i, tool)}
                                                            style={{
                                                                padding: '6px 14px',
                                                                borderRadius: '8px',
                                                                border: currentTool === tool ? '1px solid var(--lav)' : '1px solid rgba(255, 255, 255, 0.1)',
                                                                background: currentTool === tool ? 'rgba(167, 139, 250, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                                                                color: currentTool === tool ? '#fff' : '#aaa',
                                                                fontSize: '12px',
                                                                fontWeight: 700,
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s ease',
                                                            }}
                                                        >
                                                            {tool}
                                                        </button>
                                                    ))}
                                                </div>

                                                <pre style={{ background: '#050505', border: '1px solid rgba(255, 255, 255, 0.05)', color: '#bbb', padding: '14px', borderRadius: '12px', fontFamily: 'monospace', fontSize: '12px', overflowX: 'auto', maxHeight: '160px', whitespace: 'pre-wrap', marginBottom: '14px', lineHeight: 1.5 }}>
                                                    {generateAssistantPrompt(currentTool, f)}
                                                </pre>

                                                <button
                                                    onClick={() => handleCopyPrompt(i, f)}
                                                    style={{
                                                        padding: '8px 20px',
                                                        borderRadius: '999px',
                                                        background: isCopied ? '#10b981' : 'var(--lav)',
                                                        border: 'none',
                                                        color: isCopied ? '#fff' : '#111',
                                                        fontSize: '13px',
                                                        fontWeight: 800,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                    }}
                                                >
                                                    {isCopied ? 'Copied to Clipboard ✓' : `Copy Prompt for ${currentTool}`}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
