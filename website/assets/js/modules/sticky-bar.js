/* ==========================================================================
   sticky-bar.js — Scroll-aware sticky bar show/hide
   CalmRio — Premium Vacation Rentals, Royan & Saint-Trojan-les-Bains
   Hides bar on downward scroll, reveals on upward scroll (mobile only)
   ========================================================================== */

import { throttle, onDirect } from '../utils/helpers.js';

const SELECTORS = {
    stickyBar: '[data-sticky-bar]',
};

const CLASSES = {
    hidden: 'sticky-bar--hidden',
};

const SCROLL_THRESHOLD = 100;   // px scrolled down before hiding
const MOBILE_BREAKPOINT = 769;  // active only below this viewport width
const THROTTLE_LIMIT = 150;     // ms between scroll evaluations

/** @type {HTMLElement[]} */
let bars = [];
/** @type {number} */
let lastScrollY = 0;
/** @type {Function[]} */
let cleanups = [];

/* --------------------------------------------------------------------------
   Public: initStickyBar
   -------------------------------------------------------------------------- */

/**
 * Initialise the sticky bar behaviour.
 * Scans the DOM for `[data-sticky-bar]` elements and binds scroll listeners.
 * Active only on viewports narrower than {@link MOBILE_BREAKPOINT}.
 */
export function initStickyBar() {
    bars = Array.from(document.querySelectorAll(SELECTORS.stickyBar));
    if (!bars.length) return;

    // Capture initial scroll position
    lastScrollY = window.scrollY;

    // Set initial hidden state if already past threshold
    if (lastScrollY > SCROLL_THRESHOLD) {
        bars.forEach((bar) => bar.classList.add(CLASSES.hidden));
    }

    const onScroll = throttle(() => {
        // Re-check breakpoint on every tick (handles orientation change)
        if (window.innerWidth >= MOBILE_BREAKPOINT) return;

        const currentY = window.scrollY;
        const scrollingDown = currentY > lastScrollY;

        if (scrollingDown && currentY > SCROLL_THRESHOLD) {
            bars.forEach((bar) => bar.classList.add(CLASSES.hidden));
        } else {
            bars.forEach((bar) => bar.classList.remove(CLASSES.hidden));
        }

        lastScrollY = currentY;
    }, THROTTLE_LIMIT);

    cleanups.push(onDirect(window, 'scroll', onScroll, { passive: true }));

    // Reset state when resizing past the mobile breakpoint
    const onResize = throttle(() => {
        if (window.innerWidth >= MOBILE_BREAKPOINT) {
            bars.forEach((bar) => bar.classList.remove(CLASSES.hidden));
        }
    }, 200);

    cleanups.push(onDirect(window, 'resize', onResize, { passive: true }));
}

/* --------------------------------------------------------------------------
   Public: destroyStickyBar
   -------------------------------------------------------------------------- */

/**
 * Tear down all sticky bar listeners and reset DOM state.
 * Call before re-initialising (e.g. SPA route change).
 */
export function destroyStickyBar() {
    cleanups.forEach((fn) => fn());
    cleanups = [];
    bars.forEach((bar) => bar.classList.remove(CLASSES.hidden));
    bars = [];
    lastScrollY = 0;
}
