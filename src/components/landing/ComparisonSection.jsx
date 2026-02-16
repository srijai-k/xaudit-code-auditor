
import React from 'react';

export default function ComparisonSection() {
    return (
        <section className="py-24 bg-neutral-900 text-white relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid md:grid-cols-2 gap-0 border border-white/10">

                    {/* Left: Traditional */}
                    <div className="p-12 border-b md:border-b-0 md:border-r border-white/10 bg-black/40 reveal-left">
                        <h3 className="text-2xl font-bold mb-8 text-gray-500 flex items-center gap-3">
                            <span className="line-through">MANUAL AUDIT</span>
                        </h3>
                        <ul className="space-y-6">
                            <li className="flex gap-4 opacity-50">
                                <span className="text-red-500 font-mono">[-]</span>
                                <div>
                                    <div className="font-bold">Slow Turnaround</div>
                                    <div className="text-sm text-gray-500">Days or weeks to get a report</div>
                                </div>
                            </li>
                            <li className="flex gap-4 opacity-50">
                                <span className="text-red-500 font-mono">[-]</span>
                                <div>
                                    <div className="font-bold">Static Analysis Only</div>
                                    <div className="text-sm text-gray-500">Misses runtime logic errors</div>
                                </div>
                            </li>
                            <li className="flex gap-4 opacity-50">
                                <span className="text-red-500 font-mono">[-]</span>
                                <div>
                                    <div className="font-bold">Expensive</div>
                                    <div className="text-sm text-gray-500">$5,000+ per repository scan</div>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Right: XAUDIT */}
                    <div className="p-12 bg-white/5 relative overflow-hidden reveal">
                        {/* Shine effect */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -z-10"></div>

                        <h3 className="text-2xl font-bold mb-8 text-white flex items-center gap-3">
                            <span className="text-green-400">●</span> XAUDIT AI
                        </h3>
                        <ul className="space-y-6">
                            <li className="flex gap-4">
                                <span className="text-green-500 font-mono">[+]</span>
                                <div>
                                    <div className="font-bold">Instant Results</div>
                                    <div className="text-sm text-gray-400">Real-time feedback as you type</div>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="text-green-500 font-mono">[+]</span>
                                <div>
                                    <div className="font-bold">Deep Logic Analysis</div>
                                    <div className="text-sm text-gray-400">Understands intent, not just syntax</div>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="text-green-500 font-mono">[+]</span>
                                <div>
                                    <div className="font-bold">Cost Effective</div>
                                    <div className="text-sm text-gray-400">Forever free for individuals & teams</div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}
