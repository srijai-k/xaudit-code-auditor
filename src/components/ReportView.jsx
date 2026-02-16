import React, { useState, useEffect } from 'react';
import { loadLatestReport, loadLastCode } from '../lib/storage';
import { generatePDF } from '../lib/export/pdf-generator';
import logoXa from '../assets/logo-xa.png';
import cursorLogo from '../assets/cursor logo.png';
import copilotLogo from '../assets/copilot logo.png';
import claudeLogo from '../assets/claude logo.png';
import chatgptLogo from '../assets/chatgpt logo 2.png';
import '../pages/AuditTool.css'; // Ensure CSS is loaded

export default function ReportView({ onBack, reportData, rawCode: propCode }) {
    const [report, setReport] = useState(null);
    const [rawCode, setRawCode] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [selectedFix, setSelectedFix] = useState(null);
    const [showAllIssues, setShowAllIssues] = useState(false);
    const [selectedTool, setSelectedTool] = useState(null); // 'cursor', 'copilot', 'windsurf', 'chatgpt'

    const TOOLS = [
        { id: 'cursor', name: 'Cursor', icon: '⚡', image: cursorLogo, color: 'border-blue-500 text-blue-400' },
        { id: 'copilot', name: 'Copilot', icon: '🤖', image: copilotLogo, color: 'border-purple-500 text-purple-400' },
        { id: 'claude', name: 'Claude', icon: '🧠', image: claudeLogo, color: 'border-orange-500 text-orange-400' },
        { id: 'chatgpt', name: 'ChatGPT', icon: '💬', image: chatgptLogo, color: 'border-green-500 text-green-400' }
    ];

    const generatePrompt = (tool, fix) => {
        const baseSnippet = fix.snippet ? `\n\`\`\`\n${fix.snippet}\n\`\`\`` : '';

        switch (tool) {
            case 'cursor':
                return `(In Cursor)\n\nFix the "${fix.title}" issue in this file.\n\nContext: ${fix.why}\nInstruction: ${fix.howToFix}${baseSnippet}`;
            case 'claude':
                return `Act as a senior software engineer. Fix the following issue in my code:\n\n**Issue**: ${fix.title}\n**Context**: ${fix.why}\n**Instruction**: ${fix.howToFix}\n\n**Code Snippet**:${baseSnippet}\n\nReturn only the fixed code block.`;
            case 'copilot':
                return `/fix Fix ${fix.title}: ${fix.howToFix}. Context: ${fix.why}`;
            case 'chatgpt':
            default:
                return `Fix this issue: ${fix.title}.\nContext: ${fix.why}\nFix: ${fix.howToFix}${baseSnippet}`;
        }
    };

    const handleExportPDF = async () => {
        if (!report) return;
        setIsExporting(true);
        try {
            // Small delay to allow UI to show loading state if needed
            await new Promise(resolve => setTimeout(resolve, 100));
            generatePDF(report, logoXa);
        } catch (error) {
            console.error("PDF Generation failed:", error);
            alert(`Failed to generate PDF: ${error instanceof Error ? error.message : String(error)}`);
        }
        setIsExporting(false);
    };





    useEffect(() => {
        if (reportData) {
            setReport(reportData);
            setRawCode(propCode || '');
        } else {
            const data = loadLatestReport();
            if (data) setReport(data);

            const code = loadLastCode();
            setRawCode(code);
        }
    }, [reportData, propCode]);

    if (!report) {
        return (
            <main
                className="flex flex-col items-center justify-center min-h-[60vh] text-center"
                style={{ zoom: 0.9 }}
            >
                <div className="glass-panel p-12 rounded-2xl border flex flex-col items-center max-w-md mx-auto relative overflow-hidden group" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    <div
                        className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl -z-10 transition-colors"
                        style={{ background: 'rgba(59, 130, 246, 0.1)' }}
                    ></div>

                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 border" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-2">No Audit Data Found</h2>
                    <p className="text-gray-400 mb-8 max-w-xs leading-relaxed">
                        Start a new audit to analyze your code and generate a report.
                    </p>

                    <button
                        className="btn-cyber px-8 py-3 bg-white text-black hover:bg-gray-200 transition-colors"
                        onClick={onBack}
                    >
                        Return to Audit
                    </button>
                </div>
            </main>
        );
    }

    if (report.status === 'INVALID') {
        return (
            <main className="w-full max-w-4xl mx-auto p-6 pt-20 text-center">
                <h2 className="text-3xl font-bold text-white mb-4">Analysis Failed</h2>
                <p className="text-red-400 mb-6">{report.summaryText}</p>
                <button onClick={onBack} className="px-6 py-2 bg-white text-black font-bold rounded-lg">Try Again</button>
            </main>
        );
    }

    // Data Helpers
    const chartData = [
        { label: 'Access.', score: report.categories.accessibility.score, col: '#10b981' }, // Green
        { label: 'Perform.', score: report.categories.performance.score, col: '#3b82f6' }, // Blue
        { label: 'Mobile', score: report.categories.mobile.score, col: '#8b5cf6' }, // Purple
        { label: 'Security', score: report.categories.security.score, col: '#ef4444' }, // Red
        { label: 'Quality', score: report.categories.codeQuality.score, col: '#f59e0b' }, // Yellow
        { label: 'Secrets', score: report.categories.secrets?.score ?? 100, col: '#06b6d4' } // Cyan
    ];

    const totalIssues = report.categories.accessibility.issues.length +
        report.categories.performance.issues.length +
        report.categories.mobile.issues.length +
        report.categories.security.issues.length +
        report.categories.codeQuality.issues.length +
        (report.categories.secrets?.issues.length || 0);

    const criticalCount = report.topFixes.filter(f => f.impactText.includes('CRITICAL') || f.impactText.includes('HIGH')).length;

    return (
        <main id="report-container" className="app-container" style={{ zoom: 0.9 }}>
            {/* Dashboard Grid */}
            <div className="dashboard-grid">

                {/* Header */}
                <div className="dashboard-header">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 rounded-full hover:bg-[rgba(255,255,255,0.05)] text-gray-400 transition-colors">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Audit Report</h1>
                            <p className="text-xs text-gray-500 font-mono">{new Date(report.timestamp).toLocaleString()} • ID: {report.grade.grade}-{(report.overallScore * 23).toString(16).toUpperCase()}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleExportPDF}
                            disabled={isExporting}
                            className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors hover:bg-white/5"
                            style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
                        >
                            {isExporting ? <span className="animate-spin">⏳</span> : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg> Export PDF</>}
                        </button>
                    </div>
                </div>

                {/* Main Stats Chart */}
                <div className="chart-card dashboard-card">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-white">Category Performance</h3>
                            <p className="text-sm text-gray-400 mt-1">Breakdown of audit scores by domain</p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-white tracking-tight">{report.overallScore}</div>
                            <div className="text-xs font-bold text-gray-500 uppercase">Total Score</div>
                        </div>
                    </div>

                    <div className="bar-chart-container mt-auto">
                        {chartData.map((d, i) => (
                            <div key={i} className="chart-column group">
                                <div className="text-xs font-bold text-white mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {d.score}%
                                </div>
                                <div
                                    className="chart-bar"
                                    style={{
                                        height: `${Math.max(5, Math.min(100, Number(d.score) || 0))}%`,
                                        backgroundColor: d.col,
                                        boxShadow: `0 0 20px -5px ${d.col}`
                                    }}
                                >
                                    {/* Stripe Pattern Overlay */}
                                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(45deg,rgba(0,0,0,.15) 25%,transparent 25%,transparent 50%,rgba(0,0,0,.15) 50%,rgba(0,0,0,.15) 75%,transparent 75%,transparent)', backgroundSize: '10px 10px' }}></div>
                                </div>
                                <div className="chart-label">{d.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Overall Grade Card */}
                <div className="list-card dashboard-card flex flex-col items-center justify-center relative">
                    <div className="absolute top-6 left-6 text-label">Overall Grade</div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className={`text-[8rem] font-black leading-none ${report.grade.grade.startsWith('A') ? 'text-brand-green drop-shadow-[0_0_25px_rgba(16,185,129,0.5)]' :
                            report.grade.grade.startsWith('B') ? 'text-brand-cyan drop-shadow-[0_0_25px_rgba(6,182,212,0.5)]' :
                                report.grade.grade.startsWith('C') ? 'text-brand-yellow drop-shadow-[0_0_25px_rgba(234,179,8,0.5)]' :
                                    'text-brand-red drop-shadow-[0_0_25px_rgba(239,68,68,0.5)]'
                            }`}>
                            {report.grade.grade}
                        </div>
                        <div className={`mt-4 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${report.grade.grade.startsWith('A') ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                            report.grade.grade.startsWith('B') ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' :
                                report.grade.grade.startsWith('C') ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                                    'bg-red-500/10 border-red-500/30 text-red-400'
                            }`}>
                            {report.grade.grade.startsWith('A') ? 'Production Ready' : 'Improvements Needed'}
                        </div>
                    </div>
                    {/* Decorative background circle */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-full blur-3xl opacity-30 transform scale-75 pointer-events-none"></div>
                </div>

                {/* Small Stats Row */}
                <div className="stat-card dashboard-card">
                    <div className="text-label mb-2">Total Issues</div>
                    <div className="text-value-lg mt-auto">{totalIssues}</div>
                    <div className="text-xs text-gray-500 mt-1">Across 6 categories</div>
                </div>

                <div className="stat-card dashboard-card">
                    <div className="text-label mb-2">Critical Fixes</div>
                    <div className="text-value-lg mt-auto text-brand-red">{criticalCount}</div>
                    <div className={`text-xs mt-1 ${criticalCount > 0 ? 'text-brand-red/60' : 'text-gray-500'}`}>
                        {criticalCount > 0 ? 'Requires immediate attention' : 'No critical vulnerabilities'}
                    </div>
                </div>

                <div className="stat-card dashboard-card">
                    <div className="text-label mb-2">Security Score</div>
                    <div className={`text-value-lg mt-auto ${report.categories.security.score < 70 ? 'text-brand-red' : 'text-brand-green'}`}>
                        {report.categories.security.score}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Weighted confidence</div>
                </div>

                <div className="stat-card dashboard-card">
                    <div className="text-label mb-2">Est. Tech Debt</div>
                    <div className="text-value-lg mt-auto text-yellow-400">
                        {totalIssues > 10 ? 'High' : totalIssues > 5 ? 'Med' : 'Low'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Based on code volume</div>
                </div>

                {/* Issues List (Best Selling Products equiv) */}
                <div className="list-card dashboard-card" style={{ gridColumn: 'span 8', minHeight: '400px' }}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white">Top Priority Fixes</h3>

                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                        {report.topFixes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <span className="text-3xl mb-2">🎉</span>
                                <span className="text-sm">No critical issues found</span>
                            </div>
                        ) : (
                            report.topFixes.map((fix, i) => (
                                <div key={i} className="issue-item group" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                    <div
                                        className="issue-icon"
                                        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1), transparent)' }}
                                    >
                                        {fix.difficulty === 'hard' ? '🔥' : fix.difficulty === 'medium' ? '⚠️' : '🔧'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1">
                                            <h4 className="font-bold text-white text-sm transition-colors" style={{ color: 'white' }}>{fix.title}</h4>
                                            <span className="text-xs font-mono text-gray-500">{fix.impactText.replace('POINTS', 'pts')}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 line-clamp-1">{fix.why}</p>
                                    </div>
                                    <button
                                        onClick={() => { setSelectedFix(fix); setSelectedTool(null); }}
                                        className="px-4 py-2 rounded-lg text-xs font-bold text-white border transition-colors h-fit self-center ml-2"
                                        style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
                                    >
                                        Fix
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* AI Insights (Top Crew equiv) */}
                <div className="list-card dashboard-card" style={{ gridColumn: 'span 4', background: '#1a1a1a' }}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center relative overflow-hidden shrink-0" style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)' }}>
                            {/* CSS Robot Face */}
                            <div className="relative w-6 h-6 rounded-md flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.5)]" style={{ backgroundColor: '#8b5cf6' }}>
                                {/* Eyes */}
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                                </div>
                                {/* Antenna */}
                                <div className="absolute -top-1 right-1 w-0.5 h-2" style={{ backgroundColor: 'rgba(139, 92, 246, 0.8)' }}></div>
                                <div className="absolute -top-1.5 right-0.5 w-1.5 h-1.5 bg-white rounded-full animate-ping opacity-50"></div>
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-white">AI Verdict</h3>
                    </div>

                    <div className="rounded-xl p-4 mb-4 border" style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.05)' }}>
                        <p className="text-sm text-gray-400 leading-relaxed italic">
                            "{report.finalReviewerComment || report.summaryText}"
                        </p>
                    </div>

                    <div className="mt-auto">
                        <div className="text-label mb-3">AI Detection Confidence</div>
                        <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1f2937' }}>
                            <div className="h-full w-[85%] relative" style={{ backgroundColor: '#8b5cf6' }}>
                                <div className="absolute inset-0 animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}></div>
                            </div>
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-gray-500">
                            <span>Analysis Depth</span>
                            <span style={{ color: '#8b5cf6' }}>High (v2.5)</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* Fix Suggestion Modal */}
            {selectedFix && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedFix(null)}>
                    <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 max-w-2xl w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setSelectedFix(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>

                        {!selectedTool ? (
                            <>
                                <h3 className="text-xl font-bold text-white mb-6">Select your Vibe Coding Tool</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {TOOLS.map(tool => (
                                        <button
                                            key={tool.id}
                                            onClick={() => setSelectedTool(tool.id)}
                                            className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-3 group ${tool.color} hover:border-current`}
                                            style={{
                                                backgroundColor: 'rgba(255,255,255,0.05)',
                                                borderColor: 'rgba(255,255,255,0.1)'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                        >
                                            {tool.image ? (
                                                <img src={tool.image} alt={tool.name} className="w-8 h-8 object-contain group-hover:scale-110 transition-transform" />
                                            ) : (
                                                <span className="text-3xl group-hover:scale-110 transition-transform">{tool.icon}</span>
                                            )}
                                            <span className="font-bold text-gray-200 group-hover:text-white">{tool.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-3 mb-4">
                                    <button
                                        onClick={() => setSelectedTool(null)}
                                        className="p-1 -ml-2 rounded-full text-gray-400"
                                        style={{ backgroundColor: 'transparent' }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                                    </button>
                                    <h3 className="text-xl font-bold text-white">Generate Prompt for {TOOLS.find(t => t.id === selectedTool)?.name}</h3>
                                </div>

                                <div className="rounded-xl p-4 border font-mono text-xs md:text-sm text-gray-300 mb-6 overflow-x-auto whitespace-pre-wrap max-h-[300px] custom-scrollbar shadow-inner relative group" style={{ backgroundColor: 'rgba(0,0,0,0.5)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                    {generatePrompt(selectedTool, selectedFix)}
                                </div>

                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={() => {
                                            const text = generatePrompt(selectedTool, selectedFix);
                                            navigator.clipboard.writeText(text);
                                        }}
                                        className="btn-cyber px-6 py-2 bg-brand-blue text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_30px_rgba(59,130,246,0.8)]"
                                    >
                                        Copy Prompt
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* All Issues Modal */}
            {showAllIssues && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowAllIssues(false)}>
                    <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 max-w-4xl w-full shadow-2xl relative max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-white">All Audit Findings</h3>
                                <p className="text-sm text-gray-500">Comprehensive list of all identified issues</p>
                            </div>
                            <button
                                onClick={() => setShowAllIssues(false)}
                                className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="overflow-y-auto custom-scrollbar pr-2 flex-1 space-y-8">
                            {Object.entries(report.categories).map(([key, cat]) => (
                                cat && cat.issues && cat.issues.length > 0 && (
                                    <div key={key} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-2">
                                            <div className={`w-2 h-8 rounded-full ${key === 'security' ? 'bg-red-500' :
                                                key === 'performance' ? 'bg-blue-500' :
                                                    key === 'accessibility' ? 'bg-green-500' :
                                                        'bg-purple-500'
                                                }`}></div>
                                            <h4 className="text-lg font-bold text-white uppercase tracking-wider">
                                                {key === 'codeQuality' ? 'Code Quality' : key}
                                                <span className="ml-3 text-sm font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded">Score: {cat.score}%</span>
                                            </h4>
                                        </div>

                                        <div className="grid gap-3">
                                            {cat.issues.map((issue, idx) => (
                                                <div key={idx} className="group p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300">
                                                    <div className="flex flex-col md:flex-row gap-4 items-start">
                                                        <div className="flex-1">
                                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                                <span className={`text-[10px] font-bold px-2 py-1 rounded border ${issue.impactText.includes('CRITICAL') ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                                                    issue.impactText.includes('HIGH') ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                                                                        'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                                                    }`}>
                                                                    {issue.impactText || 'MEDIUM'}
                                                                </span>
                                                                <h5 className="font-bold text-gray-200 text-sm">{issue.title}</h5>
                                                            </div>
                                                            <p className="text-sm text-gray-400 mb-3 leading-relaxed">{issue.why || 'No context provided.'}</p>

                                                            <div className="flex gap-4 text-xs text-gray-500 font-mono">
                                                                <span className="flex items-center gap-1">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                                                                    Difficulty: {issue.difficulty || 'medium'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={() => {
                                                                setSelectedFix(issue);
                                                                setSelectedTool(null);
                                                                // Don't close All Issues modal, so user can return to it if they just close the fix modal
                                                                // But since fix modal is on top (z-50), and this is z-40, it should be fine.
                                                                // Actually, fix modal is z-50. Let's make this z-[100] to be explicitly higher than main view but lower than tool selection if possible?
                                                                // Wait, Fix Modal (line 334) has z-50.
                                                                // If I make this z-[100], it will cover the Fix Modal if I open Fix Modal while this is open.
                                                                // So I should make this z-40 (lower than Fix Modal) OR close this when opening Fix.
                                                                // Let's close this one for cleaner UX.
                                                                setShowAllIssues(false);
                                                            }}
                                                            className="px-4 py-2 rounded-lg text-xs font-bold text-white border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all shrink-0 whitespace-nowrap flex items-center gap-2"
                                                        >
                                                            <span>Fix Issue</span>
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
