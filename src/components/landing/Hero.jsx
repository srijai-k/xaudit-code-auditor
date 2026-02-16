
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Hero({ onStartScan }) {
    // navigate passed via onStartScan

    return (
        <section className="relative min-h-screen pt-32 pb-20 flex items-center overflow-hidden">


            <div className="absolute top-20 right-0 w-[800px] h-[800px] bg-white/[0.02] rounded-full blur-3xl -z-10"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-white/[0.01] rounded-full blur-3xl -z-10"></div>

            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
                <div className="reveal">
                    <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/20 bg-white/5 mb-8 text-xs font-mono tracking-wide uppercase">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        System Online v2.4.0
                    </div>
                    <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9] mb-8">
                        AUDIT<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">INTELLIGENCE</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-lg mb-10 leading-relaxed">
                        Deploy with confidence. XAUDIT scans your React & JS codebase for security risks, performance bottlenecks, and code quality issues.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={onStartScan}
                            className="clip-angle-button bg-white text-black px-8 py-4 font-bold text-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <span>INITIATE SCAN</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"></path>
                            </svg>
                        </button>
                        <button
                            onClick={onStartScan}
                            className="group clip-angle-button border border-white/20 bg-black text-white px-8 py-4 font-bold text-lg hover:border-white transition-colors flex items-center justify-center gap-2 relative z-30 cursor-pointer">
                            <span>LAUNCH WEB AUDIT</span>
                        </button>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-6 text-sm text-gray-400 font-mono">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            <span>NO SIGN UP REQUIRED</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            <span>FREE FOREVER</span>
                        </div>
                    </div>
                </div>

                {/* Terminal Window Animation */}
                <div className="reveal relative">
                    {/* Glow effect behind */}
                    <div className="absolute -top-10 -right-10 w-full h-full border border-white/10 bg-white/5 clip-hero-image"></div>

                    {/* Main Terminal */}
                    <div className="relative bg-black border border-white/20 p-6 clip-hero-image shadow-2xl shadow-white/5">
                        <div className="scanline"></div>
                        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 bg-red-500/50"></div>
                                <div className="w-3 h-3 bg-yellow-500/50"></div>
                                <div className="w-3 h-3 bg-green-500/50"></div>
                            </div>
                            <div className="font-mono text-xs text-gray-500">auditor_core.exe</div>
                        </div>

                        <div className="font-mono text-sm space-y-2 h-[400px] overflow-hidden relative">
                            <div className="text-gray-400">$ xaudit start --target=/src/production</div>
                            <div className="text-blue-400">→ Initializing XA Neural Engine...</div>
                            <div className="text-green-400">✓ Engine Loaded (12ms)</div>
                            <div className="text-gray-400">Scanning filesystem...</div>

                            <div className="pl-4 border-l border-gray-800 my-4 space-y-1 text-xs text-gray-500">
                                <div>Analyzing ./auth/jwt_handler.ts...</div>
                                <div>Analyzing ./database/schema.prisma...</div>
                                <div>Analyzing ./api/payments/stripe.ts...</div>
                            </div>

                            <div className="bg-red-500/10 border-l-2 border-red-500 p-2 my-2">
                                <div className="text-red-400 font-bold flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                    CRITICAL VULNERABILITY FOUND
                                </div>
                                <div className="text-gray-300 mt-1">Potential SQL Injection vector in search query builder.</div>
                                <div className="text-gray-500 mt-1">Line 42: const query = "SELECT * FROM users WHERE name = " + input;</div>
                            </div>

                            <div className="text-white mt-4">
                                <span className="text-green-400">Suggested Fix:</span> Use parameterized queries.
                            </div>
                            <div className="mt-2 text-gray-400 flex gap-2">
                                <span>$</span>
                                <span className="cursor-blink bg-white w-2 h-5 block"></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
