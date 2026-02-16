
import React, { useState, useEffect, useRef } from 'react';

const accordionItems = [
    {
        id: 'security',
        title: 'Security Analysis',
        subtitle: 'Vulnerability detection & secret scanning.',
        icon: (
            <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
        ),
        bgIcon: 'bg-red-100',
        content: (
            <div className="grid lg:grid-cols-2 gap-12 pt-4">
                <div className="space-y-6">
                    <p className="text-lg text-gray-700 leading-relaxed font-bold">
                        Detects common AI-generated security mistakes like hardcoded secrets, unsafe HTML injection, eval usage, and suspicious external scripts
                    </p>
                </div>
                <div className="bg-gray-50 rounded-2xl border-2 border-black p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="px-2 py-1 text-[10px] font-bold uppercase rounded bg-red-500 text-white">Critical Risk</div>
                        <span className="text-xs font-mono text-gray-500">SearchComponent.tsx:24</span>
                    </div>
                    <div className="grid grid-cols-2 gap-[2px] bg-black border-2 border-black rounded-xl overflow-hidden shadow-lg">
                        <div className="bg-[#1a1a1a] p-6 font-mono text-[10px] sm:text-xs text-[#d1d1d1]">
                            <div className="mb-2 bg-red-900/30 text-[#FF3B30] border border-[#FF3B30] px-1 inline-block text-[10px]">Before</div>
                            <pre className="whitespace-pre-wrap">
                                {`<div dangerouslySetInnerHTML={{ 
  __html: query 
}} />`}
                            </pre>
                        </div>
                        <div className="bg-[#1a1a1a] p-6 font-mono text-[10px] sm:text-xs text-[#d1d1d1]">
                            <div className="mb-2 bg-green-900/30 text-[#22c55e] border border-[#22c55e] px-1 inline-block text-[10px]">XAUDIT Fix</div>
                            <pre className="whitespace-pre-wrap text-green-400">
                                {`<div>
  {sanitize(query)}
</div>`}
                            </pre>
                        </div>
                    </div>
                    <p className="mt-4 text-xs font-medium text-gray-500 italic">Prompt Generated: "Refactor SearchComponent to use DOMPurify for user-provided HTML strings."</p>
                </div>
            </div>
        )
    },
    {
        id: 'performance',
        title: 'Performance Optimization',
        subtitle: 'Runtime efficiency & asset management.',
        icon: (
            <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        ),
        bgIcon: 'bg-blue-100',
        content: (
            <div className="grid lg:grid-cols-2 gap-12 pt-4">
                <div className="space-y-6">
                    <p className="text-lg text-gray-700 leading-relaxed font-bold">
                        Flags common AI performance smells like deep nesting, duplicate blocks, and render-heavy patterns.
                    </p>
                </div>
                <div className="relative bg-black rounded-2xl p-6 overflow-hidden h-64 flex flex-col justify-end">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                    <div className="flex items-end gap-1 h-32 mb-4">
                        <div className="w-full bg-blue-500/20 rounded-t h-[80%] animate-pulse" />
                        <div className="w-full bg-blue-500/40 rounded-t h-[60%]" />
                        <div className="w-full bg-blue-500/60 rounded-t h-[90%] animate-pulse" />
                        <div className="w-full bg-blue-500 rounded-t h-[30%]" />
                        <div className="w-full bg-blue-400 rounded-t h-[45%] animate-pulse" />
                    </div>
                    <div className="flex justify-between items-center text-white relative z-10 transition-all">
                        <div>
                            <div className="text-xs font-mono uppercase opacity-50">Memory Leak Detected</div>
                            <div className="text-lg font-bold">useEffect Missing Cleanup</div>
                        </div>
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center relative">
                            <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-25" />
                            <div className="w-3 h-3 bg-white rounded-full relative z-10" />
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'accessibility',
        title: 'Accessibility & SEO',
        subtitle: 'WCAG compliance & semantic structure.',
        icon: (
            <svg className="w-10 h-10 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
        ),
        bgIcon: 'bg-purple-100',
        content: (
            <div className="grid lg:grid-cols-2 gap-12 pt-4">
                <div className="space-y-6">
                    <p className="text-lg text-gray-700 leading-relaxed font-bold">
                        Checks semantic structure and basic WCAG red flags (alt tags, landmarks, heading order).
                    </p>
                </div>
                <div className="bg-purple-50 rounded-2xl border-2 border-black p-8 relative overflow-hidden">
                    <div className="space-y-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 border-2 border-black rounded flex items-center justify-center bg-white">
                                <div className="w-3 h-3 bg-purple-600 rounded-sm" />
                            </div>
                            <span className="font-bold">Auto-fix missing `alt` tags</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 border-2 border-black rounded flex items-center justify-center bg-white">
                                <div className="w-3 h-3 bg-purple-600 rounded-sm" />
                            </div>
                            <span className="font-bold">Verify keyboard focus traps</span>
                        </div>
                        <div className="flex items-center gap-3 opacity-40">
                            <div className="w-6 h-6 border-2 border-black rounded flex items-center justify-center bg-white" />
                            <span className="font-bold">Color contrast ratios</span>
                        </div>
                    </div>
                    <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-purple-200 rounded-full blur-3xl opacity-50" />
                </div>
            </div>
        )
    }
];

export default function AuditCapabilities() {
    const [activeIndex, setActiveIndex] = useState(-1);

    return (
        <section className="py-32 bg-white z-20" id="capabilities">
            <div className="max-w-[1400px] mx-auto px-6 w-full">
                <header className="mb-16 text-center">
                    <div className="inline-block px-3 py-1 rounded-full border-2 border-black font-bold text-[10px] uppercase mb-4 tracking-wider">Deep Dive</div>
                    <h2 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.85] uppercase">
                        AUDIT <span className="text-blue-600">CAPABILITIES</span>
                    </h2>
                </header>

                <div className="space-y-6">
                    {accordionItems.map((item, index) => (
                        <div
                            key={item.id}
                            className={`border-[3px] border-black rounded-[2rem] overflow-hidden bg-white transition-all duration-500 ease-in-out ${activeIndex === index
                                ? 'shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] translate-y-[-4px]'
                                : 'hover:border-blue-600 cursor-pointer translate-y-0 opacity-70 grayscale hover:opacity-100 hover:grayscale-0'
                                }`}
                            onClick={() => setActiveIndex(activeIndex === index ? -1 : index)}
                        >
                            <div className="w-full p-6 md:p-8 text-left flex justify-between items-center outline-none">
                                <div className="flex items-center gap-6">
                                    <div className={`w-14 h-14 ${item.bgIcon} rounded-[1.2rem] flex items-center justify-center border-2 border-black transition-transform duration-500 ${activeIndex === index ? 'scale-110' : ''}`}>
                                        <div className="scale-90">
                                            {item.icon}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl md:text-3xl font-black tracking-tight">{item.title}</h3>
                                        <p className="text-gray-500 font-medium text-sm">{item.subtitle}</p>
                                    </div>
                                </div>
                                <div className={`transition-transform duration-500 ${activeIndex === index ? 'rotate-180' : ''}`}>
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                            <div
                                className={`transition-all duration-500 ease-in-out px-8 md:px-12 overflow-hidden ${activeIndex === index ? 'max-h-[1000px] opacity-100 pb-12' : 'max-h-0 opacity-0'}`}
                            >
                                <div className="border-t-2 border-gray-100 pt-8 mt-2">
                                    <div className="origin-top-left">
                                        {item.content}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
