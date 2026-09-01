
import React from 'react';

export default function PricingSection({ onStartScan }) {
    return (
        <section id="pricing" className="py-32 relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16 reveal">
                    <h2 className="text-4xl font-bold mb-4">NO PLANS. NO TIERS.</h2>
                    <p className="text-gray-400">There's no account system, no repos to connect, and nothing to upgrade — so there's nothing to sell you.</p>
                </div>

                <div className="text-center reveal max-w-3xl mx-auto border border-white/10 bg-white/5 p-12 clip-angle-card relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent"></div>
                    <div className="absolute -left-10 top-0 w-32 h-32 bg-white/10 blur-3xl rounded-full"></div>

                    <h3 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">FREE. OPEN SOURCE.</h3>
                    <p className="text-xl text-gray-300 leading-relaxed mb-8">
                        XAUDIT is a static code checker, not a SaaS product. Everything runs in your browser under the MIT license. There is no paid tier, no enterprise plan, no support contract to buy.
                    </p>
                    <div className="flex flex-wrap justify-center gap-8 text-sm font-mono text-gray-500 mb-10">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            <span>NO CREDIT CARD</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            <span>NO ACCOUNT NEEDED</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            <span>MIT LICENSE</span>
                        </div>
                    </div>
                    <button
                        onClick={onStartScan}
                        className="bg-white text-black px-8 py-3 font-bold hover:bg-gray-200 transition-all clip-angle-button cursor-pointer">
                        OPEN THE CHECKER
                    </button>
                </div>

            </div>
        </section>
    );
}
