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
        <div style={{ position: 'fixed', inset: 0, zIndex: 99, display: 'flex', justifyContent: 'flex-end' }} role="dialog" aria-label="History">
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }} onClick={onClose} />
            <div style={{ position: 'relative', width: '100%', maxWidth: '420px', height: '100%', background: '#141414', borderLeft: '1px solid var(--line)', padding: '32px 28px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: 0 }}>Audit History</h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', padding: '4px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                </div>
                <p style={{ fontSize: '13px', color: '#888', marginBottom: '24px', lineHeight: 1.5 }}>
                    Summaries saved locally on this browser. Raw code snippets are never stored.
                </p>

                {!saveEnabled && (
                    <div style={{ marginBottom: '24px', padding: '16px', borderRadius: '14px', border: '1px solid var(--line)', background: 'rgba(255,255,255,0.02)', color: '#aaa', fontSize: '13px' }}>
                        "Save local report summaries" is currently disabled. Turn it on in Privacy Controls to keep history.
                    </div>
                )}

                {history.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 0', color: '#666', fontSize: '14px' }}>No history items stored.</div>
                ) : (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                            {history.map((item) => {
                                const sev = highestSeverity(item.countsBySeverity);
                                return (
                                    <div key={item.id} style={{ border: '1px solid var(--line)', borderRadius: '14px', padding: '16px', background: 'var(--panel)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span className={`checker-sev-badge ${SEVERITY_COLOR[sev].bg} ${SEVERITY_COLOR[sev].text}`} style={{ flexShrink: 0 }}>
                                            {sev}
                                        </span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff', textTransform: 'uppercase' }}>
                                                {item.language} • {item.findingCount} finding(s)
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#777', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                                                {formatTime(item.createdAt)} — {item.codeExcerptMasked}
                                            </div>
                                        </div>
                                        <button onClick={() => handleDelete(item.id)} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }} title="Delete">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        <button onClick={handleClearAll} style={{ background: 'transparent', border: 'none', color: '#ff6b6b', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer' }}>Clear all history</button>
                    </>
                )}
            </div>
        </div>
    );
}
