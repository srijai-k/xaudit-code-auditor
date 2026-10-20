import { useEffect } from 'react';
import Lenis from 'lenis';

// The one Lenis instance, so other code (the page transition's
// scroll-to-top) can move it. Lenis keeps its own idea of where the page is
// scrolled to; a plain window.scrollTo() behind its back can get eased right
// back to the old spot on its next frame.
let current = null;

/** The running Lenis instance, or null before it starts / after it stops. */
export function getLenis() {
    return current;
}

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
        current = lenis;

        let frameId;
        const raf = (time) => {
            lenis.raf(time);
            frameId = requestAnimationFrame(raf);
        };
        frameId = requestAnimationFrame(raf);

        return () => {
            cancelAnimationFrame(frameId);
            lenis.destroy();
            if (current === lenis) current = null;
        };
    }, []);
}
