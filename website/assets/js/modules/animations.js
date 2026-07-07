/* ==========================================================================
   animations.js — Scroll-Based Animations
   CalmRio — Premium Vacation Rentals, Royan & Saint-Trojan-les-Bains
   Uses IntersectionObserver for fade, slide, scale & staggered reveals
   ========================================================================== */

import { prefersReducedMotion } from '../utils/helpers.js';

/** @type {IntersectionObserver|null} */
let observer = null;

/** @type {Map<HTMLElement,IntersectionObserver>} */
const staggerObservers = new Map();

const CLASS_VISIBLE = 'visible';
const CLASS_ANIMATED = 'has-animated';

// All animation trigger classes we watch for
const ANIMATION_CLASSES = [
    '.fade-in',
    '.fade-in-left',
    '.fade-in-right',
    '.scale-in',
    '.reveal',
];

const STAGGER_SELECTOR = '.stagger-children';

const defaultOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px',
};

/* --------------------------------------------------------------------------
   Public: init
   -------------------------------------------------------------------------- */

/**
 * Initialise scroll-based animations.
 * Respects prefers-reduced-motion.
 */
export function initScrollAnimations() {
    // If user prefers reduced motion, make everything visible immediately
    if (prefersReducedMotion()) {
        makeAllVisible();
        return;
    }

    initMainObserver();
    initStaggerObservers();
    initAlreadyVisible();
}

/* --------------------------------------------------------------------------
   Public: destroy
   -------------------------------------------------------------------------- */

/**
 * Disconnect all observers and clean up.
 */
export function destroyScrollAnimations() {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
    staggerObservers.forEach((obs) => obs.disconnect());
    staggerObservers.clear();
}

/* --------------------------------------------------------------------------
   Main Observer — simple single-element animations
   -------------------------------------------------------------------------- */

function initMainObserver() {
    const targets = document.querySelectorAll(ANIMATION_CLASSES.join(','));

    if (!targets.length) return;

    observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add(CLASS_VISIBLE);
                    entry.target.classList.add(CLASS_ANIMATED);
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: defaultOptions.threshold,
            rootMargin: defaultOptions.rootMargin,
        }
    );

    targets.forEach((el) => {
        // Skip stagger-children — they're handled separately
        if (!el.classList.contains('stagger-children')) {
            observer.observe(el);
        }
    });
}

/* --------------------------------------------------------------------------
   Stagger Observer — child elements animate one by one
   -------------------------------------------------------------------------- */

function initStaggerObservers() {
    const staggerContainers = document.querySelectorAll(STAGGER_SELECTOR);

    staggerContainers.forEach((container) => {
        const children = Array.from(container.children);
        if (!children.length) return;

        let revealed = false;

        const staggerObs = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !revealed) {
                        revealed = true;
                        container.classList.add(CLASS_VISIBLE);
                    }
                });
            },
            {
                threshold: defaultOptions.threshold,
                rootMargin: defaultOptions.rootMargin,
            }
        );

        staggerObs.observe(container);
        staggerObservers.set(container, staggerObs);
    });
}

/* --------------------------------------------------------------------------
   Already Visible — fire animation immediately for elements visible on load
   -------------------------------------------------------------------------- */

function initAlreadyVisible() {
    const targets = document.querySelectorAll(ANIMATION_CLASSES.join(','));
    let needsImmediate = [];

    targets.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const inView = rect.top < window.innerHeight && rect.bottom > 0;
        if (inView) {
            needsImmediate.push(el);
        }
    });

    // Use requestAnimationFrame so initial render paints, then animate
    if (needsImmediate.length) {
        requestAnimationFrame(() => {
            needsImmediate.forEach((el) => {
                el.classList.add(CLASS_VISIBLE, CLASS_ANIMATED);
                observer?.unobserve(el);
            });
            needsImmediate = null;
        });
    }
}

/* --------------------------------------------------------------------------
   Reduced motion — make everything visible
   -------------------------------------------------------------------------- */

function makeAllVisible() {
    const all = document.querySelectorAll(`${ANIMATION_CLASSES.join(',')}, ${STAGGER_SELECTOR}`);
    all.forEach((el) => el.classList.add(CLASS_VISIBLE, CLASS_ANIMATED));
    const staggerChildren = document.querySelectorAll(`${STAGGER_SELECTOR} > *`);
    staggerChildren.forEach((el) => el.classList.add(CLASS_VISIBLE));
}
