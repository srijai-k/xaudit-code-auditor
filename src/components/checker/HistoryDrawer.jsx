import React, { useState, useEffect } from 'react';
import { getAuditHistory, deleteHistoryItem, clearAuditHistory } from '../../lib/storage/history';
import { isSaveLocallyEnabled } from '../../lib/storage';
import { SEVERITY_ORDER, SEVERITY_COLOR } from './severity';

function highestSeverity(counts) {
    return SEVERITY_ORDER.find((s) => (counts?.[s] ?? 0) > 0) || 'info';
}

function formatTime(isoString) {
    const date = new Date(isoString);
    const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} min ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hr ago`;
    return date.toLocaleDateString();
}

export default function HistoryDrawer({ open, onClose }) {
    const [history, setHistory] = useState([]);
    const saveEnabled = isSaveLocallyEnabled();

    useEffect(() => {
        if (open) setHistory(getAuditHistory());
    }, [open]);

    if (!open) return null;

    const handleDelete = (id) => {
        deleteHistoryItem(id);
        setHistory(getAuditHistory());
    };

    const handleClearAll = () => {
        clearAuditHistory();
        setHistory([]);
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-label="History">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-sm h-full bg-[#0c0c0c] border-l border-white/10 p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-white">History</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                </div>
                <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                    Lightweight local summaries only — counts, language, and a masked excerpt. No raw code or full findings are stored; re-run an analysis to see full findings again.
                </p>

                {!saveEnabled && (
                    <div className="mb-6 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-gray-400 text-xs">
                        "Save report summaries locally" is off (the default). Turn it on to start building history.
                    </div>
                )}

                {history.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 text-sm">Nothing saved locally yet.</div>
                ) : (
                    <>
                        <div className="space-y-2 mb-4">
                            {history.map((item) => {
                                const sev = highestSeverity(item.countsBySeverity);
                                return (
                                    <div key={item.id} className="border border-white/10 rounded-lg p-3 flex items-center gap-3">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase shrink-0 ${SEVERITY_COLOR[sev].bg} ${SEVERITY_COLOR[sev].text}`}>{sev}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-white uppercase">{item.language} • {item.findingCount} finding(s)</div>
                                            <div className="text-[11px] text-gray-500 truncate">{formatTime(item.createdAt)} — {item.codeExcerptMasked}</div>
                                        </div>
                                        <button onClick={() => handleDelete(item.id)} className="text-gray-500 hover:text-red-400 shrink-0" title="Delete">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        <button onClick={handleClearAll} className="text-xs text-red-400 hover:text-red-300 font-bold uppercase">Clear all</button>
                    </>
                )}
            </div>
        </div>
    );
}
