import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import { getAuditHistory, deleteHistoryItem, clearAuditHistory } from '../lib/storage/history';
import { isSaveLocallyEnabled } from '../lib/storage';
import './AuditTool.css';

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'];
const SEVERITY_COLOR = {
    critical: 'text-red-400 border-red-500/20 bg-red-500/10',
    high: 'text-orange-400 border-orange-500/20 bg-orange-500/10',
    medium: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10',
    low: 'text-blue-400 border-blue-500/20 bg-blue-500/10',
    info: 'text-gray-400 border-gray-500/20 bg-gray-500/10',
};

export default function HistoryPage() {
    const [history, setHistory] = useState([]);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const navigate = useNavigate();
    const saveEnabled = isSaveLocallyEnabled();

    useEffect(() => {
        setHistory(getAuditHistory());
    }, []);

    const handleDelete = (id, e) => {
        e.stopPropagation();
        deleteHistoryItem(id);
        setHistory(getAuditHistory());
    };

    const confirmClearAll = () => {
        clearAuditHistory();
        setHistory([]);
        setShowClearConfirm(false);
    };

    const formatTime = (isoString) => {
        const date = new Date(isoString);
        const diffInSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        return date.toLocaleDateString();
    };

    const highestSeverity = (counts) => SEVERITY_ORDER.find((s) => (counts?.[s] ?? 0) > 0) || 'info';

    return (
        <div className="app-container min-h-screen text-white relative">
            <Navbar activeView="history" onViewChange={(view) => navigate(view === 'audit' ? '/audit' : '/audit/history')} />

            <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-[1200px] mx-auto p-4 md:p-8 pt-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase text-white">History</h1>
                        <p className="text-gray-400 font-medium mt-1 text-sm md:text-base">
                            Lightweight local summaries only — counts, language, and a masked excerpt. No raw code or full findings are stored; re-run an analysis to see full findings again.
                        </p>
                    </div>
                    {history.length > 0 && (
                        <button onClick={() => setShowClearConfirm(true)} className="w-full md:w-auto justify-center px-6 py-2 border border-white/20 hover:bg-brand-red/10 hover:border-brand-red hover:text-brand-red text-gray-400 font-bold transition-all flex items-center gap-2 uppercase tracking-wider bg-black/40 backdrop-blur-sm">
                            Clear All
                        </button>
                    )}
                </div>

                {!saveEnabled && (
                    <div className="mb-8 px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-gray-400 text-sm">
                        "Save report summaries locally" is currently off (the default). Turn it on from the checker page to start building history.
                    </div>
                )}

                {history.length === 0 ? (
                    <div className="border border-white/10 p-16 text-center bg-[#121212]">
                        <h2 className="text-2xl font-black uppercase italic mb-2 text-white">No History Found</h2>
                        <p className="text-gray-500 max-w-sm mx-auto mb-8">Nothing has been saved locally yet.</p>
                        <button onClick={() => navigate('/audit')} className="btn-cyber px-8 py-3">Start New Check</button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {history.map((item) => {
                            const sev = highestSeverity(item.countsBySeverity);
                            return (
                                <div key={item.id} className="bg-[#121212] border border-white/10 p-6 flex items-center gap-6 group relative overflow-hidden">
                                    <div className={`w-14 h-14 flex items-center justify-center text-xs font-black shrink-0 border rounded-lg uppercase ${SEVERITY_COLOR[sev]}`}>
                                        {sev}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 mb-2">
                                            <h3 className="font-bold text-lg uppercase tracking-tight truncate text-white">{item.language} check</h3>
                                            <span className="self-start md:self-auto text-xs font-bold px-2 py-0.5 bg-white/10 border border-white/10 text-gray-300 uppercase tracking-wider">
                                                {item.findingCount} finding(s)
                                            </span>
                                        </div>
                                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-gray-500 text-sm font-medium">
                                            <span>{formatTime(item.createdAt)}</span>
                                            <span className="hidden md:block truncate opacity-60 font-mono text-xs pl-4 border-l border-white/10">{item.codeExcerptMasked}...</span>
                                        </div>
                                    </div>
                                    <button onClick={(e) => handleDelete(item.id, e)} className="p-3 border border-white/10 hover:bg-red-500/20 hover:border-red-500 text-gray-400 hover:text-red-500 transition-all" title="Delete">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </motion.main>

            <AnimatePresence>
                {showClearConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowClearConfirm(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative bg-[#1a1a1a] border border-white/10 p-8 w-full max-w-md shadow-2xl">
                            <h3 className="text-xl font-black uppercase text-white mb-2">Clear History?</h3>
                            <p className="text-gray-400 mb-8">This permanently deletes all locally saved summaries. This cannot be undone.</p>
                            <div className="flex gap-3 justify-end">
                                <button onClick={() => setShowClearConfirm(false)} className="px-6 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors">CANCEL</button>
                                <button onClick={confirmClearAll} className="px-6 py-2 bg-brand-red text-white text-sm font-bold hover:bg-red-600 transition-colors">YES, CLEAR ALL</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
