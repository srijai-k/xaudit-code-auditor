import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getAuditHistory, deleteAudit, clearAudits } from '../lib/storage/history';
import './AuditTool.css';

export default function HistoryPage() {
    const [history, setHistory] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        setHistory(getAuditHistory());
    }, []);

    const handleDelete = (id, e) => {
        e.stopPropagation();
        deleteAudit(id);
        setHistory(getAuditHistory());
    };

    const handleClearAll = () => {
        if (window.confirm('Are you sure you want to clear all audit history?')) {
            clearAudits();
            setHistory([]);
        }
    };

    const formatTime = (isoString) => {
        const date = new Date(isoString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="app-container min-h-screen text-white">
            <Navbar activeView="history" onViewChange={(view) => navigate(view === 'audit' ? '/audit' : '/audit/history')} />

            <main className="max-w-[1200px] mx-auto p-4 md:p-8 pt-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight uppercase text-white">Audit History</h1>
                        <p className="text-gray-400 font-medium mt-1">Review your past security and quality reports.</p>
                    </div>
                    {history.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            className="px-6 py-2 border border-white/20 hover:bg-red-500/10 hover:border-red-500 hover:text-red-500 text-gray-400 font-bold transition-all flex items-center gap-2 uppercase tracking-wider"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Clear All
                        </button>
                    )}
                </div>

                {history.length === 0 ? (
                    <div className="border border-white/10 p-16 text-center bg-[#121212]">
                        <div className="w-20 h-20 bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-black uppercase italic mb-2 text-white">No History Found</h2>
                        <p className="text-gray-500 max-w-sm mx-auto mb-8">You haven't performed any audits yet. Start by pasting some code in the audit tool.</p>
                        <button
                            onClick={() => navigate('/audit')}
                            className="btn-cyber px-8 py-3"
                        >
                            Start New Audit
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {history.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => navigate(`/audit/report?id=${item.id}`)}
                                className="bg-[#121212] border border-white/10 p-6 hover:border-brand-blue/50 hover:bg-white/5 transition-all cursor-pointer flex items-center gap-6 group relative overflow-hidden"
                            >
                                <div className={`w-16 h-16 flex items-center justify-center text-3xl font-black shrink-0 ${['A', 'A+'].includes(item.grade) ? 'bg-green-500/10 text-brand-green border border-green-500/20' :
                                    ['B', 'B+'].includes(item.grade) ? 'bg-cyan-500/10 text-brand-cyan border border-cyan-500/20' :
                                        ['C', 'C+'].includes(item.grade) ? 'bg-yellow-500/10 text-brand-yellow border border-yellow-500/20' :
                                            'bg-red-500/10 text-brand-red border border-red-500/20'
                                    }`}>
                                    {item.grade}
                                </div>

                                <div className="flex-grow min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-bold text-xl uppercase tracking-tight truncate text-white">
                                            {item.language} Audit
                                        </h3>
                                        <span className="text-xs font-bold px-2 py-0.5 bg-white/10 border border-white/10 text-gray-300 uppercase tracking-wider">
                                            Score: {item.overallScore}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-gray-500 text-sm font-medium">
                                        <span className="flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {formatTime(item.createdAt)}
                                        </span>
                                        <span className="truncate opacity-60 font-mono text-xs pl-4 border-l border-white/10">
                                            {item.codeSnippet}...
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => handleDelete(item.id, e)}
                                        className="p-3 border border-white/10 hover:bg-red-500/20 hover:border-red-500 text-gray-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                        title="Delete Audit"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                    <div className="p-3 bg-white text-black font-bold border border-white hover:bg-brand-blue hover:border-brand-blue hover:text-white transition-all transform group-hover:translate-x-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
