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
        <div className="border border-white/10 rounded-xl p-4 bg-white/[0.02] text-xs text-gray-500">
            <p className="mb-3 leading-relaxed">
                Nothing is sent anywhere by this app. By default, nothing is saved to this browser either. If enabled, localStorage is plaintext (not encrypted) and stores only counts, language, and a short masked excerpt — never your raw code or a full secret value.
            </p>
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <label className="flex items-center gap-2 text-gray-300 cursor-pointer select-none">
                    <input type="checkbox" checked={saveLocally} onChange={toggle} className="accent-brand-blue" />
                    Save report summaries locally
                </label>
                <button onClick={handleClear} className="px-3 py-1.5 text-[11px] font-bold uppercase rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/10 transition-colors">
                    {cleared ? 'Cleared ✓' : 'Clear local data'}
                </button>
            </div>
        </div>
    );
}
