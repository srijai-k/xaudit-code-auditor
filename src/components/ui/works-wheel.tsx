"use client";

// A portfolio index built as a wheel you turn.
//
// At rest the work sits in a ring around a title, each card tangent to the
// circle. The first notch of scroll blows the ring open into a vertical drum:
// the card at the front lies flat and full size, the ones above and below
// rotate away into hard perspective and run off the top and bottom of the
// frame. Keep turning and the drum carries the next piece round to the front.
//
// The whole thing is one number - `turn` - read by a single rAF pass that writes
// transforms straight to the DOM. 0 is the ring, 1 is the drum with item 0 at
// the front, and every whole number after that is one more item turned past.
//
// XAUDIT additions (everything else is the stock component):
//   - `content` renders any card face in place of an image, so the wheel can
//     carry text (the testimonials page uses it for quotes). Cards get a font
//     size proportional to their own height, so content sized in `em` scales
//     with the wheel instead of overflowing it.
//   - `meta` puts a second line under the front-card title, and `avatar` a
//     small image above it.
//   - `geometry` overrides the card proportions and ring radius, for content
//     that needs a bigger or squarer card than cover art does.
//   - `cardClassName` restyles the card shell (radius, shadow, background).
//   - The front-card title is capped to the space left of the card, so a long
//     name wraps instead of running under it.
//   - The wheel settles in the direction it was turned. The stock version
//     rounded to the nearest item, which undid every slow notch of a stepped
//     mouse wheel - see settleTurn.
//   - While the wheel holds the scroll it opts out of Lenis-style smooth
//     scrolling, which otherwise scrolls the page underneath it - see onWheel.
//   - `scrollTrack` turns the wheel from the page's own scroll instead of
//     capturing the wheel itself: the page pins the wheel inside a tall track
//     and the reader's progress down the track is the turn. Nothing below the
//     track can be reached without turning through every item first, and it
//     works the same from a wheel, trackpad, scrollbar or keyboard.
import * as React from "react";

import { cn } from "@/lib/utils";

export interface WorksWheelItem {
  /** Project name. Shown beside the front card and in the index. */
  title: string;
  /** Cover art. Any src an <img> takes. Ignored when `content` is set. */
  image?: string;
  /** Card face to render instead of `image`. Size it in `em` to scale with the card. */
  content?: React.ReactNode;
  /** Second line under the front-card title. */
  meta?: string;
  /** Small image shown above the front-card title (a face, a logo). Decorative: the title names it. */
  avatar?: string;
  /** Where the card links to. Omit for a wheel that only browses. */
  href?: string;
}

export interface WorksWheelGeometry {
  /** Front card height, as a fraction of the stage. @default 0.38 */
  cardHeight: number;
  /** Front card width is never more than this fraction of the stage. @default 0.34 */
  cardMaxWidth: number;
  /** Card width / height. @default 1.45 */
  cardRatio: number;
  /** Ring label and front-card title, in card heights. @default 0.124 */
  title: number;
  /** Card font size, in card heights. Content sized in `em` follows it. @default 0.045 */
  text: number;
  /** Ring radius, in card heights. Lower it for a few big cards, so the ring fits the frame. @default 1.14 */
  ringRadius: number;
}

export interface WorksWheelProps extends Omit<
  React.ComponentPropsWithoutRef<"section">,
  "children"
> {
  items: WorksWheelItem[];
  /** Sits in the middle of the ring. @default undefined */
  label?: string;
  /** Label on the card's hover affordance. Omit to drop it. @default undefined */
  action?: string;
  /** Overrides for the card proportions. */
  geometry?: Partial<WorksWheelGeometry>;
  /** Extra classes for each card's shell. Merged over the defaults. */
  cardClassName?: string;
  /** Scroll-driven mode: a tall element whose FIRST CHILD is a `position:
      sticky` pin holding this wheel. The wheel turns with the page's scroll
      through it, and stops capturing wheel and drag input of its own. */
  scrollTrack?: React.RefObject<HTMLElement | null>;
}

