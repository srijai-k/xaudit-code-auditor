
import React from 'react';

export default function RefactoringSection() {
    return (
        <section className="py-20 bg-neutral-900 border-y border-white/5 relative overflow-hidden">

            <div className="absolute top-0 left-1/4 w-px h-full bg-white/5"></div>
            <div className="absolute top-0 left-2/4 w-px h-full bg-white/5"></div>
            <div className="absolute top-0 left-3/4 w-px h-full bg-white/5"></div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="order-2 lg:order-1 reveal-left">

                        <div className="relative">
                            <div className="aspect-square max-w-md mx-auto relative">

                                <div className="absolute inset-0 border border-white/20 transform rotate-3 transition-transform hover:rotate-0 duration-500 bg-black clip-angle-card p-6">
                                    <div className="h-full border border-dashed border-white/10 flex items-center justify-center">
                                        <span className="font-mono text-xs text-gray-600">LAYER_SECURITY</span>
                                    </div>
                                </div>

                                <div className="absolute inset-0 border border-white/20 transform -rotate-3 hover:rotate-0 transition-transform duration-500 bg-black/80 backdrop-blur-sm clip-angle-card-reverse p-6 flex items-center justify-center">
                                    <div className="flex flex-col gap-4 w-full h-full">
                                        {/* Flagged */}
                                        <div className="flex-1 bg-black/50 p-6 rounded-lg border border-orange-500/30 relative">
                                            <div className="absolute top-4 right-4 text-orange-500 text-xs font-bold px-2 py-1 bg-orange-500/10 rounded">
                                                FLAGGED
                                            </div>
                                            <div className="font-mono text-xs md:text-sm text-gray-300 overflow-x-auto">
                                                <div className="text-gray-500 mb-2">// what the checker found</div>
                                                <div className="text-orange-400">HIGH — Unsanitized assignment to .innerHTML</div>
                                                <div className="text-gray-500 mt-2">el.innerHTML = comment.body;</div>
                                            </div>
                                        </div>

                                        {/* Safer example */}
                                        <div className="flex-1 bg-black/50 p-6 rounded-lg border border-green-500/30 relative">
                                            <div className="absolute top-4 right-4 text-green-500 text-xs font-bold px-2 py-1 bg-green-500/10 rounded">
                                                SAFER EXAMPLE
                                            </div>
                                            <div className="font-mono text-xs md:text-sm text-gray-300 overflow-x-auto">
                                                <div className="text-gray-500 mb-2">// suggested in the finding — you apply it</div>
                                                <div className="text-green-400">el.innerHTML = DOMPurify.sanitize(comment.body);</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="order-1 lg:order-2 reveal">
                        <h2 className="text-4xl font-bold mb-6">EVERY FINDING <br /> EXPLAINS ITSELF</h2>
                        <p className="text-gray-400 mb-8 leading-relaxed">
                            Every finding ships with what matched, why it matters, a safer example, and — just as importantly — what this specific check can't see. XAUDIT doesn't rewrite your code for you; it tells you what to look at and why.
                        </p>
                        <ul className="space-y-4 font-mono text-sm mb-10">
                            <li className="flex items-center gap-3">
                                <span className="w-1.5 h-1.5 bg-white"></span>
                                <span>What Matched, In Plain Language</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="w-1.5 h-1.5 bg-white"></span>
                                <span>Safer-Example Snippets</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="w-1.5 h-1.5 bg-white"></span>
                                <span>Stated Limitations, Every Time</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="w-1.5 h-1.5 bg-white"></span>
                                <span>Measured, Published Precision — Not a Promise of Zero False Positives</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}
