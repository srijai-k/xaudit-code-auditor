
import React from 'react';
import { motion } from 'framer-motion';

export default function HowItWorksSection() {
    return (
        <section className="py-24 bg-black border-t border-white/10 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <div className="reveal mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">HOW XAUDIT WORKS</h2>
                    <p className="text-xl text-gray-400 max-w-2xl">
                        Seamless integration into your existing workflow. No dashboard hopping required.
                    </p>
                </div>

                <div className="relative">
                    {/* Connecting Line (Desktop) */}
                    {/* Global CodeSnake passes through here */}

                    <div className="grid md:grid-cols-3 gap-12">
                        {/* Step 1 */}
                        <div className="reveal relative bg-neutral-900 border border-white/10 p-8 clip-angle-card">
                            <div className="absolute -top-6 left-8 bg-black border border-white/20 px-4 py-1 text-sm font-mono font-bold text-white z-10">
                                STEP 01
                            </div>
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                whileInView={{ scale: 1, opacity: 1 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
                                className="h-40 flex items-center justify-center mb-6 bg-white/5 rounded border border-white/5"
                            >
                                <code className="text-green-400 font-mono text-sm">
                                    engine_init.js loaded...
                                </code>
                            </motion.div>
                            <h3 className="text-2xl font-bold mb-4">Launch in Browser</h3>
                            <p className="text-gray-400 leading-relaxed">
                                No npm install. No config files. Just open XAUDIT in Chrome or Edge. Our analysis engine loads instantly.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="reveal relative bg-neutral-900 border border-white/10 p-8 clip-angle-card" style={{ transitionDelay: '100ms' }}>
                            <div className="absolute -top-6 left-8 bg-black border border-white/20 px-4 py-1 text-sm font-mono font-bold text-white z-10">
                                STEP 02
                            </div>
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                whileInView={{ scale: 1, opacity: 1 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.5, delay: 0.1, type: "spring", bounce: 0.4 }}
                                className="h-40 flex items-center justify-center mb-6 bg-white/5 rounded border border-white/5 relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-green-500/10 animate-pulse"></div>
                                <div className="z-10 text-center">
                                    <div className="text-xs text-gray-400 mb-2">SCANNING CODEBASE...</div>
                                    <div className="w-32 h-1 bg-gray-700 rounded-full overflow-hidden">
                                        <div className="w-2/3 h-full bg-green-500"></div>
                                    </div>
                                </div>
                            </motion.div>
                            <h3 className="text-2xl font-bold mb-4">Heuristic Analysis</h3>
                            <p className="text-gray-400 leading-relaxed">
                                XAUDIT analyzes your code structure using static heuristics to detect patterns, smells, and security risks in real-time.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="reveal relative bg-neutral-900 border border-white/10 p-8 clip-angle-card" style={{ transitionDelay: '200ms' }}>
                            <div className="absolute -top-6 left-8 bg-black border border-white/20 px-4 py-1 text-sm font-mono font-bold text-white z-10">
                                STEP 03
                            </div>
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                whileInView={{ scale: 1, opacity: 1 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.5, delay: 0.2, type: "spring", bounce: 0.4 }}
                                className="h-40 flex items-center justify-center mb-6 bg-white/5 rounded border border-white/5"
                            >
                                <div className="text-center">
                                    <div className="inline-block px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded mb-2">2 CRITICAL FOUND</div>
                                    <div className="inline-block px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded">VIEW REPORT</div>
                                </div>
                            </motion.div>
                            <h3 className="text-2xl font-bold mb-4">Instant Report</h3>
                            <p className="text-gray-400 leading-relaxed">
                                View a comprehensive interactive report immediately. Export to PDF or JSON without ever leaving your tab.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
