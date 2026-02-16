
import React from 'react';

export default function HowItWorks() {
    return (
        <section className="py-24 bg-gray-50 border-y-2 border-black" id="how-it-works">
            <div className="max-w-[1400px] mx-auto px-6">
                <header className="mb-16 text-center">
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-6">
                        How It Works
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto font-medium">
                        Three simple steps to cleaner, safer, and faster code.
                    </p>
                </header>

                <div className="grid md:grid-cols-3 gap-8 relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-1 bg-gray-300 -z-10" />

                    {/* Step 1 */}
                    <div className="text-center group">
                        <div className="w-24 h-24 bg-white border-[3px] border-black rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group-hover:-translate-y-1 transition-all duration-300">
                            <span className="text-4xl font-black text-blue-600">1</span>
                        </div>
                        <h3 className="text-2xl font-bold mb-4">Paste Code</h3>
                        <p className="text-gray-600 px-4">
                            Copy your AI-generated code (React, HTML, or JS) and paste it into our secure auditor.
                        </p>
                    </div>

                    {/* Step 2 */}
                    <div className="text-center group">
                        <div className="w-24 h-24 bg-white border-[3px] border-black rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group-hover:-translate-y-1 transition-all duration-300">
                            <span className="text-4xl font-black text-purple-600">2</span>
                        </div>
                        <h3 className="text-2xl font-bold mb-4">AI Analysis</h3>
                        <p className="text-gray-600 px-4">
                            Our engine scans for security risks, performance bottlenecks, and accessibility violations.
                        </p>
                    </div>

                    {/* Step 3 */}
                    <div className="text-center group">
                        <div className="w-24 h-24 bg-white border-[3px] border-black rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group-hover:-translate-y-1 transition-all duration-300">
                            <span className="text-4xl font-black text-green-600">3</span>
                        </div>
                        <h3 className="text-2xl font-bold mb-4">Get Report</h3>
                        <p className="text-gray-600 px-4">
                            Receive a detailed audit report with actionable fixes and a final quality score.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
