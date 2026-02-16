import React, { useState, useEffect } from 'react';
import { loadLatestReport, loadLastCode } from '../lib/storage';
import { exportReportToPDF } from '../lib/export/pdf';
import logoXa from '../assets/logo-xa.png';
import '../pages/AuditTool.css'; // Ensure CSS is loaded

export default function ReportView({ onBack, reportData, rawCode: propCode }) {
    const [report, setReport] = useState(null);
    const [rawCode, setRawCode] = useState('');
    const [isExporting, setIsExporting] = useState(false);

    const handleExportPDF = async () => {
        if (!report) return;
        setIsExporting(true);
        await exportReportToPDF(report);
        setIsExporting(false);
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Delay setting mounted to true to ensure the initial state (height: 5%) is rendered first
        // and the browser recognizes the transition.
        const timer = setTimeout(() => {
            setMounted(true);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

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
                <div className="glass-panel p-12 rounded-2xl border border-white/10 flex flex-col items-center max-w-md mx-auto relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/10 rounded-full blur-2xl -z-10 group-hover:bg-brand-blue/20 transition-colors"></div>

                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
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
        <main className="app-container" style={{ zoom: 0.9 }}>
            {/* Dashboard Grid */}
            <div className="dashboard-grid">

                {/* Header */}
                <div className="dashboard-header">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 rounded-full hover:bg-white/5 text-gray-400 transition-colors">
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
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
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
                                        height: `${mounted ? Math.max(5, d.score) : 5}%`,
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
                    <div className="text-xs text-brand-red/60 mt-1">Requires immediate attention</div>
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
                        <button className="text-xs font-bold text-brand-blue hover:text-white transition-colors">View All Issues &rarr;</button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                        {report.topFixes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <span className="text-3xl mb-2">🎉</span>
                                <span className="text-sm">No critical issues found</span>
                            </div>
                        ) : (
                            report.topFixes.map((fix, i) => (
                                <div key={i} className="issue-item group">
                                    <div className="issue-icon bg-gradient-to-br from-white/10 to-transparent">
                                        {fix.difficulty === 'hard' ? '🔥' : fix.difficulty === 'medium' ? '⚠️' : '🔧'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1">
                                            <h4 className="font-bold text-white text-sm group-hover:text-brand-blue transition-colors">{fix.title}</h4>
                                            <span className="text-xs font-mono text-gray-500">{fix.impactText.replace('POINTS', 'pts')}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 line-clamp-1">{fix.why}</p>
                                    </div>
                                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white border border-white/10 transition-colors h-fit self-center ml-2">
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
                        <div className="w-10 h-10 rounded-lg bg-brand-purple/20 flex items-center justify-center relative overflow-hidden shrink-0">
                            {/* CSS Robot Face */}
                            <div className="relative w-6 h-6 bg-brand-purple rounded-md flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.5)]">
                                {/* Eyes */}
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                                </div>
                                {/* Antenna */}
                                <div className="absolute -top-1 right-1 w-0.5 h-2 bg-brand-purple/80"></div>
                                <div className="absolute -top-1.5 right-0.5 w-1.5 h-1.5 bg-white rounded-full animate-ping opacity-50"></div>
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-white">AI Verdict</h3>
                    </div>

                    <div className="bg-black/20 rounded-xl p-4 mb-4 border border-white/5">
                        <p className="text-sm text-gray-400 leading-relaxed italic">
                            "{report.finalReviewerComment || report.summaryText}"
                        </p>
                    </div>

                    <div className="mt-auto">
                        <div className="text-label mb-3">AI Detection Confidence</div>
                        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-purple w-[85%] relative">
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            </div>
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-gray-500">
                            <span>Analysis Depth</span>
                            <span className="text-brand-purple">High (v2.5)</span>
                        </div>
                    </div>
                </div>

            </div>
        </main>
    );
}