/* Geometry. The card is measured against the stage; everything else is measured
   against the card, so a narrow stage - where the card is capped by width, not
   height - scales the whole wheel down with it instead of leaving a small card
   swinging on a huge drum. The three that matter are tuned together: STEP
   against DRUM sets how hard the neighbours rotate away, and DRUM against LENS
   decides whether they land inside the frame or run off it. */
const DEFAULT_GEOMETRY: WorksWheelGeometry = {
  cardHeight: 0.38, // front card height, of the stage
  cardMaxWidth: 0.34, // ... but never wider than this much of the stage
  cardRatio: 1.45, // card width / height
  title: 0.124, // ring label and front-card title
  text: 0.045, // card font size
  ringRadius: 1.14, // ring radius
};
const STEP = 40; // degrees between cards on the drum
const DRUM = 2.22; // drum radius, in card heights - and everything below likewise
const LENS = 2.7; // perspective distance
/* The drum alone hangs the work on a plumb line. It isn't one: the strip curves
   away round an arc whose centre sits off to the LEFT, so the piece at the front
   is at the arc's near point - dead centre - and its neighbours have already
   swung back left as well as up and down. BOW is that arc's radius; nothing else
   makes the difference between a stack of cards and a wheel seen side on. */
const BOW = 1.82;
const INDEX = 0.04; // the index down the right-hand side
/** Items either side of the front still worth drawing. Past this a card is
    edge-on, and further round it would stack up on the vanishing point. */
const CULL = 1.6;

/** How much of a wheel-notch or a dragged pixel counts as one item. */
const WHEEL_UNITS = 900;
const DRAG_UNITS = 420;
/** Quiet time after the last wheel event before the wheel settles on an item. */
const SETTLE = 140;
/** Fraction of the remaining distance closed each frame. 1 = no smoothing. */
const EASE = 0.12;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Stage = { w: number; h: number };

/** Where a wheel gesture comes to rest. It goes on to the next item in the
    direction it was turned, not to the nearest: one notch of a stepped mouse
    wheel is a fraction of an item, and rounding to the nearest pulls every slow
    notch back where it came from - the wheel never turns, and since it is still
    mid-range it keeps cancelling the page scroll too. A nudge too small to mean
    anything just snaps back. */
export function settleTurn(target: number, gestureFrom: number) {
  const moved = target - gestureFrom;
  if (Math.abs(moved) < 0.02) return Math.round(target);
  return moved > 0 ? Math.ceil(target) : Math.floor(target);
}

/** Share of each step of a scroll-driven wheel spent holding still on either
    side of a whole turn, so every item sits flat at the front for a stretch of
    scrolling instead of only passing through it. */
const DWELL = 0.25;

/** Scroll-driven mode: how far round the wheel is, for a 0-1 progress down the
    track. `stops` is the number of steps from the ring to the last item. The
    track runs a DWELL past the last item so it holds as long as the others
    before the page lets go. */
export function turnForScroll(progress: number, stops: number) {
  const raw = clamp(progress, 0, 1) * (stops + DWELL);
  const k = Math.floor(raw);
  if (k >= stops) return stops;
  const t = clamp((raw - k - DWELL) / (1 - 2 * DWELL), 0, 1);
  return k + t * t * (3 - 2 * t);
}

/** Progress down a scroll track that lines up with turn `n` exactly. */
export const scrollForTurn = (n: number, stops: number) =>
  stops ? clamp(n / (stops + DWELL), 0, 1) : 0;

const rad = (deg: number) => (deg * Math.PI) / 180;

/** How far left the arc has carried something that has turned `drumDeg` off the
    front. Zero at the front, so the piece being read stays centred. */
const bowAt = (drumDeg: number, bow: number) =>
  -bow * (1 - Math.cos(rad(drumDeg)));

/** Both states in one chain: the ring terms fall away as `m` reaches the drum,
    and the drum terms are still zero while the ring is up. The bow is applied
    first, in the wheel's own plane, so it slides the card sideways rather than
    turning with it - and perspective still shrinks it with distance. */
function place(
  ringDeg: number,
  drumDeg: number,
  ringR: number,
  drumR: number,
  bow: number,
  m: number,
) {
  return (
    `translateX(${m * bowAt(drumDeg, bow)}px)` +
    ` rotateZ(${(1 - m) * ringDeg}deg) translateY(${-(1 - m) * ringR}px)` +
    ` rotateX(${m * drumDeg}deg) translateZ(${m * drumR}px)`
  );
}

