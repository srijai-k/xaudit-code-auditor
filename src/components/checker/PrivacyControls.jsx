import React, { useState } from 'react';
import { isSaveLocallyEnabled, setSaveLocallyEnabled, clearLocalData } from '../../lib/storage';
import { clearAuditHistory } from '../../lib/storage/history';

export default function PrivacyControls({ onCleared }) {
    const [saveLocally, setSaveLocally] = useState(isSaveLocallyEnabled());
    const [cleared, setCleared] = useState(false);

    const toggle = () => {
        const next = !saveLocally;
        setSaveLocally(next);
        setSaveLocallyEnabled(next);
    };

    const handleClear = () => {
        clearLocalData();
        clearAuditHistory();
        setCleared(true);
        onCleared?.();
        setTimeout(() => setCleared(false), 2000);
    };

    return (
        <div className="checker-privacy-card">
            <p style={{ marginBottom: '16px', color: '#888', fontSize: '13px', lineHeight: 1.6 }}>
                <strong>Zero Network Transmission:</strong> Nothing is transmitted over any network connection by XAUDIT. Analysis runs entirely inside your browser's Web Worker. By default, no code or findings are saved to local storage.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#eee', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                    <input type="checkbox" checked={saveLocally} onChange={toggle} style={{ accentColor: 'var(--lav)', width: '16px', height: '16px' }} />
                    Save local report summaries
                </label>
                <button
                    onClick={handleClear}
                    style={{
                        padding: '8px 18px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        background: 'rgba(255, 82, 82, 0.1)',
                        border: '1px solid rgba(255, 82, 82, 0.3)',
                        color: '#ff6b6b',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                >
                    {cleared ? 'Cleared ✓' : 'Clear local storage'}
                </button>
            </div>
        </div>
    );
}
