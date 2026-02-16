
import React from 'react';

export default function PricingSection({ onStartScan }) {
    return (
        <section id="pricing" className="py-32 relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-20 reveal">
                    <h2 className="text-4xl font-bold mb-4">DEPLOYMENT PLANS</h2>
                    <p className="text-gray-400">Security shouldn't look like a ransom note.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-24">

                    {/* Starter */}
                    <div className="reveal bg-neutral-900 border border-white/10 p-8 clip-angle-card hover:border-white/30 transition-colors">
                        <div className="text-sm font-mono text-gray-500 mb-4">STARTER</div>
                        <div className="text-4xl font-bold mb-2">$0</div>
                        <div className="text-sm text-gray-400 mb-8">For open source projects</div>
                        <ul className="space-y-3 text-sm text-gray-300 mb-8 font-mono">
                            <li className="flex gap-2"><span>+</span> Public Repos Only</li>
                            <li className="flex gap-2"><span>+</span> Basic Vulnerability Scan</li>
                            <li className="flex gap-2"><span>+</span> Unlimited Builds</li>
                            <li className="flex gap-2"><span>+</span> Community Support</li>
                        </ul>
                        <button
                            onClick={onStartScan}
                            className="w-full border border-white/20 py-3 font-bold hover:bg-white hover:text-black transition-all clip-angle-button cursor-pointer">
                            START FREE
                        </button>
                    </div>

                    {/* Pro */}
                    <div className="reveal relative bg-white/5 border border-white/40 p-8 clip-angle-card-reverse shadow-[0_0_30px_rgba(255,255,255,0.05)]" style={{ transitionDelay: '100ms' }}>
                        <div className="absolute top-0 right-0 bg-white text-black text-xs font-bold px-3 py-1 clip-angle-button">POPULAR</div>
                        <div className="text-sm font-mono text-white mb-4">PRO</div>
                        <div className="text-4xl font-bold mb-2">$0<span className="text-lg font-normal text-gray-400">/mo</span></div>
                        <div className="text-sm text-gray-400 mb-8">For growing teams</div>
                        <ul className="space-y-3 text-sm text-gray-300 mb-8 font-mono">
                            <li className="flex gap-2"><span>+</span> Private Repos</li>
                            <li className="flex gap-2"><span>+</span> Advanced Logic Analysis</li>
                            <li className="flex gap-2"><span>+</span> Auto-PR Creation</li>
                            <li className="flex gap-2"><span>+</span> Priority Queue</li>
                        </ul>
                        <button
                            onClick={onStartScan}
                            className="w-full bg-white text-black py-3 font-bold hover:bg-gray-200 transition-all clip-angle-button cursor-pointer">
                            GET STARTED
                        </button>
                    </div>

                    {/* Enterprise */}
                    <div className="reveal bg-neutral-900 border border-white/10 p-8 clip-angle-card hover:border-white/30 transition-colors" style={{ transitionDelay: '200ms' }}>
                        <div className="text-sm font-mono text-gray-500 mb-4">ENTERPRISE</div>
                        <div className="text-4xl font-bold mb-2">$0</div>
                        <div className="text-sm text-gray-400 mb-8">For large organizations</div>
                        <ul className="space-y-3 text-sm text-gray-300 mb-8 font-mono">
                            <li className="flex gap-2"><span>+</span> On-premise Deployment</li>
                            <li className="flex gap-2"><span>+</span> Custom Rule Engine</li>
                            <li className="flex gap-2"><span>+</span> SSO & Audit Logs</li>
                            <li className="flex gap-2"><span>+</span> 24/7 Dedicated Support</li>
                        </ul>
                        <button
                            onClick={onStartScan}
                            className="w-full border border-white/20 py-3 font-bold hover:bg-white hover:text-black transition-all clip-angle-button cursor-pointer">
                            GET STARTED
                        </button>
                    </div>
                </div>

                {/* It's All Free Section */}
                <div className="text-center reveal max-w-3xl mx-auto border border-white/10 bg-white/5 p-12 clip-angle-card relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent"></div>
                    <div className="absolute -left-10 top-0 w-32 h-32 bg-white/10 blur-3xl rounded-full"></div>

                    <h3 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">YES, IT'S REALLY FREE.</h3>
                    <p className="text-xl text-gray-300 leading-relaxed mb-8">
                        We believe code security is a fundamental right, not a luxury feature.
                        XAUDIT is open-source and free for everyone, forever.
                    </p>
                    <div className="flex justify-center gap-8 text-sm font-mono text-gray-500">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            <span>NO CREDIT CARD</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            <span>NO SIGN IN REQUIRED</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            <span>MIT LICENSE</span>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