export function WorksWheel({
  items,
  label = "Works '26",
  action = "View",
  geometry,
  cardClassName,
  scrollTrack,
  className,
  ...props
}: WorksWheelProps) {
  const stageRef = React.useRef<HTMLDivElement>(null);
  const wheelRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLElement | null)[]>([]);
  const labelRef = React.useRef<HTMLDivElement>(null);
  const titleRef = React.useRef<HTMLDivElement>(null);
  const drag = React.useRef<number | null>(null);
  const settling = React.useRef(0);
  const gestureFrom = React.useRef(0);

  // The wheel's position, and where it is heading. Only `active` is state -
  // everything else is written to the DOM, so turning the wheel is not a render.
  const turn = React.useRef(0);
  const target = React.useRef(0);
  const [active, setActive] = React.useState(0);
  const [stage, setStage] = React.useState<Stage>({ w: 0, h: 0 });

  const count = items.length;
  const last = Math.max(count - 1, 0);

  // Read after mount, not during render: the server has no matchMedia, and
  // branching on it inline is a hydration mismatch. Reduced motion drops the
  // easing, so the wheel lands where it is put instead of gliding there.
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = () => setReduced(query.matches);
    read();
    query.addEventListener("change", read);
    return () => query.removeEventListener("change", read);
  }, []);

  React.useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const read = () => setStage({ w: el.clientWidth, h: el.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { cardHeight, cardMaxWidth, cardRatio, title, text, ringRadius } = {
    ...DEFAULT_GEOMETRY,
    ...geometry,
  };

  const metrics = React.useMemo(() => {
    const { w, h } = stage;
    const cardW = Math.min(h * cardHeight * cardRatio, w * cardMaxWidth);
    const cardH = cardW / cardRatio;
    const drumR = cardH * DRUM;
    const ringR = cardH * ringRadius;
    // Shrink the ring's cards until the circle reads as a closed loop rather
    // than beads on a wire, however many pieces the wheel is given.
    const ringScale = count
      ? clamp((((2 * Math.PI * ringR) / count) * 0.82) / (cardW || 1), 0.16, 1)
      : 1;
    return {
      cardW,
      cardH,
      ringR,
      ringScale,
      drumR,
      bow: cardH * BOW,
      depth: cardH * LENS,
      title: cardH * title,
      text: cardH * text,
      index: cardH * INDEX,
      // Room between the front-title's left edge (8% in) and the card, less a gutter.
      titleRoom: Math.max(w / 2 - cardW / 2 - w * 0.08 - cardH * 0.12, 0),
    };
  }, [stage, count, cardHeight, cardMaxWidth, cardRatio, title, text, ringRadius]);

  // One pass per frame: ease toward the target, then write every transform.
  React.useEffect(() => {
    if (!stage.h) return;
    let frame = 0;
    const { ringR, ringScale, drumR, bow } = metrics;

    const draw = () => {
      frame = requestAnimationFrame(draw);
      const gap = target.current - turn.current;
      if (Math.abs(gap) < 0.0005) turn.current = target.current;
      else turn.current += gap * (reduced ? 1 : EASE);

      const t = turn.current;
      const m = clamp(t, 0, 1);
      const pos = Math.max(0, t - 1);

      // The drum is pulled back so its front face lands on the picture plane.
      // That set-back has to arrive with the drum, or the ring would sit at the
      // far side of the perspective and render at half its size.
      if (wheelRef.current) {
        wheelRef.current.style.transform = `translateZ(${-m * drumR}px)`;
      }

      for (let i = 0; i < count; i++) {
        const d = i - pos;
        const drumDeg = d * STEP;
        const card = cardRefs.current[i];
        if (card) {
          card.style.transform = place(
            d * (360 / count),
            drumDeg,
            ringR,
            drumR,
            bow,
            m,
          );
          // Culled by distance, not by angle: at a full turn the far side comes
          // back round to face us, and everything past the neighbours lands on
          // the vanishing point in a heap.
          card.style.opacity = m > 0.5 && Math.abs(d) > CULL ? "0" : "1";
          card.style.zIndex = String(Math.round(100 - Math.abs(d) * 2));
        }
        const face = card?.firstElementChild as HTMLElement | null;
        if (face) face.style.transform = `scale(${lerp(ringScale, 1, m)})`;
      }

      if (labelRef.current) labelRef.current.style.opacity = String(1 - m);
      if (titleRef.current) titleRef.current.style.opacity = String(m);
      const near = clamp(Math.round(pos), 0, last);
      setActive((prev) => (prev === near ? prev : near));
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [metrics, stage.h, count, last, reduced]);

  const to = React.useCallback(
    (next: number) => {
      target.current = clamp(next, 0, last + 1);
    },
    [last],
  );

  const scrollDriven = Boolean(scrollTrack);

  // Scroll-driven mode. The pin's offset inside the track is how far the
  // reader has scrolled through it - 0 when it first sticks, the track's
  // height less the pin's when it lets go - and that fraction is the turn.
  React.useEffect(() => {
    if (!scrollTrack) return;
    const read = () => {
      const track = scrollTrack.current;
      const pin = track?.firstElementChild as HTMLElement | null;
      if (!track || !pin) return;
      const range = track.offsetHeight - pin.offsetHeight;
      if (range <= 0) return;
      const offset =
        pin.getBoundingClientRect().top - track.getBoundingClientRect().top;
      target.current = turnForScroll(offset / range, last + 1);
    };
    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => {
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, [scrollTrack, last]);

  /** Go to turn `n`: directly, or by scrolling the page to it when the page drives the wheel. */
  const goTo = React.useCallback(
    (n: number) => {
      const track = scrollTrack?.current;
      const pin = track?.firstElementChild as HTMLElement | null;
      if (!track || !pin) return to(n);
      const range = track.offsetHeight - pin.offsetHeight;
      const top = track.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: top + range * scrollForTurn(clamp(n, 0, last + 1), last + 1),
        behavior: reduced ? "auto" : "smooth",
      });
    },
    [scrollTrack, to, last, reduced],
  );

  // Native listener, because the wheel has to be cancellable - and it only
  // cancels while it still has somewhere to go, so the page scrolls on at
  // either end instead of trapping the reader.
  React.useEffect(() => {
    const el = stageRef.current;
    if (!el || scrollDriven) return;
    const onWheel = (event: WheelEvent) => {
      // Where this gesture started, so the settle below knows which way it went.
      if (!settling.current) gestureFrom.current = target.current;
      const next = target.current + event.deltaY / WHEEL_UNITS;
      const captured = next > 0 && next < last + 1;
      if (captured) event.preventDefault();
      // Smooth-scroll libraries (Lenis, which this site runs) listen on the
      // window and scroll the page on every wheel event whether or not it was
      // cancelled - so the page would slide away while the wheel turned. Lenis
      // checks this attribute on the event path when the event reaches it,
      // which is after this handler, so it can be flipped per event.
      el.toggleAttribute("data-lenis-prevent-wheel", captured);
      to(next);
      // A wheel gesture arrives as a burst of events with no end of its own, so
      // the rest position is whatever notch it happened to stop on. Left there
      // the drum sits between two cards - nothing at the front, and the pair
      // either side of the gap both turned half away. Settle onto an item -
      // the next one in the direction it was turned (see settleTurn).
      window.clearTimeout(settling.current);
      settling.current = window.setTimeout(() => {
        settling.current = 0;
        to(settleTurn(target.current, gestureFrom.current));
      }, SETTLE);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      window.clearTimeout(settling.current);
    };
  }, [to, last, scrollDriven]);

  return (
    <section
      aria-label={label}
      className={cn(
        "bg-background text-foreground relative h-full min-h-[24rem] w-full overflow-hidden select-none",
        className,
      )}
      {...props}
    >
      <div
        ref={stageRef}
        tabIndex={0}
        role="listbox"
        aria-label={label}
        aria-activedescendant={`works-wheel-${active}`}
        className={cn(
          "focus-visible:outline-foreground absolute inset-0 outline-none focus-visible:outline-2 focus-visible:-outline-offset-4",
          !scrollDriven && "cursor-grab touch-pan-x active:cursor-grabbing",
        )}
        style={{ perspective: `${metrics.depth}px` }}
        onPointerDown={(event) => {
          if (scrollDriven) return;
          drag.current = event.clientY;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (drag.current === null) return;
          to(target.current + (drag.current - event.clientY) / DRAG_UNITS);
          drag.current = event.clientY;
        }}
        onPointerUp={() => {
          // Land on an item rather than between two.
          drag.current = null;
          if (target.current > 1) to(Math.round(target.current));
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") goTo(Math.round(target.current) + 1);
          else if (event.key === "ArrowUp") goTo(Math.round(target.current) - 1);
          else return;
          event.preventDefault();
        }}
      >
        <div
          ref={wheelRef}
          className="absolute top-1/2 left-1/2 [transform-style:preserve-3d]"
        >
          {items.map((item, i) => {
            const Tag = (item.href ? "a" : "div") as "a";
            return (
              <React.Fragment key={item.title}>
                <Tag
                  id={`works-wheel-${i}`}
                  role="option"
                  aria-selected={i === active}
                  href={item.href}
                  ref={(node: HTMLElement | null) => {
                    cardRefs.current[i] = node;
                  }}
                  className="group absolute [backface-visibility:hidden]"
                  style={{
                    width: metrics.cardW,
                    height: metrics.cardH,
                    marginLeft: -metrics.cardW / 2,
                    marginTop: -metrics.cardH / 2,
                    fontSize: metrics.text,
                  }}
                >
                  <span
                    className={cn(
                      "bg-muted shadow-foreground/12 relative block size-full overflow-hidden rounded-lg shadow-[0_18px_40px_-18px_var(--tw-shadow-color)]",
                      cardClassName,
                    )}
                  >
                    {item.content ?? (
                      <img
                        src={item.image}
                        alt={item.title}
                        draggable={false}
                        className="size-full object-cover"
                      />
                    )}
                    {action && item.href ? (
                      <span className="bg-background/80 text-foreground pointer-events-none absolute right-3 bottom-3 flex translate-y-1 items-center gap-1 rounded-full px-2.5 py-1 text-[0.7rem] opacity-0 backdrop-blur-sm transition group-hover:translate-y-0 group-hover:opacity-100">
                        <svg
                          viewBox="0 0 12 12"
                          className="size-2.5"
                          aria-hidden="true"
                        >
                          <path
                            d="M3 9 9 3M4 3h5v5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {action}
                      </span>
                    ) : null}
                  </span>
                </Tag>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Ring title and front-card title trade places across the transition.
          Type is sized off the measured stage, not vh, so the wheel keeps its
          proportions inside a card as well as at full bleed. */}
      <div
        ref={labelRef}
        className="pointer-events-none absolute inset-0 grid place-items-center tracking-tight"
        style={{ fontSize: metrics.title }}
      >
        {label}
      </div>
      <div
        ref={titleRef}
        className="pointer-events-none absolute top-1/2 left-[8%] -translate-y-1/2 tracking-tight opacity-0"
        style={{ fontSize: metrics.title, maxWidth: metrics.titleRoom }}
      >
        {items[active]?.avatar ? (
          <img
            src={items[active].avatar}
            alt=""
            draggable={false}
            className="mb-[0.35em] h-[1.9em] w-auto -rotate-6 drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)]"
          />
        ) : null}
        <div className="leading-[1.05]">{items[active]?.title}</div>
        {items[active]?.meta ? (
          <div className="text-muted-foreground mt-[0.5em] text-[0.36em] tracking-normal">
            {items[active].meta}
          </div>
        ) : null}
      </div>

      <ol
        className="text-muted-foreground absolute top-[7.5%] right-[2.5%] text-right leading-[1.75]"
        style={{ fontSize: metrics.index }}
      >
        {items.map((item, i) => (
          <li key={item.title}>
            <button
              type="button"
              onClick={() => goTo(i + 1)}
              className={cn(
                "focus-visible:outline-foreground cursor-pointer transition-colors outline-none focus-visible:outline-1",
                i === active && "text-foreground font-medium",
              )}
            >
              {item.title}
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default WorksWheel;
