import React, { useRef } from 'react';
import { MAX_SOURCE_BYTES } from '../../lib/analysis/types';
import { samplesForMode } from '../../data/samples';

const MODES = [
    { id: 'html', label: 'HTML' },
    { id: 'script', label: 'JS / TS / React' },
    { id: 'package-json', label: 'package.json' },
    { id: 'auto', label: 'Auto-detect' },
];

export default function CodeInput({ code, onCodeChange, mode, onModeChange, onRun, running, stageLine }) {
    const sizeBytes = new TextEncoder().encode(code).length;
    const overLimit = sizeBytes > MAX_SOURCE_BYTES;

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            onCodeChange(text);
        } catch (err) {
            console.error('Failed to read clipboard contents:', err);
        }
    };

    // Each click loads the next sample that fits the selected mode, so
    // clicking again shows a different kind of mistake.
    const sampleTurn = useRef(0);
    const loadSample = () => {
        const options = samplesForMode(mode);
        onCodeChange(options[sampleTurn.current % options.length].code);
        sampleTurn.current += 1;
    };

    return (
        <div className="checker-editor-card">
            <div className="checker-editor-header">
                <div className="checker-modes">
                    {MODES.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => onModeChange(m.id)}
                            className={`checker-mode-btn ${mode === m.id ? 'active' : ''}`}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>
                <div className="checker-actions">
                    <button onClick={handlePaste} className="checker-action-btn">
                        Paste Clipboard
                    </button>
                    <button onClick={loadSample} className="checker-action-btn">
                        Insert Sample
                    </button>
                </div>
            </div>

            <textarea
                value={code}
                onChange={(e) => onCodeChange(e.target.value)}
                placeholder={mode === 'html' ? '// Paste HTML here...' : '// Paste JavaScript, TypeScript, React/JSX, or package.json here...'}
                spellCheck="false"
                rows={12}
                className="checker-textarea"
            />

            <div className="checker-editor-footer">
                <span className={`checker-limit-text ${overLimit ? 'over' : ''}`}>
                    {(sizeBytes / 1024).toFixed(1)} KB / {(MAX_SOURCE_BYTES / 1024).toFixed(0)} KB
                    {overLimit && ' · too big, this will get rejected'}
                </span>
                <button
                    onClick={onRun}
                    disabled={running || !code.trim() || overLimit}
                    className="checker-run-btn"
                >
                    <span className="checker-run-btn-icon">{running ? '⚙' : '+'}</span>
                    {running ? (stageLine || 'Analyzing…') : 'Run Analysis'}
                </button>
            </div>
        </div>
    );
}
