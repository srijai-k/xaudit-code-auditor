
import React from 'react';

export default function CTASection() {
    return (
        <section className="py-32 border-t border-white/10">
            <div className="max-w-4xl mx-auto px-6 text-center reveal">
                <h2 className="text-5xl md:text-7xl font-bold mb-8 tracking-tighter">WANT A SECOND <br /> PAIR OF EYES?</h2>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <button className="clip-angle-button bg-white text-black px-10 py-5 font-bold text-lg hover:scale-105 transition-transform flex items-center gap-3">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        OPEN THE CHECKER
                    </button>
                    <div className="text-gray-400 font-mono text-sm px-4 py-2 border border-white/10 rounded-full bg-white/5">
                        NO INSTALL • NO SIGN IN REQUIRED
                    </div>
                </div>
            </div>
        </section>
    );
}
