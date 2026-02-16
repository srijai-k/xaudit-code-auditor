import React from 'react';

export default function AboutUs() {
    return (
        <section className="bg-transparent py-24 px-4 md:px-8">
            <div className="max-w-[1920px] mx-auto">
                <div className="bg-[#F4F4F9] border border-gray-200 rounded-[2rem] p-8 md:p-16 shadow-sm min-h-[80vh] flex flex-col md:flex-row relative overflow-hidden">

                    {/* Label - Absolute Top Left */}
                    <div className="absolute top-8 left-8 md:top-12 md:left-12">
                        <span className="text-sm font-medium text-gray-500 tracking-tight">About us</span>
                    </div>

                    {/* Main Content - Pushed to right/bottom */}
                    <div className="mt-16 md:mt-0 w-full flex items-center justify-end">
                        <h2 className="text-4xl md:text-[4vw] font-bold leading-[1.0] tracking-tighter text-black text-right max-w-[90%]"
                            style={{
                                fontFamily: '"Oswald", sans-serif',
                                wordSpacing: '0.05em'
                            }}>
                            We're full-cycle consulting company, providing fundraising, development, marketing, and listing services to drive blockchain projects from concept to success.
                        </h2>
                    </div>

                </div>
            </div>
        </section>
    );
}
