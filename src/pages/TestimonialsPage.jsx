import React, { useRef, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import { Quote, MoveVertical } from 'lucide-react';
import { TopTicker, HeaderNav } from '../components/Navbar';
import { WorksWheel } from '@/components/ui/works-wheel';
import { TESTIMONIALS } from '../data/testimonials';
import '../landing.css';

// The wheel turns on wheel/drag input inside its own frame, which is great
// with a mouse and a trap on a touchscreen (vertical swipes turn the drum
// instead of scrolling the page). So it only renders where there's a fine
// pointer and room for a readable card; everything else gets the same quotes
// as a plain stack.
const WHEEL_QUERY = '(min-width: 1024px) and (min-height: 620px) and (pointer: fine)';

function subscribeToWheelQuery(onChange) {
    const query = window.matchMedia(WHEEL_QUERY);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
}

function useWheelLayout() {
    return useSyncExternalStore(
        subscribeToWheelQuery,
        () => window.matchMedia(WHEEL_QUERY).matches,
        () => false,
    );
}

function QuoteCard({ testimonial, index }) {
    return (
        <div className={`quote-card ${index % 2 ? 'is-cream' : 'is-lav'}`}>
            <div className="quote-card-head">
                <img className="quote-card-face" src={testimonial.face} alt="" draggable={false} decoding="async" />
                <Quote className="quote-card-mark" aria-hidden="true" />
            </div>
            <p className="quote-card-text">{testimonial.quote}</p>
            <div className="quote-card-by">
                <b>{testimonial.name}</b>
                <span>{testimonial.credit}</span>
            </div>
        </div>
    );
}

// Scrolling one ~65vh step turns one quote to the front (plus a quarter step
// so the last one holds as long as the rest); the pin's own height on top.
// 128px is the sticky ticker + header the pin sits under (see landing.css).
const STEP_VH = 65;
const TRACK_HEIGHT = `calc(100vh - 128px + ${(TESTIMONIALS.length + 0.25) * STEP_VH}vh)`;

const WHEEL_ITEMS = TESTIMONIALS.map((t, i) => ({
    title: t.name,
    meta: t.credit,
    avatar: t.face,
    content: <QuoteCard testimonial={t} index={i} />,
}));

export default function TestimonialsPage() {
    const navigate = useNavigate();
    const showWheel = useWheelLayout();
    const trackRef = useRef(null);

    return (
        <div className="landing-wrapper">
            <TopTicker />
            <main className="page-shell">
                <HeaderNav />

                {/* overflow: clip instead of hidden (see .page-shell-body.has-pin)
                    so the wheel's sticky pin can stick to the viewport. */}
                <div className={`page-shell-body${showWheel ? ' has-pin' : ''}`}>
                    <section className="quotes-hero">
                        <p className="eyebrow purple text-fade-in stagger-1"><span></span>Testimonials</p>
                        <h1 className="text-fade-in stagger-2">I asked a few people to try it. Here's what they said.</h1>
                        <p className="hero-copy text-fade-in stagger-3">
                            Six alumni of Carnegie Mellon University, the University of North Carolina at Chapel Hill and Harvard University used XAUDIT and wrote down what they thought. Everything here is in their own words.
                        </p>
                    </section>

                    {showWheel ? (
                        // The track is tall on purpose: scrolling through it is
                        // what turns the wheel, and the pin holds the wheel on
                        // screen until the last quote has come round. Nothing
                        // below is reachable before that.
                        <section ref={trackRef} className="quote-wheel-track" style={{ height: TRACK_HEIGHT }} aria-label="Testimonials">
                            <div className="quote-wheel-pin">
                                <div className="quote-wheel-shell">
                                    <WorksWheel
                                        items={WHEEL_ITEMS}
                                        label="What people said"
                                        action={undefined}
                                        scrollTrack={trackRef}
                                        className="quote-wheel"
                                        cardClassName="rounded-[26px] bg-transparent shadow-[0_34px_60px_-26px_rgba(0,0,0,0.85)]"
                                        geometry={{ cardHeight: 0.62, cardMaxWidth: 0.46, cardRatio: 1.5, title: 0.085, text: 0.046, ringRadius: 0.56 }}
                                    />
                                    <div className="shape-notch bottom"></div>
                                </div>
                                <p className="quote-wheel-hint">
                                    <MoveVertical size={16} aria-hidden="true" />
                                    Keep scrolling to turn it. The names on the right jump straight to one.
                                </p>
                            </div>
                        </section>
                    ) : (
                        <section className="quote-stack" aria-label="Testimonials">
                            {TESTIMONIALS.map((t, i) => (
                                <QuoteCard key={t.name} testimonial={t} index={i} />
                            ))}
                        </section>
                    )}

                    <footer>
                        <div className="footer-cta">
                            <h2>Paste some code and see what it finds.</h2>
                            <button className="cta dark" onClick={() => navigate('/check')}>
                                <span>+</span> Start Audit
                            </button>
                        </div>
                        <div className="footer-bottom">
                            <span>XAUDIT</span>
                            <span>Runs in your browser · nothing uploaded</span>
                            <span>PDF / SARIF / JSON</span>
                        </div>
                    </footer>
                </div>
            </main>
        </div>
    );
}
