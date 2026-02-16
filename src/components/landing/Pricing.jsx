import React from 'react';
import { Link } from 'react-router-dom';

export default function Pricing() {
    return (
        <section className="py-24 relative overflow-hidden bg-white" id="pricing">
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }}
            />

            <div className="max-w-[1330px] mx-auto px-6 relative z-10">
                <div className="text-center mb-20 fade-up">
                    <h2 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-6 uppercase">
                        PLANS FOR<br />
                        <span className="text-[#2B59FF]">EVERY BUILDER</span>
                    </h2>
                    <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto font-medium">
                        Shipping secure code shouldn't have a paywall. All XAUDIT features are available to everyone, for free.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Free Card */}
                    <div className="group bg-white border-[3px] border-black rounded-[2.5rem] p-10 flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[8px] hover:translate-y-[8px] hover:shadow-none transition-all duration-1000 linear will-change-transform fade-up">
                        <div className="mb-8">
                            <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">Free</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-black">$0</span>
                                <span className="text-gray-500 font-bold">/mo</span>
                            </div>
                            <p className="text-gray-500 mt-4 font-medium">Perfect for individuals and hobbyists.</p>
                        </div>

                        <ul className="space-y-4 mb-10 flex-1">
                            {[
                                "Unlimited Audits",
                                "Security Scanning",
                                "Performance Checks",
                                "AI Fix Prompts"
                            ].map((feature, i) => (
                                <li key={i} className="flex items-center gap-3 font-semibold">
                                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <Link to="/audit" className="w-full block text-center py-4 bg-black text-white rounded-full font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all">
                            Get Started Free
                        </Link>
                    </div>

                    {/* Pro Card */}
                    <div className="group bg-[#E2F705] border-[3px] border-black rounded-[2.5rem] p-10 flex flex-col shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[12px] hover:translate-y-[12px] hover:shadow-none transition-all duration-1000 linear will-change-transform relative z-10 fade-up">
                        {/* ... (card content) ... */}

                        <Link to="/audit" className="w-full block text-center py-4 bg-black text-white rounded-full font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all">
                            Get Started Free
                        </Link>
                    </div>

                    {/* Enterprise Card */}
                    <div className="group bg-white border-[3px] border-black rounded-[2.5rem] p-10 flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[8px] hover:translate-y-[8px] hover:shadow-none transition-all duration-1000 linear will-change-transform fade-up">
                        {/* ... (card content) ... */}

                        <Link to="/audit" className="w-full block text-center py-4 bg-black text-white rounded-full font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all">
                            Get Started Free
                        </Link>
                    </div>
                </div>

                {/* Bottom Banner */}
                <div className="mt-24 p-12 bg-black text-white rounded-[3rem] text-center fade-up relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10">
                        <h2 className="text-4xl font-black mb-4 uppercase tracking-tight italic">Why is it all free?</h2>
                        <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                            We believe the future of AI code shouldn't be dangerous. By providing XAUDIT for free, we help builders create a safer, faster, and more accessible web for everyone. No hidden fees, no credit card required.
                        </p>
                        <div className="mt-8 flex flex-wrap justify-center gap-4">
                            <div className="flex items-center gap-2 px-6 py-3 bg-[#2B59FF] rounded-full text-sm font-black border-2 border-black/20 shadow-lg">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                                </svg>
                                NO CC REQUIRED
                            </div>
                            <div className="flex items-center gap-2 px-6 py-3 bg-[#8C52FF] rounded-full text-sm font-black border-2 border-black/20 shadow-lg">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                                </svg>
                                100% FREE FOREVER
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
