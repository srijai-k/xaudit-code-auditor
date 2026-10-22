import React, { useEffect, useLayoutEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getLenis } from '../hooks/useSmoothScroll';

export default function PageTransition({ children }) {
    const location = useLocation();
    const [displayLocation, setDisplayLocation] = useState(location);
    const [transitionStage, setTransitionStage] = useState('fadeIn');

    // A new page starts at the top - before it paints, not after the fade-in
    // finishes (that used to show the new page at the old scroll position for
    // the length of the animation, then jump). Lenis is reset too: it tracks
    // the scroll position itself and would otherwise ease back toward the old
    // spot. Links to a #section are left alone so they can scroll to it.
    useLayoutEffect(() => {
        if (location.hash) return;
        getLenis()?.scrollTo(0, { immediate: true, force: true });
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, [location.pathname, location.hash]);

    useEffect(() => {
        if (location.pathname !== displayLocation.pathname) {
            setTransitionStage('fadeOut');
        }
    }, [location, displayLocation]);

    const handleAnimationEnd = () => {
        if (transitionStage === 'fadeOut') {
            setDisplayLocation(location);
            setTransitionStage('fadeIn');
        }
    };

    return (
        <div
            key={location.pathname}
            className={`page-transition-container ${transitionStage}`}
            onAnimationEnd={handleAnimationEnd}
        >
            {children}
        </div>
    );
}
