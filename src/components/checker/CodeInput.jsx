import React from 'react';
import { MAX_SOURCE_BYTES } from '../../lib/analysis/types';

const SAMPLES = {
    html: `<!DOCTYPE html>
<html>
<head>
    <title>Sample Page</title>
</head>
<body>
    <h1>Hello World</h1>
    <img src="https://example.com/logo.png">
    <button onclick="alert('hi')">Submit</button>
</body>
</html>`,
    script: `import React from 'react';

export default function Profile({ user }) {
  const handleClick = () => console.log('clicked');

  return (
    <div onClick={handleClick}>
      <button onClick={handleClick}>Save</button>
      <div dangerouslySetInnerHTML={{ __html: user.bio }} />
    </div>
  );
}`,
    'package-json': `{
  "name": "example-app",
  "version": "1.0.0",
  "dependencies": {
    "express": "*",
    "lodash": "^4.17.21",
    "some-fork": "git+https://github.com/someuser/some-fork.git",
    "eslint": "^9.0.0"
  },
  "devDependencies": {
    "vitest": "^3.0.0"
  },
  "scripts": {
    "postinstall": "node ./scripts/setup.js",
    "build": "vite build"
  }
}`,
};

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

    const loadSample = () => {
        onCodeChange(SAMPLES[mode] || SAMPLES.script);
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
                    {overLimit && ' — over the analysis limit, will be rejected'}
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
