import React from 'react';

const tools = [
    {
        title: "Local Persistence",
        desc: "Save audit reports directly to your browser's local storage. No login required, no cloud sync needed.",
        color: "bg-[#E2F705]",
        textColor: "text-black",
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
        )
    },
    {
        title: "Instant Feedback",
        desc: "Get immediate vulnerability feedback as you type or paste. No waiting for CI/CD pipelines.",
        color: "bg-white",
        textColor: "text-gray-600",
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        ),
        isCenter: true
    },
    {
        title: "Fix Prompts",
        desc: "Don't just find bugs. Get context-aware prompts to fix them via Claude or ChatGPT instantly.",
        color: "bg-[#2B59FF]",
        textColor: "text-white opacity-80",
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
        ),
        titleColor: "text-white"
    }
];

export default function EnterpriseTooling() {
    return (
        <section className="py-24 bg-[#f4f7ff] relative overflow-hidden border-t-2 border-black/5">
            {/* Background Accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-white/50 pointer-events-none" />

            <div className="max-w-[1200px] mx-auto px-6 relative z-10">
                <h2 className="text-4xl md:text-5xl font-black mb-16 text-center tracking-tight uppercase text-black">ENTERPRISE TOOLING</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    {tools.map((tool, i) => (
                        <div
                            key={i}
                            className={`group border-[3px] border-black p-10 rounded-[2.5rem] ${tool.color} shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-10px] hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 relative`}
                        >
                            {/* Sticker Icon */}
                            <div className={`w-16 h-16 bg-white border-[3px] border-black rounded-2xl flex items-center justify-center mb-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform group-hover:scale-110 group-hover:-rotate-3 duration-300`}>
                                <div className="text-black scale-110">
                                    {tool.icon}
                                </div>
                            </div>

                            <div className="relative">
                                <h4 className={`text-2xl md:text-3xl font-black mb-4 ${tool.titleColor || 'text-black'}`}>{tool.title}</h4>
                                <p className={`text-base font-bold leading-relaxed ${tool.textColor.replace('text-white opacity-80', 'text-black/70')}`}>{tool.desc}</p>
                            </div>

                            {/* Decorative Corner */}
                            <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-30 transition-opacity">
                                <svg className="w-8 h-8 rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
