import React, { useEffect, useRef } from 'react';

const MetricItem = ({ title, target, color, desc, icon }) => {
    const counterRef = useRef(null);
    const progressRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                // Animate value
                let start = 0;
                const duration = 1500;
                const startTime = performance.now();

                const step = (now) => {
                    const progress = Math.min((now - startTime) / duration, 1);
                    if (counterRef.current) {
                        counterRef.current.textContent = Math.floor(progress * target);
                    }
                    if (progress < 1) requestAnimationFrame(step);
                };
                requestAnimationFrame(step);

                // Animate progress bar
                if (progressRef.current) {
                    progressRef.current.style.width = `${target}%`;
                }
            }
        }, { threshold: 0.1 });

        if (counterRef.current) observer.observe(counterRef.current);
        return () => observer.disconnect();
    }, [target]);

    return (
        <div className="group reveal-trigger active">
            <div className="flex justify-between items-end mb-4">
                <h3 className="text-3xl font-bold flex items-center gap-3">
                    <span className={`p-2 rounded-lg border-2 border-black text-black ${color.replace('bg-', 'bg-opacity-20 bg-')}`}>
                        {icon}
                    </span>
                    {title}
                </h3>
                <span ref={counterRef} className="text-2xl font-mono font-bold">0</span>
            </div>
            <div className="h-6 w-full bg-gray-100 rounded-full border-2 border-black overflow-hidden p-1">
                <div
                    ref={progressRef}
                    className={`h-full ${color} rounded-full w-0 transition-all duration-1000 ease-out`}
                />
            </div>
            <p className="mt-2 text-gray-500 font-medium">{desc}</p>
        </div>
    );
};

export default function FeatureReport() {
    return (
        <section className="py-32 bg-white relative overflow-hidden" id="features">
            <div className="max-w-[1160px] mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

                    {/* Sticky Side Card */}
                    <div className="lg:col-span-5 relative">
                        <div className="lg:sticky lg:top-32">
                            <h2 className="text-5xl font-bold mb-8 tracking-tight uppercase leading-none">THE REPORT<br />CARD</h2>
                            <div className="aspect-square bg-gray-50 rounded-[3rem] border-[3px] border-black flex items-center justify-center relative overflow-hidden group shadow-sm transition-all duration-700">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[length:24px_24px]" />

                                <div className="relative z-10 flex flex-col items-center">
                                    <span className="text-[12rem] leading-none font-black text-transparent bg-clip-text bg-gradient-to-br from-black to-gray-600 scale-in active transition-all duration-1000">A</span>
                                    <div className="bg-green-500 text-white px-4 py-1 rounded-full font-bold text-lg uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -mt-4 transform rotate-[-5deg] group-hover:rotate-0 transition-transform">
                                        Ready to Ship
                                    </div>
                                </div>

                                <div className="absolute top-8 right-8 w-4 h-4 bg-[#FFB7B2] rounded-full border-2 border-black" />
                                <div className="absolute bottom-8 left-8 w-4 h-4 bg-[#6CE5E8] rounded-full border-2 border-black" />
                            </div>
                        </div>
                    </div>

                    {/* Features List */}
                    <div className="lg:col-span-7 space-y-12">
                        <MetricItem
                            title="Security"
                            target={92}
                            color="bg-[#FF3B30]"
                            desc="Checks for XSS, injection vulnerabilities, and API key leaks."
                            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                        />
                        <MetricItem
                            title="Performance"
                            target={78}
                            color="bg-[#2B59FF]"
                            desc="Analyzes re-renders, bundle size, and efficient DOM manipulation."
                            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                        />
                        <MetricItem
                            title="Accessibility"
                            target={100}
                            color="bg-[#8C52FF]"
                            desc="WCAG compliance check for screen readers and keyboard navigation."
                            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
