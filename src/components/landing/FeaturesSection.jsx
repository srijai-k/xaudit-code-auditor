
import React from 'react';

export default function FeaturesSection() {
    return (
        <section id="features" className="py-24 bg-neutral-900 border-t border-white/10 relative overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-6">
                <div className="reveal mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">WHAT IT ACTUALLY CHECKS</h2>
                    <p className="text-xl text-gray-400 max-w-2xl">
                        Six narrow, tested rule groups over a real AST — not a general linter, not a security guarantee. No performance profiling, no bundle analysis, no dead-code detection: this tool doesn't do those.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Feature 1 */}
                    <div className="reveal group p-8 bg-black border border-white/10 hover:border-green-500/50 transition-colors clip-angle-card relative">
                        <div className="mb-6 w-12 h-12 bg-white/5 rounded flex items-center justify-center group-hover:bg-green-500/10 transition-colors">
                            <svg className="w-6 h-6 text-white group-hover:text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold mb-4 group-hover:text-green-400 transition-colors">DOM XSS &amp; dynamic execution</h3>
                        <p className="text-gray-400 leading-relaxed mb-6">
                            Flags unsanitized innerHTML/outerHTML/insertAdjacentHTML/document.write and dangerouslySetInnerHTML, plus eval/Function/string-based setTimeout. Never flags normal JSX event props like onClick.
                        </p>
                        <ul className="space-y-2 text-sm text-gray-500 font-mono">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> AST-based, not regex
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Sanitizer-aware (DOMPurify)
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Literal HTML never flagged
                            </li>
                        </ul>
                    </div>

                    {/* Feature 2 */}
                    <div className="reveal group p-8 bg-black border border-white/10 hover:border-blue-500/50 transition-colors clip-angle-card relative" style={{ transitionDelay: '100ms' }}>
                        <div className="mb-6 w-12 h-12 bg-white/5 rounded flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
                            <svg className="w-6 h-6 text-white group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold mb-4 group-hover:text-blue-400 transition-colors">SQL injection (narrow heuristic)</h3>
                        <p className="text-gray-400 leading-relaxed mb-6">
                            Flags string concatenation or template interpolation passed directly to .query/.execute/.raw/.unsafe. Parameterized queries and ORM calls are not flagged. No data-flow analysis — see the README for exact scope.
                        </p>
                        <ul className="space-y-2 text-sm text-gray-500 font-mono">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> db/client/pool.query, .raw, .unsafe
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Placeholders correctly ignored
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Direct call-site only, no aliasing
                            </li>
                        </ul>
                    </div>

                    {/* Feature 3 */}
                    <div className="reveal group p-8 bg-black border border-white/10 hover:border-purple-500/50 transition-colors clip-angle-card relative" style={{ transitionDelay: '200ms' }}>
                        <div className="mb-6 w-12 h-12 bg-white/5 rounded flex items-center justify-center group-hover:bg-purple-500/10 transition-colors">
                            <svg className="w-6 h-6 text-white group-hover:text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold mb-4 group-hover:text-purple-400 transition-colors">Hardcoded secrets</h3>
                        <p className="text-gray-400 leading-relaxed mb-6">
                            Vendor-prefixed formats only (OpenAI, Anthropic, Stripe, AWS, GitHub, GitLab, Slack, private-key blocks, Google API keys) plus a name-context fallback. No bare-hex/bare-alphanumeric guessing that mislabels random strings as secrets.
                        </p>
                        <ul className="space-y-2 text-sm text-gray-500 font-mono">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span> Values masked everywhere
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span> Public Firebase config ≠ leak
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span> Placeholders excluded outright
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}
