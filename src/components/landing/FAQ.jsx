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
            question: "Does this work with Python/Backend code?",
            answer: "Currently, XAUDIT runs entirely in your browser using WebAssembly. It supports JavaScript, TypeScript, and JSON files instantly. Backend language support (Python, Go) is in beta via our experimental WASM parsers."
        },
        {
            question: "Is my code kept private?",
            answer: "Yes. Your code never leaves your browser. Analysis happens in-memory within your local browser sandbox. No code is ever sent to a server."
        },
        {
            question: "Can I integrate this into CI/CD?",
            answer: "XAUDIT is currently designed for instant local feedback during development. A standalone CLI tool for CI/CD pipelines is currently in private beta."
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
