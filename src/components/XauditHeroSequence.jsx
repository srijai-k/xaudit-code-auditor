import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/AuditX black no bg.png';
import crashImage from '../assets/google-crash.png';
import audioSrc from '../assets/audio.m4a';

export default function XauditHeroSequence({ children }) {
    // Start in 'init' unless already seen (persistent across sessions)
    const [phase, setPhase] = useState(() => {
        return localStorage.getItem('xaudit-intro-seen') ? 'hero' : 'init';
    });
    const [isMuted, setIsMuted] = useState(false); // Default: Sound ON (isMuted = false)
    const audioRef = useRef(null);

    const sentences = {
        sentence1: ['Tired', 'of', 'these', 'crashes?'],
        sentence2: ['Tired', 'of', 'these', 'errors?'],
        sentence3: ['Tired', 'of', 'shipping', 'broken', 'code?']
    };

    // User Explicit Start (Guarantees Audio Playback)
    const handleInitialize = () => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : 1.0;
            audioRef.current.muted = isMuted;
            audioRef.current.currentTime = 0;
            // We always play. If muted, it plays silently.
            audioRef.current.play().catch(e => {
                console.warn("Audio play failed:", e);
            });
        }
        setPhase('pre-glitch');
    };

    // ... Timer Logic ...
    useEffect(() => {
        let timer;

        if (phase === 'pre-glitch') {
            timer = setTimeout(() => setPhase('crash'), 1000);
        } else if (phase === 'crash') {
            timer = setTimeout(() => setPhase('sentence1'), 2000);
        } else if (phase === 'sentence1') {
            timer = setTimeout(() => setPhase('sentence2'), 2500);
        } else if (phase === 'sentence2') {
            timer = setTimeout(() => setPhase('sentence3'), 2500);
        } else if (phase === 'sentence3') {
            timer = setTimeout(() => setPhase('finale'), 3500);
        } else if (phase === 'finale') {
            timer = setTimeout(() => {
                setPhase('reveal');
            }, 2600);
        } else if (phase === 'reveal') {
            timer = setTimeout(() => {
                setPhase('hero');
                localStorage.setItem('xaudit-intro-seen', 'true');
            }, 2000);
        }

        return () => clearTimeout(timer);
    }, [phase]);

    // Cleanup
    useEffect(() => {
        return () => {
            // Only pause if unmounting the entire component
            // But usually we just let it play out or handle via phase logic
        };
    }, []);

    const skipIntro = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setPhase('hero');
        localStorage.setItem('xaudit-intro-seen', 'true');
    };

    // Render Helpers
    const renderInit = () => (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center overflow-hidden gap-8">
            <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleInitialize}
                className="px-10 py-4 bg-white text-black font-bold text-lg tracking-[0.2em] uppercase rounded-full hover:bg-gray-100 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] z-[100]"
            >
                Initialize System
            </motion.button>

            {/* Sound Toggle Slider */}
            <div
                onClick={() => setIsMuted(!isMuted)}
                className="flex items-center gap-4 cursor-pointer group select-none"
            >
                {/* Left Side: Sound Off (isMuted = true) */}
                <span className={`text-xs font-bold tracking-[0.2em] uppercase transition-colors duration-300 ${isMuted ? 'text-white' : 'text-white/30'}`}>
                    Sound Off
                </span>

                {/* Toggle Track */}
                <div className="relative w-14 h-7 rounded-full bg-white/10 p-1 transition-colors duration-300 group-hover:bg-white/20">
                    <motion.div
                        className="w-5 h-5 bg-white rounded-full shadow-lg"
                        animate={{ x: !isMuted ? 28 : 0 }} // !isMuted (On) -> Right (28)
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                </div>

                {/* Right Side: Sound On (isMuted = false) */}
                <span className={`text-xs font-bold tracking-[0.2em] uppercase transition-colors duration-300 ${!isMuted ? 'text-white' : 'text-white/30'}`}>
                    Sound On
                </span>
            </div>
        </div>
    );

    const renderCrash = () => (
        <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center overflow-hidden">
            <img src={crashImage} alt="Crash" className="w-full h-full object-cover" />
        </div>
    );

    const renderHero = () => (
        <div className="relative w-full min-h-screen">
            <motion.div
                initial={phase === 'hero' ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="w-full relative z-0"
            >
                {children}
            </motion.div>

            <AnimatePresence>
                {phase === 'reveal' && <TileGrid />}
            </AnimatePresence>
        </div>
    );

    const renderIntroSequence = () => (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center overflow-hidden">
            {/* Skip Button */}
            <button
                onClick={skipIntro}
                className="fixed bottom-8 right-8 text-white/70 hover:text-white hover:bg-white/10 px-4 py-2 rounded-full transition-all duration-300 z-[60] text-xs font-bold tracking-widest uppercase backdrop-blur-sm border border-white/10 hover:border-white/30"
            >
                Skip intro →
            </button>

            {/* Sentences */}
            <AnimatePresence mode='wait'>
                {phase === 'sentence1' && <Sentence key="s1" words={sentences.sentence1} />}
                {phase === 'sentence2' && <Sentence key="s2" words={sentences.sentence2} />}
                {phase === 'sentence3' && <Sentence key="s3" words={sentences.sentence3} />}
            </AnimatePresence>

            {/* Finale */}
            <AnimatePresence>
                {phase === 'finale' && <Finale />}
            </AnimatePresence>
        </div>
    );

    // Determines content based on phase
    const getContent = () => {
        if (phase === 'init') return renderInit();
        if (phase === 'crash') return renderCrash();
        if (phase === 'hero' || phase === 'initial' || phase === 'reveal' || phase === 'pre-glitch') return renderHero();
        return renderIntroSequence();
    };

    return (
        <>
            {/* TRULY PERSISTENT AUDIO: Outside all conditionals */}
            <audio
                ref={audioRef}
                src={audioSrc}
                preload="auto"
                loop={false}
                style={{ display: 'none' }} // Ensure it doesn't take layout space
            />

            {getContent()}
        </>
    );
}

