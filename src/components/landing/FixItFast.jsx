import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function FixItFast() {
    const [text, setText] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [activeAI, setActiveAI] = useState('V0');
    const [activeRect, setActiveRect] = useState({ left: 0, width: 0 });
    const [hoverData, setHoverData] = useState({ left: 0, width: 0, opacity: 0 });
    const tabsRef = useRef(null);

    const aiTools = ['CHATGPT', 'CLAUDE', 'V0', 'CURSOR', 'BOLT'];

    // Update active highlight position
    useEffect(() => {
        if (!tabsRef.current) return;
        const parentRect = tabsRef.current.getBoundingClientRect();
        const activeElement = tabsRef.current.querySelector(`[data-tool="${activeAI}"]`);

        if (activeElement) {
            const rect = activeElement.getBoundingClientRect();
            setActiveRect({
                left: rect.left - parentRect.left,
                width: rect.width
            });
        }

        const handleResize = () => {
            if (!tabsRef.current) return;
            const pRect = tabsRef.current.getBoundingClientRect();
            const aElem = tabsRef.current.querySelector(`[data-tool="${activeAI}"]`);
            if (aElem) {
                const r = aElem.getBoundingClientRect();
                setActiveRect({ left: r.left - pRect.left, width: r.width });
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [activeAI]);

    const handleMouseEnter = (e) => {
        if (!tabsRef.current) return;
        const parentRect = tabsRef.current.getBoundingClientRect();
        const elementRect = e.currentTarget.getBoundingClientRect();
        setHoverData({
            left: elementRect.left - parentRect.left,
            width: elementRect.width,
            opacity: 1
        });
    };

    const handleMouseLeave = () => {
        setHoverData(prev => ({ ...prev, opacity: 0 }));
    };

    const codeText = `Review the following code snippet for security vulnerabilities.\nFocus on: XSS, SQL Injection, and unsafe API exposure.\n\nCode context:\nReact Component handling user inputs for search.\n\nProvide corrected code block with comments explaining fixes.`;

    useEffect(() => {
        let i = 0;
        const timer = setInterval(() => {
            setText(codeText.slice(0, i));
            i++;
            if (i > codeText.length) clearInterval(timer);
        }, 30);
        return () => clearInterval(timer);
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(codeText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <section className="pt-32 pb-16 bg-[#FFB7B2] border-t-2 border-black overflow-hidden">
            <div className="max-w-[1330px] mx-auto px-6">
                <div className="text-center mb-16 fade-up">
                    <h2 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter uppercase">FIX IT FAST</h2>
                    <p className="text-xl md:text-2xl font-medium max-w-2xl mx-auto">We generate the exact prompts you need to paste into your AI tools to repair the code instantly.</p>
                </div>

                <div className="flex flex-col gap-12 items-center">
                    {/* Horizontal AI Selector Bar */}
                    <div className="w-full max-w-2xl px-4">
                        <div
                            className="bg-gray-100 rounded-full border-2 border-black p-1 shadow-neo-sm relative flex items-center"
                            onMouseLeave={handleMouseLeave}
                            ref={tabsRef}
                        >
                            {/* Sliding Highlights - The "Living Pill" */}
                            <div
                                className="absolute bg-white rounded-full transition-all duration-300 ease-out z-0 pointer-events-none shadow-sm"
                                style={{
                                    left: hoverData.opacity ? hoverData.left : activeRect.left,
                                    width: hoverData.opacity ? hoverData.width : activeRect.width,
                                    opacity: 1, // Always visible
                                    height: 'calc(100% - 8px)',
                                    top: '4px'
                                }}
                            />

                            {aiTools.map((tool) => (
                                <button
                                    key={tool}
                                    data-tool={tool}
                                    onMouseEnter={handleMouseEnter}
                                    onClick={() => setActiveAI(tool)}
                                    className={`flex-1 px-4 py-3 rounded-full text-xs font-black tracking-widest transition-all relative z-10 ${activeAI === tool ? 'text-black' : 'text-gray-500 hover:text-black'}`}
                                >
                                    {tool}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="w-full grid grid-cols-1 md:grid-cols-1 gap-12">

                        <div className="bg-[#1e1e1e] rounded-[2rem] border-[3px] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden h-full min-h-[400px] flex flex-col">
                            <div className="bg-[#2d2d2d] px-4 py-3 border-b border-[#000] flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                            </div>
                            <div className="p-6 font-mono text-sm text-green-400 flex-1 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                                <span className="text-gray-400 font-mono italic opacity-60">{"//"} XAUDIT Generated Fix Prompt</span>
                                <br /><br />
                                {text}
                                <span className="cursor-blink inline-block w-2 h-4 bg-green-400 align-middle ml-1" />
                            </div>
                            <div className="p-4 border-t border-gray-700 bg-[#252525] flex justify-between items-center">
                                <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">{isCopied ? 'Copied!' : 'Ready to copy'}</span>
                                <button
                                    onClick={handleCopy}
                                    className="bg-white text-black px-4 py-2 rounded font-bold text-xs uppercase hover:bg-gray-200 transition-colors"
                                >
                                    {isCopied ? 'Copied' : 'Copy Prompt'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-16 text-center">
                        <Link to="/audit" className="bg-black text-white text-xl px-12 py-5 rounded-full font-semibold btn-pill shadow-xl inline-flex items-center gap-3 hover:scale-105 active:scale-95 transition-all">
                            Get Your Fix Prompts
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
