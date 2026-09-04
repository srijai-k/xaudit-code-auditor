import { useEffect } from 'react';
import Lenis from 'lenis';

// Wires up Lenis's own requestAnimationFrame loop — this is the library's
// standard integration pattern, not tied to any one site. Duration/easing
// are our own tuning, not copied from anywhere.
export default function useSmoothScroll() {
    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.1,
            easing: (t) => 1 - Math.pow(1 - t, 3), // ease-out cubic
            smoothWheel: true,
        });

        let frameId;
        const raf = (time) => {
            lenis.raf(time);
            frameId = requestAnimationFrame(raf);
        };
        frameId = requestAnimationFrame(raf);

        return () => {
            cancelAnimationFrame(frameId);
            lenis.destroy();
        };
    }, []);
}
