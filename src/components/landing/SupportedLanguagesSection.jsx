
import React from 'react';

export default function SupportedLanguagesSection() {
    const languages = [
        { name: "JavaScript", color: "text-yellow-400", border: "group-hover:border-yellow-400/50" },
        { name: "TypeScript", color: "text-blue-400", border: "group-hover:border-blue-400/50" },
        { name: "React", color: "text-cyan-400", border: "group-hover:border-cyan-400/50" },
        { name: "Vue", color: "text-green-400", border: "group-hover:border-green-400/50" },
        { name: "Svelte", color: "text-orange-400", border: "group-hover:border-orange-400/50" },
        { name: "HTML5", color: "text-red-400", border: "group-hover:border-red-400/50" },
        { name: "Tailwind", color: "text-cyan-300", border: "group-hover:border-cyan-300/50" },
        { name: "Node.js", color: "text-green-600", border: "group-hover:border-green-600/50" },
        { name: "Next.js", color: "text-white", border: "group-hover:border-white/50" },
        { name: "Astro", color: "text-purple-400", border: "group-hover:border-purple-400/50" },
        { name: "Solid", color: "text-blue-300", border: "group-hover:border-blue-300/50" },
        { name: "Web Comp", color: "text-yellow-600", border: "group-hover:border-yellow-600/50" }
    ];

    return (
        <section className="py-20 bg-black border-t border-white/10">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-12 reveal">
                    <h2 className="text-3xl font-bold mb-4">UNIVERSAL LANGUAGE SUPPORT</h2>
                    <p className="text-gray-400">One tool to secure your entire polyglot codebase.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {languages.map((lang, index) => (
                        <div
                            key={index}
                            className={`group reveal p-4 border border-white/5 bg-neutral-900/50 hover:bg-neutral-900 transition-colors cursor-default ${lang.border}`}
                            style={{ transitionDelay: `${index * 50}ms` }}
                        >
                            <div className={`font-mono font-bold ${lang.color} mb-1`}>{lang.name}</div>
                            <div className="text-xs text-gray-600 group-hover:text-gray-400">v1.2+</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
