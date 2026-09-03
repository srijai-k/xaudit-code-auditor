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
        <div className="border border-white/10 rounded-2xl bg-black/40 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-white/10 bg-white/[0.02]">
                <div className="flex gap-1.5">
                    {MODES.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => onModeChange(m.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${mode === m.id ? 'bg-brand-blue text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handlePaste} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 rounded-lg border border-white/10 transition-colors">
                        Paste
                    </button>
                    <button onClick={loadSample} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-xs font-bold text-brand-blue/80 hover:text-brand-blue rounded-lg border border-white/10 transition-colors">
                        Insert Example
                    </button>
                </div>
            </div>

            <textarea
                value={code}
                onChange={(e) => onCodeChange(e.target.value)}
                placeholder={mode === 'html' ? '// Paste HTML here...' : '// Paste JavaScript, TypeScript, or React/JSX here...'}
                spellCheck="false"
                rows={12}
                className="w-full bg-transparent p-5 font-mono text-sm leading-relaxed text-gray-200 resize-y focus:outline-none placeholder:text-gray-700"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-white/10 bg-white/[0.02]">
                <span className={`text-xs font-mono ${overLimit ? 'text-red-400 font-bold' : 'text-gray-500'}`}>
                    {(sizeBytes / 1024).toFixed(1)} KB / {(MAX_SOURCE_BYTES / 1024).toFixed(0)} KB
                    {overLimit && ' — over the analysis limit, will be rejected'}
                </span>
                <button
                    onClick={onRun}
                    disabled={running || !code.trim() || overLimit}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wide transition-all ${(!code.trim() || overLimit) ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-brand-blue text-white hover:bg-blue-600'}`}
                >
                    {running ? (stageLine || 'Analyzing…') : 'Run Analysis'}
                </button>
            </div>
        </div>
    );
}
