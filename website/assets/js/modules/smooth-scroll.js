/* ==========================================================================
   smooth-scroll.js — Smooth Scrolling for Anchor Links
   CalmRio — Premium Vacation Rentals, Royan & Saint-Trojan-les-Bains
   Handles hash links with fixed header offset & URL sync
   ========================================================================== */

import { throttle } from '../utils/helpers.js';

/** Offset for fixed header in pixels */
let headerOffset = 80;

/** @type {Function|null} */
let cleanupPopState = null;

/* --------------------------------------------------------------------------
   Public: init
   -------------------------------------------------------------------------- */

/**
 * Initialise smooth scrolling. All anchor links with href="#..." will
 * scroll smoothly to the target.
 */
export function initSmoothScroll() {
    // Calculate header offset dynamically
    const header = document.querySelector('.site-header');
    if (header) {
        headerOffset = header.offsetHeight || 80;
    }

    // Delegate all anchor clicks
    document.addEventListener('click', handleAnchorClick, { passive: false });

    // Handle initial hash on page load
    if (window.location.hash) {
        setTimeout(() => {
            scrollToHash(window.location.hash);
        }, 300);
    }

    // Handle browser back/forward
    cleanupPopState = () => window.removeEventListener('popstate', handlePopState);
    window.addEventListener('popstate', handlePopState);
}

/* --------------------------------------------------------------------------
   Public: destroy
   -------------------------------------------------------------------------- */

/**
 * Remove event listeners.
 */
export function destroySmoothScroll() {
    document.removeEventListener('click', handleAnchorClick);
    if (cleanupPopState) {
        cleanupPopState();
        cleanupPopState = null;
    }
}

/* --------------------------------------------------------------------------
   Public: scrollTo
   -------------------------------------------------------------------------- */

/**
 * Scroll smoothly to a target element.
 * @param {string|HTMLElement} target — CSS selector or element
 * @param {number} [offset] — additional offset from top
 */
export function scrollTo(target, offset = 0) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;

    const top = el.getBoundingClientRect().top + window.pageYOffset - headerOffset - offset;

    try {
        window.scrollTo({ top, behavior: 'smooth' });
    } catch (err) {
        // Fallback for browsers without smooth scroll support
        window.scrollTo(0, top);
    }
}

/* --------------------------------------------------------------------------
   Internal: handle anchor clicks
   -------------------------------------------------------------------------- */

/**
 * @param {MouseEvent} e
 */
function handleAnchorClick(e) {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const hash = link.getAttribute('href');
    if (!hash || hash === '#') return;

    const targetEl = document.querySelector(hash);
    if (!targetEl) return;

    e.preventDefault();
    scrollToElement(targetEl, hash);
}

/**
 * Scroll to an element and update the URL hash.
 * @param {HTMLElement} el
 * @param {string} hash
 */
function scrollToElement(el, hash) {
    const top = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;

    try {
        window.scrollTo({ top, behavior: 'smooth' });
    } catch {
        window.scrollTo(0, top);
    }

    // Update URL hash (without triggering another scroll)
    if (history.pushState && hash !== window.location.hash) {
        history.pushState(null, '', hash);
    } else if (hash !== window.location.hash) {
        // Fallback for older browsers
        const scrollY = window.pageYOffset;
        window.location.hash = hash;
        window.scrollTo(0, scrollY);
    }
}

/**
 * Scroll to a hash target (used on page load and popstate).
 * @param {string} hash
 */
function scrollToHash(hash) {
    if (!hash || hash === '#') return;
    const el = document.querySelector(hash);
    if (!el) return;

    const top = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;
    try {
        window.scrollTo({ top, behavior: 'smooth' });
    } catch {
        window.scrollTo(0, top);
    }
}

/**
 * Handle browser back/forward navigation for hash changes.
 */
function handlePopState() {
    if (window.location.hash) {
        scrollToHash(window.location.hash);
    }
}
