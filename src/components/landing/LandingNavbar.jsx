
import React from 'react';
import { useNavigate } from 'react-router-dom';
import logoXa from '../../assets/logo-xa.png';

export default function LandingNavbar({ isScanning, onStartScan }) {
    // Navigate is now handled by parent

    return (
        <nav className="fixed w-full z-50 backdrop-blur-md bg-black/50 border-b border-white/10">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {/* Logo Image with Animation */}
                    <img
                        src={logoXa}
                        alt="XA Logo"
                        className={`w-10 h-10 object-contain mix-blend-screen transition-all duration-300 ${isScanning ? 'animate-logo-spin scale-125 brightness-150' : ''}`}
                    />
                    <span className="text-2xl font-bold tracking-tighter">XAUDIT</span>
                </div>

                <div className="hidden md:flex items-center gap-8">
                    <a href="#features" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">FEATURES</a>
                    <a href="#how-it-works" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">HOW IT WORKS</a>
                    <a href="#pricing" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">PRICING</a>
                </div>

                <div className="flex items-center gap-4">
                    {/* Sign In Removed */}
                    <button
                        onClick={onStartScan}
                        className="clip-angle-button bg-white text-black px-6 py-2.5 font-bold text-sm hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                        START AUDIT
                    </button>
                </div>
            </div>
        </nav>
    );
}
