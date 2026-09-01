
import React from 'react';

export default function SupportedLanguagesSection() {
    const supported = [
        { name: "JavaScript", color: "text-yellow-400", border: "group-hover:border-yellow-400/50" },
        { name: "TypeScript", color: "text-blue-400", border: "group-hover:border-blue-400/50" },
        { name: "React / JSX", color: "text-cyan-400", border: "group-hover:border-cyan-400/50" },
        { name: "HTML", color: "text-red-400", border: "group-hover:border-red-400/50" },
    ];

    const notSupported = ["Vue", "Svelte", "Astro", "Solid", "Next.js-specific patterns", "Node.js backend analysis", "Tailwind security analysis", "Web Components", "Python", "Go", "arbitrary \"polyglot\" code"];

    return (
        <section className="py-20 bg-black border-t border-white/10">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-12 reveal">
                    <h2 className="text-3xl font-bold mb-4">FOUR LANGUAGES. THAT'S IT.</h2>
                    <p className="text-gray-400">Narrow scope, actually tested — not a polyglot claim we can't back up.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-12">
                    {supported.map((lang, index) => (
                        <div
                            key={index}
                            className={`group reveal p-4 border border-white/5 bg-neutral-900/50 hover:bg-neutral-900 transition-colors cursor-default text-center ${lang.border}`}
                            style={{ transitionDelay: `${index * 50}ms` }}
                        >
                            <div className={`font-mono font-bold ${lang.color} mb-1`}>{lang.name}</div>
                            <div className="text-xs text-gray-600 group-hover:text-gray-400">supported</div>
                        </div>
                    ))}
                </div>

                <div className="max-w-3xl mx-auto text-center">
                    <div className="text-xs uppercase tracking-widest text-gray-600 mb-3">Not supported (do not assume otherwise)</div>
                    <div className="flex flex-wrap justify-center gap-2">
                        {notSupported.map((name, i) => (
                            <span key={i} className="text-xs font-mono text-gray-500 border border-white/5 rounded px-2 py-1">{name}</span>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
