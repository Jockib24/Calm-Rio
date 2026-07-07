/* ==========================================================================
   counters.js — Animated Number Counters
   CalmRio — Premium Vacation Rentals, Royan & Saint-Trojan-les-Bains
   Animates numbers from 0 to target when scrolled into view
   ========================================================================== */

import { formatNumber, prefersReducedMotion } from '../utils/helpers.js';

const SELECTOR = '[data-counter]';
const ATTR_TARGET = 'data-counter';
const ATTR_SUFFIX = 'data-suffix';
const ATTR_DURATION = 'data-duration';
const ATTR_DECIMALS = 'data-decimals';

const DEFAULT_DURATION = 2000;

/** @type {IntersectionObserver|null} */
let observer = null;

/** @type {Set<HTMLElement>} */
const animated = new Set();

/* --------------------------------------------------------------------------
   Public: init
   -------------------------------------------------------------------------- */

/**
 * Initialise all counter elements.
 */
export function initCounters() {
    const counters = document.querySelectorAll(SELECTOR);
    if (!counters.length) return;

    if (prefersReducedMotion()) {
        // Skip animation, show final values
        counters.forEach((el) => {
            setFinalValue(el);
        });
        return;
    }

    observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting && !animated.has(entry.target)) {
                    animated.add(entry.target);
                    animateCounter(entry.target);
                }
            });
        },
        { threshold: 0.3, rootMargin: '0px 0px -30px 0px' }
    );

    counters.forEach((el) => observer.observe(el));
}

/* --------------------------------------------------------------------------
   Public: destroy
   -------------------------------------------------------------------------- */

/**
 * Disconnect observer.
 */
export function destroyCounters() {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
    animated.clear();
}

/* --------------------------------------------------------------------------
   Animate a single counter
   -------------------------------------------------------------------------- */

/**
 * Count up from 0 to the target value with requestAnimationFrame.
 * @param {HTMLElement} el
 */
function animateCounter(el) {
    const target = parseFloat(el.getAttribute(ATTR_TARGET));
    const suffix = el.getAttribute(ATTR_SUFFIX) || '';
    const duration = parseInt(el.getAttribute(ATTR_DURATION), 10) || DEFAULT_DURATION;
    const decimals = parseInt(el.getAttribute(ATTR_DECIMALS), 10) || 0;

    if (isNaN(target)) {
        // Fallback: try to parse inner text as number
        const textNum = parseFloat(el.textContent?.replace(/[^0-9.-]/g, ''));
        if (isNaN(textNum)) return;
        el.setAttribute(ATTR_TARGET, textNum.toString());
        animateCounter(el);
        return;
    }

    const startTime = performance.now();

    function tick(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-out quad for a natural deceleration
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = target * eased;

        let display;
        if (decimals > 0) {
            display = current.toFixed(decimals);
        } else {
            display = Math.floor(current).toString();
        }

        // Format with commas for integers
        if (decimals === 0) {
            display = formatNumber(parseInt(display, 10));
        }

        el.textContent = display + suffix;
        el.setAttribute('data-current', display);

        if (progress < 1) {
            requestAnimationFrame(tick);
        } else {
            // Ensure exact final value
            const final = decimals > 0 ? target.toFixed(decimals) : formatNumber(Math.floor(target));
            el.textContent = final + suffix;
        }
    }

    requestAnimationFrame(tick);
}

/* --------------------------------------------------------------------------
   Set final value without animation (for reduced motion)
   -------------------------------------------------------------------------- */

/**
 * @param {HTMLElement} el
 */
function setFinalValue(el) {
    const target = parseFloat(el.getAttribute(ATTR_TARGET));
    const suffix = el.getAttribute(ATTR_SUFFIX) || '';
    const decimals = parseInt(el.getAttribute(ATTR_DECIMALS), 10) || 0;

    if (isNaN(target)) return;

    let display;
    if (decimals > 0) {
        display = target.toFixed(decimals);
    } else {
        display = formatNumber(Math.floor(target));
    }

    el.textContent = display + suffix;
}
