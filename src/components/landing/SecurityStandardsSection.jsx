
import React from 'react';

export default function SecurityStandardsSection() {
    return (
        <section className="py-24 bg-neutral-900 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">

                <div className="md:w-1/2 reveal">
                    <h2 className="text-4xl md:text-5xl font-bold mb-8">YOUR CODE NEVER LEAVES YOUR BROWSER.</h2>
                    <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                        Unlike cloud-based auditors, XAUDIT runs entirely within your browser's secure sandbox using WebAssembly. We never upload your IP to our servers.
                    </p>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-green-500/10 rounded flex items-center justify-center shrink-0">
                                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div>
                                <h4 className="text-xl font-bold mb-1">Client-Side Architecture</h4>
                                <p className="text-gray-500 text-sm">Analysis happens in browser memory. Zero data retention.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-green-500/10 rounded flex items-center justify-center shrink-0">
                                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                            <div>
                                <h4 className="text-xl font-bold mb-1">Zero Data Collection</h4>
                                <p className="text-gray-500 text-sm">Built for enterprise privacy. No data processing agreement needed.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-green-500/10 rounded flex items-center justify-center shrink-0">
                                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                            </div>
                            <div>
                                <h4 className="text-xl font-bold mb-1">Offline Capable</h4>
                                <p className="text-gray-500 text-sm">Our PWA works offline. Audit your code on an air-gapped machine.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:w-1/2 reveal">
                    {/* Visual representation of local scanning */}
                    <div className="relative bg-black border border-white/10 p-2 rounded-xl clip-angle-card">
                        <div className="bg-neutral-900 rounded p-6 font-mono text-sm leading-relaxed">
                            <div className="text-gray-500 mb-4 border-b border-white/5 pb-2">Browser Console</div>
                            <div className="text-purple-400">xaudit.init({'{'}</div>
                            <div className="pl-4 text-purple-400">mode: <span className="text-white">"wasm-client"</span>,</div>
                            <div className="pl-4 text-purple-400">network_access: <span className="text-red-400">false</span>,</div>
                            <div className="pl-4 text-purple-400">telemetry: <span className="text-red-400">false</span></div>
                            <div className="text-purple-400">{'}'});</div>
                            <div className="mt-4 text-gray-500"># Security Check</div>
                            <div className="text-green-500">✓ Network requests blocked</div>
                            <div className="text-green-500">✓ LocalStorage encrypted</div>
                        </div>
                        {/* Decorative shield */}
                        <div className="absolute -top-6 -right-6 w-24 h-24 bg-green-500/20 rounded-full blur-2xl"></div>
                        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl"></div>
                    </div>
                </div>

            </div>
        </section>
    );
}
