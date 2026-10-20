import React, { useEffect, useRef, useState } from 'react';

// A plain <textarea> with two layers drawn behind it: line numbers on the
// left and a coloured band across every line a finding points at. The
// textarea itself stays the real input (typing, pasting, undo, screen
// readers and the e2e test all work exactly as before); it's just
// transparent, and the layers are scrolled to match it.
//
// Wrapping is off on purpose, like a code editor: with soft wrap the
// textarea and the layer behind it would have to wrap at exactly the same
// pixel, which they don't once a scrollbar appears.

const LINE_HEIGHT = 22.4; // 14px * 1.6, matches .checker-textarea

export default function CodeEditor({ value, onChange, placeholder, highlights, jumpRef }) {
    const inputRef = useRef(null);
    const linesRef = useRef(null);
    const gutterRef = useRef(null);
    const [flashLine, setFlashLine] = useState(null);

    const lines = value.split('\n');

    const syncScroll = () => {
        const el = inputRef.current;
        if (!el) return;
        if (linesRef.current) linesRef.current.style.transform = `translate(${-el.scrollLeft}px, ${-el.scrollTop}px)`;
        if (gutterRef.current) gutterRef.current.style.transform = `translateY(${-el.scrollTop}px)`;
    };

    // Re-sync after the content changes size (paste, sample, clear).
    useEffect(syncScroll, [value]);

    // Lets the findings list jump the editor to a line.
    useEffect(() => {
        if (!jumpRef) return;
        jumpRef.current = (line) => {
            const el = inputRef.current;
            if (!el) return;
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.scrollTop = Math.max(0, (line - 1) * LINE_HEIGHT - el.clientHeight / 3);
            syncScroll();
            setFlashLine(line);
            window.setTimeout(() => setFlashLine((l) => (l === line ? null : l)), 1400);
        };
        return () => { jumpRef.current = null; };
    }, [jumpRef]);

    return (
        <div className="code-editor">
            <div className="code-editor-gutter" aria-hidden="true">
                <div ref={gutterRef}>
                    {lines.map((_, i) => {
                        const sev = highlights?.get(i + 1);
                        return (
                            <div key={i} className={`code-editor-num${sev ? ` is-${sev}` : ''}`}>{i + 1}</div>
                        );
                    })}
                </div>
            </div>
            <div className="code-editor-backdrop" aria-hidden="true">
                <div ref={linesRef} className="code-editor-lines">
                    {lines.map((text, i) => {
                        const sev = highlights?.get(i + 1);
                        const cls = `code-editor-line${sev ? ` is-${sev}` : ''}${flashLine === i + 1 ? ' is-flash' : ''}`;
                        return <div key={i} className={cls}>{text || ' '}</div>;
                    })}
                </div>
            </div>
            <textarea
                ref={inputRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onScroll={syncScroll}
                placeholder={placeholder}
                spellCheck="false"
                wrap="off"
                rows={12}
                className="checker-textarea code-editor-input"
            />
        </div>
    );
}
