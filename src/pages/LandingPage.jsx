import React, { useEffect } from 'react';
import LandingNavbar from '../components/landing/LandingNavbar';
import Hero from '../components/landing/Hero';
import StatsSection from '../components/landing/StatsSection';
import ServicesSection from '../components/landing/ServicesSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import ComparisonSection from '../components/landing/ComparisonSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import SecurityStandardsSection from '../components/landing/SecurityStandardsSection';
import SupportedLanguagesSection from '../components/landing/SupportedLanguagesSection';
import AboutUsSection from '../components/landing/AboutUsSection';
import RefactoringSection from '../components/landing/RefactoringSection';
import IntegrationSection from '../components/landing/IntegrationSection';
import PricingSection from '../components/landing/PricingSection';
import CTASection from '../components/landing/CTASection';
import LandingFooter from '../components/landing/LandingFooter';
import CodeSnake from '../components/landing/CodeSnake';

export default function LandingPage() {

    // Observer Logic implementation from snippets
    useEffect(() => {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: "0px"
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, observerOptions);

        const revealElements = document.querySelectorAll('.reveal, .reveal-left');
        revealElements.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    return (
        <div className="min-h-screen font-sans text-white bg-[#050505] relative overflow-clip" style={{ zoom: 0.9 }}>
            {/* Background Texture */}
            <div className="bg-texture"></div>

            <CodeSnake />
            <LandingNavbar />

            <main className="relative z-10">
                <Hero />
                <StatsSection />
                <ServicesSection />
                <FeaturesSection />
                <HowItWorksSection />
                <SecurityStandardsSection />
                <SupportedLanguagesSection />
                <ComparisonSection />
                <RefactoringSection />
                <IntegrationSection />
                <PricingSection />
                <AboutUsSection />
                <CTASection />
            </main>

            <LandingFooter />
        </div>
    );
}
