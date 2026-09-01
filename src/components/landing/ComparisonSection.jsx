
import React from 'react';

export default function ComparisonSection() {
    return (
        <section className="py-24 bg-neutral-900 text-white relative">
            <div className="max-w-7xl mx-auto px-6">
                <p className="text-center text-gray-500 text-sm max-w-2xl mx-auto mb-10">
                    XAUDIT is a quick, free, first pass — not a replacement for a professional security review, threat modeling, dependency scanning, or penetration testing.
                </p>
                <div className="grid md:grid-cols-2 gap-0 border border-white/10">

                    {/* Left: no check at all */}
                    <div className="p-12 border-b md:border-b-0 md:border-r border-white/10 bg-black/40 reveal-left">
                        <h3 className="text-2xl font-bold mb-8 text-gray-500 flex items-center gap-3">
                            <span className="line-through">NO AUTOMATED CHECK</span>
                        </h3>
                        <ul className="space-y-6">
                            <li className="flex gap-4 opacity-50">
                                <span className="text-red-500 font-mono">[-]</span>
                                <div>
                                    <div className="font-bold">Easy to Miss</div>
                                    <div className="text-sm text-gray-500">A leaked key or an unsanitized sink is easy to skim past</div>
                                </div>
                            </li>
                            <li className="flex gap-4 opacity-50">
                                <span className="text-red-500 font-mono">[-]</span>
                                <div>
                                    <div className="font-bold">No Second Pass</div>
                                    <div className="text-sm text-gray-500">Relies entirely on the author noticing their own mistakes</div>
                                </div>
                            </li>
                            <li className="flex gap-4 opacity-50">
                                <span className="text-red-500 font-mono">[-]</span>
                                <div>
                                    <div className="font-bold">No Record</div>
                                    <div className="text-sm text-gray-500">Nothing documents what was or wasn't checked</div>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Right: XAUDIT */}
                    <div className="p-12 bg-white/5 relative overflow-hidden reveal">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -z-10"></div>

                        <h3 className="text-2xl font-bold mb-8 text-white flex items-center gap-3">
                            <span className="text-green-400">●</span> XAUDIT (this tool)
                        </h3>
                        <ul className="space-y-6">
                            <li className="flex gap-4">
                                <span className="text-green-500 font-mono">[+]</span>
                                <div>
                                    <div className="font-bold">Fast, On-Demand</div>
                                    <div className="text-sm text-gray-400">Runs in your browser in well under a second on typical input</div>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="text-green-500 font-mono">[+]</span>
                                <div>
                                    <div className="font-bold">AST-Based, Not Regex Guessing</div>
                                    <div className="text-sm text-gray-400">A real parser, narrow rules, documented limitations — see the benchmark report</div>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="text-green-500 font-mono">[+]</span>
                                <div>
                                    <div className="font-bold">Free, Open Source</div>
                                    <div className="text-sm text-gray-400">No account, no upload — code never leaves your browser</div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}
