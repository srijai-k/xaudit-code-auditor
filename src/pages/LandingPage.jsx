import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingNavbar from '../components/landing/LandingNavbar';
import Hero from '../components/landing/Hero';
import logoXa from '../assets/logo-xa.png';
import StatsSection from '../components/landing/StatsSection';
import ServicesSection from '../components/landing/ServicesSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import ComparisonSection from '../components/landing/ComparisonSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import SecurityStandardsSection from '../components/landing/SecurityStandardsSection';
import SupportedLanguagesSection from '../components/landing/SupportedLanguagesSection';
import AboutUsSection from '../components/landing/AboutUsSection';
import RefactoringSection from '../components/landing/RefactoringSection';
import PricingSection from '../components/landing/PricingSection';
import FAQ from '../components/landing/FAQ';
import CTASection from '../components/landing/CTASection';
import LandingFooter from '../components/landing/LandingFooter';
import CodeSnake from '../components/landing/CodeSnake';

export default function LandingPage() {
    const navigate = useNavigate();
    const [isScanning, setIsScanning] = useState(false);

    const handleStartScan = () => {
        setIsScanning(true);
        // Delay navigation to show animation
        setTimeout(() => {
            navigate('/check');
        }, 2000);
    };

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
        <div className="min-h-screen font-sans text-white bg-[#050505] relative overflow-clip" style={{ zoom: 0.95 }}>
            {/* Background Texture */}
            <div className="bg-texture"></div>

            {/* Centered Logo Animation Overlay */}
            <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-xl transition-all duration-500 ${isScanning ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <img
                    src={logoXa}
                    alt="Scanning..."
                    className={`w-32 h-32 object-contain mix-blend-screen ${isScanning ? 'animate-logo-spin' : ''}`}
                />
            </div>

            <CodeSnake />
            <LandingNavbar isScanning={isScanning} onStartScan={handleStartScan} />

            <main className="relative z-10">
                <Hero onStartScan={handleStartScan} />
                <StatsSection />
                <ServicesSection />
                <FeaturesSection />
                <HowItWorksSection />
                <SecurityStandardsSection />
                <SupportedLanguagesSection />
                <ComparisonSection />
                <RefactoringSection />
                <PricingSection onStartScan={handleStartScan} />
                <FAQ />
                <AboutUsSection />
                <CTASection />
            </main>

            <LandingFooter />
        </div>
    );
}
