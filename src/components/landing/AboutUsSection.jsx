
import React from 'react';

export default function AboutUsSection() {
    return (
        <section id="about" className="py-24 bg-neutral-900 border-t border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
                <div className="reveal">
                    <div className="inline-block px-3 py-1 bg-white/10 text-white text-xs font-bold rounded mb-6 border border-white/10 uppercase tracking-widest">
                        Our Mission
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
                        A SMALLER, HONEST <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">CODE CHECKER</span>
                    </h2>
                    <div className="space-y-6 text-gray-400 text-lg leading-relaxed">
                        <p>
                            XAUDIT started as a much bigger set of claims than the code behind it could back up. This rebuild narrowed the scope on purpose: a defined set of pattern-based checks for JavaScript, TypeScript, React/JSX, and HTML, built on a real AST parser instead of regex guesswork, with a test suite that has to pass before anything ships.
                        </p>
                        <p>
                            <span className="text-white font-bold">It is not AI-powered, and it does not certify code as secure.</span> It runs entirely in your browser, flags patterns that need a human look, and tells you plainly what it doesn't check — see "Current supported checks" and "Known limitations" below.
                        </p>
                        <p>
                            The goal is narrow and correct rather than broad and misleading: a tool worth trusting for what it actually does, not for what a landing page used to say it did.
                        </p>
                    </div>

                    <div className="mt-10 flex gap-8">
                        <div>
                            <div className="text-3xl font-bold text-white mb-1">2025</div>
                            <div className="text-xs text-gray-500 uppercase tracking-widest">Founded</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-white mb-1">Open</div>
                            <div className="text-xs text-gray-500 uppercase tracking-widest">Source Core</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-white mb-1">Global</div>
                            <div className="text-xs text-gray-500 uppercase tracking-widest">Community</div>
                        </div>
                    </div>
                </div>

                <div className="reveal relative" style={{ transitionDelay: '200ms' }}>
                    <div className="aspect-square bg-gradient-to-tr from-neutral-800 to-black border border-white/10 rounded-2xl p-8 relative overflow-hidden group">
                        {/* Abstract grid decoration */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)]"></div>

                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div className="text-right">
                                <div className="text-6xl font-bold text-white/10">AST</div>
                            </div>

                            <div>
                                <div className="text-xl font-bold text-white mb-2">Babel-based parser</div>
                                <div className="text-gray-400">5 rule groups, unit-tested</div>
                                <div className="text-gray-500 text-sm mt-1">See docs/benchmark-report.md for real numbers</div>
                            </div>
                        </div>

                        {/* Node Effects */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-white rounded-full animate-ping"></div>
                        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-white rounded-full animate-ping delay-500"></div>
                    </div>
                </div>
            </div>
        </section>
    );
}
