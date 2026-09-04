import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function PageTransition({ children }) {
    const location = useLocation();
    const [displayLocation, setDisplayLocation] = useState(location);
    const [transitionStage, setTransitionStage] = useState('fadeIn');

    useEffect(() => {
        if (location.pathname !== displayLocation.pathname) {
            setTransitionStage('fadeOut');
        }
    }, [location, displayLocation]);

    const handleAnimationEnd = () => {
        if (transitionStage === 'fadeOut') {
            setDisplayLocation(location);
            setTransitionStage('fadeIn');
            if (!location.hash) {
                window.scrollTo({ top: 0, behavior: 'instant' });
            }
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