function Sentence({ words }) {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.3 }
        },
        exit: {
            opacity: 0,
            transition: { staggerChildren: 0.1, staggerDirection: -1 }
        }
    };

    const wordVariants = {
        hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
        visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.3 } },
        exit: { opacity: 0, y: -20, filter: 'blur(10px)', transition: { duration: 0.3 } }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-wrap justify-center gap-3 md:gap-6 px-4 absolute z-10"
        >
            {words.map((word, i) => (
                <motion.span
                    key={i}
                    variants={wordVariants}
                    className="text-white text-5xl md:text-7xl font-medium tracking-tight font-sf"
                >
                    {word}
                </motion.span>
            ))}
        </motion.div>
    );
}

function Finale() {
    const textContainerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.2
            }
        },
        exit: { opacity: 0 }
    };

    const wordVariants = {
        hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
        visible: {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            transition: {
                duration: 0.8,
                ease: [0.2, 0.65, 0.3, 0.9] // Smooth, premium ease
            }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative flex items-center justify-center w-full h-full"
        >
            <div className="flex items-center justify-center">
                {/* Text Group */}
                <motion.div
                    variants={textContainerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex gap-4 md:gap-6 items-center z-10 whitespace-nowrap"
                >
                    <motion.span
                        variants={wordVariants}
                        className="text-white text-6xl md:text-8xl font-bold tracking-tighter font-sf"
                    >
                        USE
                    </motion.span>
                    <motion.span
                        variants={wordVariants}
                        className="text-white text-6xl md:text-8xl font-bold tracking-tighter font-sf"
                    >
                        XAUDIT
                    </motion.span>
                </motion.div>

                {/* Logo Wrapper */}
                <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 'auto', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ delay: 1.0, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden flex items-center"
                >
                    <div className="pl-4 md:pl-8">
                        <img
                            src={logo}
                            alt="Xaudit Logo"
                            className="h-16 md:h-24 w-auto object-contain min-w-[max-content]"
                        />
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}

function TileGrid() {
    // Vertical Columns ("Bar by bar")
    const cols = 10;
    const tiles = [];

    for (let c = 0; c < cols; c++) {
        tiles.push({ c, id: `col-${c}` });
    }

    return (
        <div
            className="fixed inset-0 z-[100] grid pointer-events-none"
            style={{
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gridTemplateRows: '1fr'
            }}
        >
            {tiles.map((tile) => (
                <motion.div
                    key={tile.id}
                    initial={{ scaleY: 1 }}
                    animate={{ scaleY: 0 }}
                    transition={{
                        duration: 1.2, // Longer to show the ease
                        ease: [0.83, 0, 0.17, 1], // Strong EaseInOut (Quart/Quint-like) for "Speed Ramp" feel
                        delay: tile.c * 0.05 // Tighter stagger
                    }}
                    style={{ transformOrigin: 'top' }} // Shrink upwards ("Down to top" reveal)
                    className="bg-black w-full h-full border-r-[0.5px] border-black"
                />
            ))}
        </div>
    );
}
