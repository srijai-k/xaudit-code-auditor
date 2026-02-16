
import React from 'react';

export default function StatsSection() {
    return (
        <section className="border-y border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="reveal text-center">
                    <div className="text-4xl md:text-5xl font-mono font-bold text-white mb-2">100%</div>
                    <div className="text-sm text-gray-400 uppercase tracking-widest">Local Execution</div>
                </div>
                <div className="reveal text-center" style={{ transitionDelay: '100ms' }}>
                    <div className="text-4xl md:text-5xl font-mono font-bold text-green-500 mb-2">0KB</div>
                    <div className="text-sm text-gray-400 uppercase tracking-widest">Data Uploaded</div>
                </div>
                <div className="reveal text-center" style={{ transitionDelay: '200ms' }}>
                    <div className="text-4xl md:text-5xl font-mono font-bold text-blue-500 mb-2">&lt;1s</div>
                    <div className="text-sm text-gray-400 uppercase tracking-widest">Analysis Time</div>
                </div>
                <div className="reveal text-center" style={{ transitionDelay: '300ms' }}>
                    <div className="text-4xl md:text-5xl font-mono font-bold text-purple-500 mb-2">PWA</div>
                    <div className="text-sm text-gray-400 uppercase tracking-widest">Offline Capable</div>
                </div>
            </div>
        </section>
    );
}
