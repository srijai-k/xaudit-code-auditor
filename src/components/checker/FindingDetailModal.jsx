import React, { useState } from 'react';
import { SEVERITY_COLOR } from './severity';

const TOOLS = ['ChatGPT', 'Claude', 'Cursor', 'v0'];

function generatePrompt(tool, finding) {
    const snippet = finding.snippet ? `\n\`\`\`\n${finding.snippet}\n\`\`\`` : '';
    const body = `**Finding**: ${finding.title}\n**What matched**: ${finding.message}\n**Why it matters**: ${finding.whyItMatters}\n**Safer approach**: ${finding.saferExample}\n**Limitations of this check**: ${finding.limitations}${snippet}`;
    switch (tool) {
        case 'Cursor':
            return `(In Cursor)\n\nReview and, if applicable, fix this finding.\n\n${body}`;
        case 'Claude':
            return `Act as a senior engineer reviewing a static-analysis finding. This is a pattern match, not a confirmed vulnerability — verify it applies before changing anything.\n\n${body}\n\nIf it applies, return only the fixed code.`;
        case 'v0':
            return `Review this finding and preserve layout/styling while addressing it if applicable:\n\n${body}`;
        case 'ChatGPT':
        default:
            return `Review this finding (pattern match, not a confirmed vulnerability):\n\n${body}`;
    }
}

export default function FindingDetailModal({ finding, onClose }) {
    const [selectedTool, setSelectedTool] = useState(null);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(generatePrompt(selectedTool, finding));
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 max-w-2xl w-full shadow-2xl relative max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${SEVERITY_COLOR[finding.severity].bg} ${SEVERITY_COLOR[finding.severity].text}`}>{finding.severity}</span>
                <h3 className="text-xl font-bold text-white mt-3 mb-4">{finding.title}</h3>

                <div className="space-y-4 text-sm">
                    <div>
                        <div className="text-xs uppercase text-gray-500 mb-1">What matched</div>
                        <p className="text-gray-300">{finding.message}</p>
                    </div>
                    <div>
                        <div className="text-xs uppercase text-gray-500 mb-1">Why it matters</div>
                        <p className="text-gray-300">{finding.whyItMatters}</p>
                    </div>
                    <div>
                        <div className="text-xs uppercase text-gray-500 mb-1">Safer example</div>
                        <p className="text-green-300 font-mono text-xs bg-black/40 p-3 rounded-lg">{finding.saferExample}</p>
                    </div>
                    <div>
                        <div className="text-xs uppercase text-gray-500 mb-1">Limitations of this check</div>
                        <p className="text-gray-500 text-xs italic">{finding.limitations}</p>
                    </div>
                    {finding.snippet && (
                        <div>
                            <div className="text-xs uppercase text-gray-500 mb-1">Excerpt</div>
                            <p className="text-gray-400 font-mono text-xs bg-black/40 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">{finding.snippet}</p>
                        </div>
                    )}
                </div>

                {!selectedTool ? (
                    <>
                        <div className="text-xs uppercase text-gray-500 mt-6 mb-2">Send to a coding assistant</div>
                        <div className="grid grid-cols-4 gap-2">
                            {TOOLS.map((tool) => (
                                <button key={tool} onClick={() => setSelectedTool(tool)} className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300">
                                    {tool}
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-2 mt-6 mb-2">
                            <button onClick={() => setSelectedTool(null)} className="text-gray-400 hover:text-white text-xs">&larr; back</button>
                            <span className="text-xs uppercase text-gray-500">Prompt for {selectedTool}</span>
                        </div>
                        <div className="rounded-xl p-4 border font-mono text-xs text-gray-300 mb-3 overflow-x-auto whitespace-pre-wrap max-h-[180px] bg-black/40 border-white/5">
                            {generatePrompt(selectedTool, finding)}
                        </div>
                        <button onClick={handleCopy} className="px-5 py-2 bg-brand-blue text-white text-sm font-bold rounded-lg">
                            {copied ? 'Copied ✓' : 'Copy Prompt'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
