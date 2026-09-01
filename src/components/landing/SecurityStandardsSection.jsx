
import React from 'react';

export default function SecurityStandardsSection() {
    return (
        <section className="py-24 bg-neutral-900 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">

                <div className="md:w-1/2 reveal">
                    <h2 className="text-4xl md:text-5xl font-bold mb-8">YOUR CODE NEVER LEAVES YOUR BROWSER.</h2>
                    <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                        Analysis runs in a Web Worker inside your browser tab. There is no server component, no upload step, and no third-party API call in the analysis path — verifiable by opening your browser's network tab while you run a check.
                    </p>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-green-500/10 rounded flex items-center justify-center shrink-0">
                                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div>
                                <h4 className="text-xl font-bold mb-1">Client-Side, By Construction</h4>
                                <p className="text-gray-500 text-sm">The rule engine (Babel-based parser + pattern rules) has no fetch/XHR/WebSocket calls anywhere in it.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-green-500/10 rounded flex items-center justify-center shrink-0">
                                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                            <div>
                                <h4 className="text-xl font-bold mb-1">Nothing Saved By Default</h4>
                                <p className="text-gray-500 text-sm">Your code isn't persisted anywhere unless you explicitly turn on local saving — and even then, only counts and a masked excerpt are stored, in plain (not encrypted) localStorage.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-green-500/10 rounded flex items-center justify-center shrink-0">
                                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                            </div>
                            <div>
                                <h4 className="text-xl font-bold mb-1">Installable PWA</h4>
                                <p className="text-gray-500 text-sm">The app shell is precached for return visits. Offline behavior depends on your browser; we haven't independently verified it on every platform.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:w-1/2 reveal">
                    {/* What "no network calls" actually looks like: your own devtools */}
                    <div className="relative bg-black border border-white/10 p-2 rounded-xl clip-angle-card">
                        <div className="bg-neutral-900 rounded p-6 font-mono text-sm leading-relaxed">
                            <div className="text-gray-500 mb-4 border-b border-white/5 pb-2">Try it yourself</div>
                            <div className="text-gray-400">1. Open DevTools → Network tab</div>
                            <div className="text-gray-400">2. Paste code and run a check</div>
                            <div className="text-gray-400">3. Watch the request list</div>
                            <div className="mt-4 text-gray-500"># What you'll see</div>
                            <div className="text-green-500">✓ Zero requests during analysis</div>
                            <div className="text-green-500">✓ No analytics, no ads, no trackers</div>
                            <div className="text-yellow-500">△ localStorage is plaintext, not encrypted</div>
                        </div>
                        <div className="absolute -top-6 -right-6 w-24 h-24 bg-green-500/20 rounded-full blur-2xl"></div>
                        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl"></div>
                    </div>
                </div>

            </div>
        </section>
    );
}
