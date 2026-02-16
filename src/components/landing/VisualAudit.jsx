import React, { useState, useRef, useEffect } from 'react';

export default function VisualAudit() {
    const [sliderPos, setSliderPos] = useState(100);
    const [isDragging, setIsDragging] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);
    const containerRef = useRef(null);
    const animateRef = useRef(null);
    const stageRef = useRef(0); // 0: Right->Left, 1: Left->Middle, 2: Done

    const handleMove = (e) => {
        if (!isDragging || !containerRef.current) return;
        setHasInteracted(true);
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const x = clientX - rect.left;
        const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setSliderPos(pos);
    };

    useEffect(() => {
        const handleGlobalUp = () => setIsDragging(false);
        if (isDragging) {
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('touchmove', handleMove);
            window.addEventListener('mouseup', handleGlobalUp);
            window.addEventListener('touchend', handleGlobalUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('mouseup', handleGlobalUp);
            window.removeEventListener('touchend', handleGlobalUp);
        };
    }, [isDragging]);

    const [isInView, setIsInView] = useState(false);
    const sectionRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.2 }
        );

        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (isInView && !isDragging && !isHovered && !hasInteracted && stageRef.current < 2) {
            const animateEntrance = () => {
                setSliderPos((prev) => {
                    const target = stageRef.current === 0 ? 0 : 50;
                    const diff = target - prev;

                    // Smooth lerp for easing
                    const step = diff * 0.08;

                    if (Math.abs(diff) < 0.1) {
                        if (stageRef.current === 0) {
                            stageRef.current = 1;
                            return 0;
                        } else {
                            stageRef.current = 2;
                            return 50;
                        }
                    }

                    return prev + step;
                });
                animateRef.current = requestAnimationFrame(animateEntrance);
            };
            // Add a small delay before starting the first sweep
            const timeout = setTimeout(() => {
                animateRef.current = requestAnimationFrame(animateEntrance);
            }, 400);
            return () => {
                clearTimeout(timeout);
                cancelAnimationFrame(animateRef.current);
            };
        } else {
            cancelAnimationFrame(animateRef.current);
        }
    }, [isInView, isDragging, isHovered, hasInteracted]);
    const handleInteractionStart = () => {
        setIsDragging(true);
        setHasInteracted(true);
    };

    return (
        <section ref={sectionRef} className="py-32 bg-white overflow-hidden">
            <div className="max-w-[1400px] mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="fade-up">
                        <div className="inline-block px-4 py-1 bg-[#6CE5E8] border-2 border-black font-black text-sm uppercase mb-6 shadow-[4px_4px_0_0_#000]">
                            Visual Audit
                        </div>
                        <h2 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[0.9]">
                            SPOT THE<br />INVISIBLE BUGS.
                        </h2>
                        <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-xl font-medium">
                            AI-generated code often looks correct but hides performance and accessibility debt. XAUDIT flags the exact lines that will hurt you in production.
                        </p>

                        <ul className="space-y-6">
                            <li className="flex items-start gap-4">
                                <div className="mb-2 bg-green-900/30 text-[#22c55e] border border-[#22c55e] px-1 inline-block text-[10px]">XAUDIT Fix</div>
                                <div>
                                    <span className="font-black text-lg block">React Smell Detection</span>
                                    <p className="text-gray-500 font-medium">Detects unstable dependencies, repeated renders, and component bloat.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-4">
                                <div className="mt-1 w-6 h-6 bg-[#FF3B30] border-[3px] border-black flex-shrink-0" />
                                <div>
                                    <span className="font-black text-lg block">Accessibility Auditing</span>
                                    <p className="text-gray-500 font-medium">Flags missing ARIA labels, landmarks, and keyboard navigation gaps.</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div
                        ref={containerRef}
                        className="relative h-[550px] w-full border-[4px] border-black rounded-[2.5rem] overflow-hidden shadow-[24px_24px_0px_0px_rgba(0,0,0,1)] cursor-ew-resize select-none"
                        onMouseDown={handleInteractionStart}
                        onTouchStart={handleInteractionStart}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        {/* Before Side (Raw AI) - BOTTOM LAYER */}
                        <div className="absolute inset-0 bg-[#f8f9fa] p-8 md:p-12">
                            <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-4">
                                <span className="font-mono text-sm font-bold text-gray-400">raw_ai_output.jsx</span>
                                <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-black border-2 border-red-500/20 rounded-full">FAIL: SECURITY RISK</span>
                            </div>
                            <pre className="font-mono text-sm md:text-base leading-relaxed text-gray-800">
                                <code className="block">
                                    <span className="text-blue-600">const</span> Search = ({' '}<span className="text-orange-600">query</span> {'}'}) =&gt; {'{'}<br />
                                    {'  '}<span className="text-blue-600">return</span> (<br />
                                    {'    '}&lt;<span className="text-red-500">div</span> dangerouslySetInnerHTML={'{'}{'{'} <br />
                                    {'      '}__html: query <br />
                                    {'    '}{'}'}{'}'} /&gt;<br />
                                    {'  '})<br />
                                    {'}'}<br /><br />
                                    <span className="text-gray-400 italic opacity-60">{"//"} Critical XSS risk here.</span><br />
                                    <span className="text-gray-400 italic opacity-60">{"//"} AI missed sanitization.</span>
                                </code>
                            </pre>
                        </div>

                        {/* After Side (XAUDIT) - TOP LAYER CLIPPED */}
                        <div
                            className="absolute inset-0 bg-[#0f0f0f] p-8 md:p-12 z-10"
                            style={{
                                clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
                                borderRight: sliderPos < 100 ? '4px solid white' : 'none'
                            }}
                        >
                            <div className="flex items-center justify-between mb-8 border-b border-gray-800 pb-4">
                                <span className="font-mono text-sm font-bold text-gray-500">xaudit_report.jsx</span>
                                <span className="px-3 py-1 bg-[#22c55e] text-black text-xs font-black rounded-full">PASS: SECURE</span>
                            </div>
                            <pre className="font-mono text-sm md:text-base leading-relaxed text-gray-300">
                                <code className="block">
                                    <span className="text-blue-400">import</span> DOMPurify <span className="text-blue-400">from</span> 'dompurify';<br /><br />
                                    <span className="text-blue-400">const</span> Search = ({' '}<span className="text-orange-400">query</span> {'}'}) =&gt; {'{'}<br />
                                    {'  '}<span className="text-blue-400">const</span> safeHTML = DOMPurify.sanitize(query);<br />
                                    {'  '}<span className="text-blue-400">return</span> (<br />
                                    {'    '}&lt;<span className="text-red-400">div</span> dangerouslySetInnerHTML={'{'}{'{'} <br />
                                    {'      '}__html: safeHTML <br />
                                    {'    '}{'}'}{'}'} /&gt;<br />
                                    {'  '})<br />
                                    {'}'}
                                </code>
                            </pre>
                        </div>

                        {/* Slider Handle */}
                        <div
                            className="absolute top-0 bottom-0 z-20 w-1 bg-black"
                            style={{ left: `${sliderPos}%` }}
                        >
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-black border-[3px] border-white rounded-full flex items-center justify-center text-white font-black shadow-xl">
                                ↔
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
