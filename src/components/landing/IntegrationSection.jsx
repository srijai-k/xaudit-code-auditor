
import React from 'react';

export default function IntegrationSection() {
    return (
        <section id="integration" className="py-24 border-t border-white/5 bg-black relative overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-neutral-900/50 to-transparent -z-10"></div>

            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16 reveal">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">INTEGRATES WITH YOUR STACK</h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        XAUDIT plugs directly into your workflow. No context switching required.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 reveal">
                    {[
                        { name: "GitHub", icon: "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" },
                        { name: "VS Code", icon: "M23.15 2.587l-9.84-2.587c-.508-.133-1.054.062-1.312.515l-11.833 20.912c-.221.391-.128.877.215 1.161l5.448 4.507c.394.327.973.284 1.314-.093l16.142-17.766c.582-.641.512-1.62-.134-2.176zm-11.049 4.908l6.387 1.681-12.83 14.123 6.443-15.804zm-6.205 13.916l1.378 1.141-3.694-1.687 2.316.546z" }, // Adjusted generic path for style
                        { name: "GitLab", icon: "M23.955 13.587l-1.344-4.136-2.541-7.83c-.156-.481-.841-.481-.997 0l-2.544 7.83h-9.056l-2.544-7.83c-.156-.481-.84-.481-.996 0l-2.544 7.83-1.341 4.136c-.322.992.057 2.083.896 2.684l10.024 7.284 10.023-7.284c.839-.601 1.218-1.692.896-2.684z" },
                        { name: "Docker", icon: "M13.766 11.234h2.556v2.555h-2.556v-2.555zm-3.629 0h2.556v2.555h-2.556v-2.555zm-3.631 0h2.558v2.555h-2.558v-2.555zm10.89 0h2.554v2.555h-2.554v-2.555zm-14.516.313h2.554v2.555h-2.554v-2.555zm21.777 6.131c-.551 0-1.018-.322-1.258-.8h-3.322v-3.088h2.554v-2.555h-2.554v-2.557h-2.556v2.557h-2.554v-2.557h-2.558v2.557h-2.555v-2.557h-2.558v2.557h-2.556v2.555h2.556v2.555h2.558v2.555h2.555v-2.555h2.558v2.555h2.554v-2.555h2.554v3.088h-4.305c-.381 1.252-1.542 2.162-2.915 2.162-1.684 0-3.049-1.365-3.049-3.049s1.365-3.049 3.049-3.049c1.621 0 2.946 1.266 3.041 2.868h4.502c.382-1.252 1.542-2.162 2.915-2.162 1.685 0 3.049 1.365 3.049 3.049s-1.364 3.049-3.049 3.049c-1.683 0-3.049-1.365-3.049-3.049z" }
                    ].map((tool, index) => (
                        <div key={index} className="flex items-center gap-4 bg-neutral-900/50 border border-white/5 p-4 rounded hover:bg-neutral-800 transition-colors group cursor-default">
                            <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center text-white group-hover:text-white/80 transition-colors">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d={tool.icon} />
                                </svg>
                            </div>
                            <span className="font-mono text-sm font-bold">{tool.name}</span>
                        </div>
                    ))}

                    {/* Additional generic items for grid balance */}
                    <div className="flex items-center gap-4 bg-neutral-900/50 border border-white/5 p-4 rounded hover:bg-neutral-800 transition-colors group">
                        <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center text-white font-mono font-bold">J</div>
                        <span className="font-mono text-sm font-bold">Jenkins</span>
                    </div>
                    <div className="flex items-center gap-4 bg-neutral-900/50 border border-white/5 p-4 rounded hover:bg-neutral-800 transition-colors group">
                        <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center text-white font-mono font-bold">K</div>
                        <span className="font-mono text-sm font-bold">Kubernetes</span>
                    </div>
                    <div className="flex items-center gap-4 bg-neutral-900/50 border border-white/5 p-4 rounded hover:bg-neutral-800 transition-colors group">
                        <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center text-white font-mono font-bold">S</div>
                        <span className="font-mono text-sm font-bold">Slack</span>
                    </div>
                    <div className="flex items-center gap-4 bg-neutral-900/50 border border-white/5 p-4 rounded hover:bg-neutral-800 transition-colors group">
                        <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center text-white font-mono font-bold">L</div>
                        <span className="font-mono text-sm font-bold">Linear</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
