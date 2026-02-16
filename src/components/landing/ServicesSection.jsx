
import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

import { ShieldCheck, Activity, Zap, FileCheck } from 'lucide-react';

export default function ServicesSection() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    return (
        <section ref={containerRef} className="bg-transparent py-24 px-4 md:px-8 relative">
            {/* Background Gradient Blob - Darker and more subtle */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[40vw] h-[80vh] bg-gradient-to-br from-pink-900/20 via-purple-900/20 to-indigo-900/20 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10">

                {/* Left Column: Sticky Headline */}
                <div className="lg:sticky lg:top-32 h-fit self-start">
                    <span className="text-sm font-medium text-gray-400 tracking-tight block mb-6">
                        We Provide
                    </span>
                    <h2 className="text-6xl md:text-[5vw] font-bold leading-[0.9] tracking-tighter text-white uppercase"
                        style={{ fontFamily: '"Oswald", sans-serif' }}>
                        Enterprise-grade security for modern web applications
                    </h2>
                </div>

                {/* Right Column: Stacking Scroll Wheel Cards */}
                <div className="flex flex-col relative pb-[10vh]">
                    {services.map((service, index) => (
                        <Card
                            key={index}
                            {...service}
                            index={index}
                            total={services.length}
                            scrollYProgress={scrollYProgress}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

const services = [
    {
        number: "01",
        title: "Frontend Security",
        description: "Automated detection of XSS vulnerabilities, sensitive data leaks, and insecure dependencies in your React/JS code before you ship.",
        icon: ShieldCheck,
        color: "text-cyan-400",
        shadow: "shadow-cyan-500/20"
    },
    {
        number: "02",
        title: "Real-time Analysis",
        description: "Instant feedback on logic errors, type safety, and accessibility issues as you type. No more waiting for CI/CD pipelines.",
        icon: Activity,
        color: "text-green-400",
        shadow: "shadow-green-500/20"
    },
    {
        number: "03",
        title: "Performance Ops",
        description: "Identify unnecessary re-renders, large bundle sizes, and memory leaks. Optimize your application's speed and user experience.",
        icon: Zap,
        color: "text-yellow-400",
        shadow: "shadow-yellow-500/20"
    },
    {
        number: "04",
        title: "Production Ready",
        description: "Get a comprehensive A-F grade for your codebase. Verify compliance with industry best practices before deployment.",
        icon: FileCheck,
        color: "text-blue-400",
        shadow: "shadow-blue-500/20"
    }
];

function Card({ number, title, description, icon: Icon, color, shadow, index, total, scrollYProgress }) {
    // Calculate the range for this card's active phase in the scroll
    // The card should scale down as the scroll progresses PAST its entry point
    // We want Card 0 to scale down as we scroll from 0 to 0.25 (approx)

    // Each card takes up a portion of the scroll distance equal to 1/total
    const step = 1 / total;
    const start = index * step;
    const end = start + step;

    // Use a dynamic transform based on index.
    const scale = useTransform(
        scrollYProgress,
        [start, 1],
        [1, 0.85]
    );

    const opacity = useTransform(
        scrollYProgress,
        [start, 1],
        [1, 0.4]
    );

    return (
        <div className="h-[80vh] sticky top-32 flex items-start justify-center mb-8">
            <motion.div
                style={{
                    scale: index === total - 1 ? 1 : scale, // Last card doesn't need to scale down (it's on top)
                    opacity: index === total - 1 ? 1 : opacity,
                    transformOrigin: "top center"
                }}
                className="bg-[#111]/80 backdrop-blur-md border border-white/10 rounded-[2rem] p-8 md:p-12 shadow-lg flex flex-col md:flex-row gap-8 items-start relative overflow-hidden w-full max-w-2xl"
            >
                <div className="flex-1 z-10">
                    <div className="text-4xl font-mono text-white/20 mb-6">{number}</div>
                    <h3 className="text-3xl font-bold text-white mb-4">{title}</h3>
                    <p className="text-gray-400 leading-relaxed">
                        {description}
                    </p>
                </div>

                <div className="w-full md:w-1/3 flex justify-center items-center">
                    <div className={`p-6 rounded-2xl bg-white/5 border border-white/10 ${shadow} shadow-xl backdrop-blur-sm`}>
                        <Icon
                            className={`w-20 h-20 ${color}`}
                            strokeWidth={1}
                        />
                    </div>
                </div>

                {/* Gradient overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            </motion.div>
        </div>
    );
}

