
import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, animate } from 'framer-motion';

export default function CodeSnake() {
    const [pathD, setPathD] = useState('');
    const { scrollYProgress } = useScroll();

    // 1. Scroll-based movement (0% -> 80% as you scroll down)
    const scrollOffset = useTransform(scrollYProgress, [0, 1], [0, 80]);
    const smoothScrollOffset = useSpring(scrollOffset, { stiffness: 50, damping: 20 });

    // 2. Entrance Animation (Starts at -100% and slides to 0%)
    const entranceOffset = useMotionValue(-100);
    const opacity = useMotionValue(0);

    useEffect(() => {
        // Animate entrance after a slight delay
        const controls = animate(entranceOffset, 0, {
            duration: 1.5,
            ease: "circOut",
            delay: 0.1
        });
        const opacityControls = animate(opacity, 1, {
            duration: 0.8,
            ease: "easeOut",
            delay: 0
        });
        return () => { controls.stop(); opacityControls.stop(); };
    }, []);

    // 3. Combine offsets using a custom transform
    // We can't use useMotionTemplate purely because we need to add the numbers
    const finalStartOffset = useTransform(
        [smoothScrollOffset, entranceOffset],
        ([s, e]) => `${s + e}%`
    );

    useEffect(() => {
        const updatePath = () => {
            const width = window.innerWidth;
            // Provide enough height for standard scroll depth, or check document height
            // Using a fixed large height for the path to ensure it covers most sections
            const height = Math.max(document.body.scrollHeight, 4000);

            // Path Logic:
            // Start Top Right (Hero)
            // Curve to Left (Stats/Features)
            // Curve to Right (Comparison)
            // Curve to Left (Integration)
            // ... vertically down

            const startX = width * 0.9;
            const startY = 50;

            const amplitude = width * 0.35; // How wide the snake swings
            const frequency = 800; // Vertical distance between peaks

            let d = `M ${startX} ${startY}`;

            // Generate a sine-wave like path going down
            // But we need bezier curves for smoothness.

            // Simple approach: Series of Cubic Beziers
            // C cp1x cp1y, cp2x cp2y, x y
            // We want to go from Right -> Left -> Right -> Left

            let currentY = startY;
            let currentX = startX;
            let direction = -1; // -1 for moving left, 1 for moving right

            while (currentY < height) {
                const destinationY = currentY + frequency;
                const destinationX = width / 2 + (direction * amplitude);

                // Control points for smooth vertical transition
                const cp1x = currentX;
                const cp1y = currentY + (frequency / 2);

                const cp2x = destinationX;
                const cp2y = destinationY - (frequency / 2);

                d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${destinationX} ${destinationY}`;

                currentY = destinationY;
                currentX = destinationX;
                direction *= -1; // Switch side
            }

            setPathD(d);
        };

        window.addEventListener('resize', updatePath);
        updatePath(); // Initial call

        // Also update after a short delay to ensure DOM is fully rendered height-wise
        setTimeout(updatePath, 1000);

        return () => window.removeEventListener('resize', updatePath);
    }, []);

    if (!pathD) return null;

    return (
        <motion.div
            style={{ opacity }}
            className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden mix-blend-screen opacity-80"
        >
            <svg width="100%" height="100%" className="overflow-visible">
                <defs>
                    <path id="globalSnakePath" d={pathD} fill="none" stroke="white" strokeOpacity="0" strokeWidth="1" />
                </defs>

                <text className="font-mono text-sm font-bold tracking-widest uppercase" dy="-10">
                    <motion.textPath href="#globalSnakePath" startOffset={finalStartOffset}>
                        {/* Illustrative examples of patterns this checker flags — not a live scan, not an enforcement system. */}
                        <tspan fill="#ef4444">db.query("... WHERE id = " + id)</tspan>
                        <tspan fill="#6b7280" dx="30"> // POSSIBLE SQL INJECTION </tspan>
                        <tspan fill="#eab308" dx="60"> [ FLAGGED ] </tspan>
                        <tspan fill="#22c55e" dx="60"> db.query("... WHERE id = $1", [id])</tspan>
                        <tspan fill="#6b7280" dx="30"> // SAFER EXAMPLE </tspan>

                        <tspan fill="#6b7280" dx="150"> ... </tspan>

                        <tspan fill="#ef4444" dx="150">el.innerHTML = user.bio;</tspan>
                        <tspan fill="#6b7280" dx="30"> // UNSANITIZED HTML SINK </tspan>
                        <tspan fill="#eab308" dx="60"> [ FLAGGED ] </tspan>
                        <tspan fill="#22c55e" dx="60"> el.innerHTML = DOMPurify.sanitize(user.bio);</tspan>
                        <tspan fill="#6b7280" dx="30"> // SAFER EXAMPLE </tspan>

                        <tspan fill="#6b7280" dx="150"> ... </tspan>

                        <tspan fill="#ef4444" dx="150">const apiKey = "sk-live-...";</tspan>
                        <tspan fill="#6b7280" dx="30"> // HARDCODED SECRET </tspan>
                        <tspan fill="#eab308" dx="60"> [ FLAGGED ] </tspan>
                        <tspan fill="#22c55e" dx="60"> const apiKey = process.env.API_KEY;</tspan>
                        <tspan fill="#6b7280" dx="30"> // SAFER EXAMPLE </tspan>

                        <tspan fill="#6b7280" dx="150"> ... </tspan>

                        <tspan fill="#fff" dx="150"> // findings are patterns to review, not confirmed vulnerabilities — a clean result is not proof of security</tspan>

                        {/* Repeat content to ensure it covers long scrolls */}
                        <tspan fill="#ef4444" dx="150">eval(userExpression);</tspan>
                        <tspan fill="#6b7280" dx="30"> // DYNAMIC EXECUTION </tspan>
                        <tspan fill="#eab308" dx="60"> [ FLAGGED ] </tspan>
                        <tspan fill="#22c55e" dx="60"> JSON.parse(userExpression);</tspan>
                    </motion.textPath>
                </text>
            </svg>
        </motion.div>
    );
}
