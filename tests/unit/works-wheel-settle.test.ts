import { describe, it, expect } from "vitest";
import { settleTurn, turnForScroll, scrollForTurn } from "../../src/components/ui/works-wheel";

// One notch of an ordinary mouse wheel is deltaY 100, and the wheel counts
// 900 of that as one item - so a single slow notch moves the target ~0.11.
const NOTCH = 100 / 900;

describe("works-wheel settleTurn", () => {
    it("a single slow notch down turns to the next item instead of snapping back", () => {
        expect(settleTurn(1 + NOTCH, 1)).toBe(2);
    });

    it("a single slow notch up turns to the previous item", () => {
        expect(settleTurn(3 - NOTCH, 3)).toBe(2);
    });

    it("the first notch from the ring opens the drum", () => {
        expect(settleTurn(NOTCH, 0)).toBe(1);
    });

    it("one notch up from the first drum item closes back to the ring", () => {
        expect(settleTurn(1 - NOTCH, 1)).toBe(0);
    });

    it("a big flick lands on an item past where it stopped, in the same direction", () => {
        expect(settleTurn(3.6, 1)).toBe(4);
        expect(settleTurn(1.4, 4)).toBe(1);
    });

    it("a negligible nudge snaps back to where it was", () => {
        expect(settleTurn(2.01, 2)).toBe(2);
        expect(settleTurn(1.99, 2)).toBe(2);
    });

    it("an already-whole target stays put", () => {
        expect(settleTurn(3, 1)).toBe(3);
    });
});

describe("works-wheel turnForScroll", () => {
    const STOPS = 5; // ring -> 5 testimonials

    it("starts on the ring and ends on the last item", () => {
        expect(turnForScroll(0, STOPS)).toBe(0);
        expect(turnForScroll(1, STOPS)).toBe(STOPS);
    });

    it("holds every item flat at the front for the same stretch of scrolling, the last one included", () => {
        const step = scrollForTurn(1, STOPS); // progress per item
        for (let n = 1; n <= STOPS; n++) {
            const at = scrollForTurn(n, STOPS);
            expect(turnForScroll(at, STOPS)).toBe(n);
            expect(turnForScroll(at - 0.2 * step, STOPS)).toBe(n);
            if (n < STOPS) expect(turnForScroll(at + 0.2 * step, STOPS)).toBe(n);
        }
        // The last item holds from 0.25 of a step before it all the way to the end.
        expect(turnForScroll(1 - 0.24 * step, STOPS)).toBe(STOPS);
    });

    it("scrollForTurn is the inverse at every whole turn", () => {
        for (let n = 0; n <= STOPS; n++) expect(turnForScroll(scrollForTurn(n, STOPS), STOPS)).toBe(n);
    });

    it("turns between items in the middle of each step, without going backwards", () => {
        let prev = -1;
        for (let p = 0; p <= 1.0001; p += 0.01) {
            const turn = turnForScroll(p, STOPS);
            expect(turn).toBeGreaterThanOrEqual(prev);
            prev = turn;
        }
        const mid = turnForScroll(scrollForTurn(1.5, STOPS), STOPS);
        expect(mid).toBeGreaterThan(1);
        expect(mid).toBeLessThan(2);
    });

    it("clamps progress outside 0-1", () => {
        expect(turnForScroll(-0.3, STOPS)).toBe(0);
        expect(turnForScroll(1.7, STOPS)).toBe(STOPS);
    });
});
