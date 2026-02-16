import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import logoXa from '../assets/logo-xa.png';

export default function Navbar({ activeView: propView, onViewChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  // Determine active view from location if not provided
  const activeView = propView || (location.pathname.includes('history') ? 'history' : location.pathname.includes('report') ? 'report' : 'audit');
  const [hoverData, setHoverData] = useState(null);

  return (
    <nav className="sticky top-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

        {/* Branding - Left */}
        <div className="flex items-center gap-3 cursor-pointer group z-20">
          <Link to="/" className="flex items-center gap-3 group">
            <img src={logoXa} alt="AuditX" className="h-10 object-contain mix-blend-screen transition-transform group-hover:scale-105" />
            <span className="text-xl font-bold tracking-tighter text-white">XAUDIT</span>
          </Link>
        </div>

        {/* Central Navigation Pill */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center bg-white/5 p-1.5 backdrop-blur-sm cyber-shape">
          {['audit', 'history'].map((tab) => {
            const isActive = (activeView === tab);
            // Visual state: prioritize hover if present, otherwise active
            const isHighlight = hoverData ? hoverData === tab : isActive;

            return (
              <button
                key={tab}
                onMouseEnter={() => setHoverData(tab)}
                onMouseLeave={() => setHoverData(null)}
                onClick={() => navigate(tab === 'audit' ? '/audit' : '/audit/history')}
                className={`relative px-8 py-2.5 text-sm font-bold transition-all z-10`}
              >
                {isHighlight && (
                  <motion.div
                    layoutId="nav-pill"
                    className={`absolute inset-0 z-0 cyber-shape ${isHighlight ? 'bg-white' : 'bg-white/10'}`}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span
                  className="relative z-10 font-bold"
                  style={{ color: isHighlight ? '#000000' : '#FFFFFF' }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </span>
              </button>
            );
          })}
        </div>

      </div>
    </nav>
  );
}
