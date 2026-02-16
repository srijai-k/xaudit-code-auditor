
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
                                        {/* Before */}
                                        <div className="flex-1 bg-black/50 p-6 rounded-lg border border-red-500/30 relative">
                                            <div className="absolute top-4 right-4 text-red-500 text-xs font-bold px-2 py-1 bg-red-500/10 rounded">
                                                LEGACY
                                            </div>
                                            <div className="font-mono text-xs md:text-sm text-gray-300 overflow-x-auto">
                                                <div className="text-gray-500 mb-2">// BEFORE: Legacy Class Component</div>
                                                <div className="text-red-400">- class UserProfile extends React.Component {'{'}</div>
                                                <div className="text-red-400">-   componentDidMount() {'{'}</div>
                                                <div className="text-red-400">-     this.loadData();</div>
                                                <div className="text-red-400">-   {'}'}</div>
                                                <div className="text-red-400">-   render() {'{'}</div>
                                                <div className="text-red-400">-     return &lt;div&gt;{'{'}this.state.name{'}'}&lt;/div&gt;;</div>
                                                <div className="text-red-400">-   {'}'}</div>
                                                <div className="text-red-400">- {'}'}</div>
                                            </div>
                                        </div>

                                        {/* After */}
                                        <div className="flex-1 bg-black/50 p-6 rounded-lg border border-green-500/30 relative">
                                            <div className="absolute top-4 right-4 text-green-500 text-xs font-bold px-2 py-1 bg-green-500/10 rounded">
                                                MODERNIZED
                                            </div>
                                            <div className="font-mono text-xs md:text-sm text-gray-300 overflow-x-auto">
                                                <div className="text-gray-500 mb-2">// AFTER: Functional Component + Hooks</div>
                                                <div className="text-green-400">+ const UserProfile = () =&gt; {'{'}</div>
                                                <div className="text-green-400">+   const [user, setUser] = useState(null);</div>
                                                <div className="text-green-400">+ </div>
                                                <div className="text-green-400">+   useEffect(() =&gt; {'{'}</div>
                                                <div className="text-green-400">+     loadData().then(setUser);</div>
                                                <div className="text-green-400">+   {'}'}, []);</div>
                                                <div className="text-green-400">+ </div>
                                                <div className="text-green-400">+   return &lt;div&gt;{'{'}user?.name{'}'}&lt;/div&gt;;</div>
                                                <div className="text-green-400">+ {'}'};</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute -right-4 top-10 bg-white text-black font-mono text-xs font-bold px-4 py-2 clip-angle-button shadow-lg shadow-white/20">
                                    0 VULNERABILITIES
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="order-1 lg:order-2 reveal">
                        <h2 className="text-4xl font-bold mb-6">ACTIONABLE <br /> INSIGHTS</h2>
                        <p className="text-gray-400 mb-8 leading-relaxed">
                            XAUDIT doesn't just find problems. It explains the intent of your code and generates context-aware code snippets to fast-track your refactoring.
                        </p>
                        <ul className="space-y-4 font-mono text-sm mb-10">
                            <li className="flex items-center gap-3">
                                <span className="w-1.5 h-1.5 bg-white"></span>
                                <span>Semantic Code Understanding</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="w-1.5 h-1.5 bg-white"></span>
                                <span>Ready-to-use Fix Snippets</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="w-1.5 h-1.5 bg-white"></span>
                                <span>Custom Rule Definitions</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="w-1.5 h-1.5 bg-white"></span>
                                <span>Zero False Positives</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}
