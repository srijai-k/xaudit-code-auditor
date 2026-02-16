import React, { useState } from 'react';
import { generateFixPrompt } from '../../lib/prompt-generator';

export default function FixPromptExport({ report, rawCode }) {
    const [platform, setPlatform] = useState('Claude');
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        const prompt = generateFixPrompt(report, rawCode, platform);
        navigator.clipboard.writeText(prompt);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const platforms = ['ChatGPT', 'Claude', 'v0', 'Cursor', 'Bolt'];

    return (
        <div className="mt-20 anim-slide-up" style={{ animationDelay: '0.6s' }}>
            <div className="bg-white border-thick rounded-[2.5rem] p-10 flex flex-col md:flex-row justify-between items-center shadow-hard gap-8">
                <div className="text-left w-full md:w-auto">
                    <h3
                        className="text-[11px] font-black uppercase tracking-widest mb-3"
                        style={{ color: 'rgba(0, 0, 0, 0.4)' }}
                    >
                        Generate Fix Prompt
                    </h3>
                    <p className="text-xl font-black text-black leading-tight tracking-tight">
                        Copy to your AI tool <span className="text-auditx-blue">& fix everything.</span>
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-8 w-full md:w-auto">
                    <div className="flex bg-[#F1F5F9] p-2 rounded-[1.25rem] border-thick-sm w-full md:w-auto overflow-hidden">
                        {platforms.map(p => (
                            <button
                                key={p}
                                className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-tight cursor-pointer transition-all ${platform === p
                                    ? 'bg-white text-black shadow-sm'
                                    : 'text-[#64748B] hover:text-black'
                                    }`}
                                onClick={() => setPlatform(p)}
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    <button
                        className={`w-full md:w-auto px-10 py-5 rounded-full font-black text-sm uppercase tracking-wider transition-all hover-shadow active-bounce flex items-center justify-center gap-3 ${isCopied
                            ? 'bg-[#22C55E] text-white border-thick-sm'
                            : 'bg-black text-white shadow-lg'
                            }`}
                        onClick={handleCopy}
                    >
                        {isCopied ? 'Copied!' : 'Copy Fix Prompt'}
                        {!isCopied && <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>}
                    </button>
                </div>
            </div>
            <div className="mt-8 text-[11px] font-black text-[#64748B] text-center uppercase tracking-widest opacity-30">
                Tip: Paste this into your vibe-coding tool and watch the magic happen.
            </div>
        </div>
    );
}
