import React, { useState } from 'react';

const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-2 border-gray-200 rounded-2xl overflow-hidden group hover:border-black transition-colors">
            <button
                className="w-full p-6 text-left flex justify-between items-center bg-white"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="text-xl font-bold">{question}</span>
                <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[300px] opacity-100 bg-gray-50' : 'max-h-0 opacity-0'}`}>
                <div className="p-6 pt-0 text-gray-600 font-medium leading-relaxed">
                    {answer}
                </div>
            </div>
        </div>
    );
};

export default function FAQ() {
    const questions = [
        {
            question: "What languages does this actually support?",
            answer: "JavaScript, TypeScript, React/JSX, and basic HTML. That's it. Vue, Svelte, Astro, Solid, Next.js-specific patterns, Node.js backend analysis, Python, and Go are not supported — see \"Current supported checks\" below."
        },
        {
            question: "Is this AI-powered?",
            answer: "No. It's a rule-based static checker: a real JavaScript/TypeScript AST parser (Babel) plus a small set of hand-written pattern rules, run in a Web Worker in your browser. There is no model, no inference call, and no cloud component of any kind."
        },
        {
            question: "Does a clean result mean my code is secure?",
            answer: "No. It means the specific patterns this tool checks for weren't found. It does not detect all vulnerability classes (see \"Unsupported vulnerability classes\"), does not perform data-flow or taint analysis, and is not a substitute for a professional security review."
        },
        {
            question: "Is my code kept private?",
            answer: "Yes. Analysis runs entirely in your browser via a Web Worker; your code is never sent anywhere by this app. Nothing is saved to your browser either, unless you explicitly turn on \"Save report summaries locally\" — and even then, only counts, language, and a masked excerpt are stored, never raw code or secret values."
        },
        {
            question: "Can I integrate this into CI/CD?",
            answer: "Not currently. This is a browser-only tool today; there is no CLI or CI integration."
        }
    ];

    return (
        <section className="py-32 bg-white" id="faq">
            <div className="max-w-[800px] mx-auto px-6">
                <h2 className="text-5xl font-black mb-16 text-center tracking-tight uppercase">FAQ</h2>
                <div className="space-y-4">
                    {questions.map((q, i) => (
                        <FAQItem key={i} {...q} />
                    ))}
                </div>
            </div>
        </section>
    );
}
