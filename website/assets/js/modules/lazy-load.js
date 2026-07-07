/* ==========================================================================
   lazy-load.js — Image Lazy Loading with Blur-Up Effect
   CalmRio — Premium Vacation Rentals, Royan & Saint-Trojan-les-Bains
   Native lazy + IntersectionObserver fallback + background-image support
   ========================================================================== */

import { prefersReducedMotion } from '../utils/helpers.js';

const SELECTOR_IMG = 'img[loading="lazy"], img[data-src]';
const SELECTOR_BG = '[data-bg]';
const PLACEHOLDER_SRC = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22%3E%3C/svg%3E';

/** @type {IntersectionObserver|null} */
let imgObserver = null;
/** @type {IntersectionObserver|null} */
let bgObserver = null;

const loadedSet = new WeakSet();

/* --------------------------------------------------------------------------
   Public: init
   -------------------------------------------------------------------------- */

/**
 * Initialise lazy loading for images and background images.
 */
export function initLazyLoading() {
    initImages();
    initBackgroundImages();
}

/* --------------------------------------------------------------------------
   Public: destroy
   -------------------------------------------------------------------------- */

/**
 * Disconnect all observers.
 */
export function destroyLazyLoading() {
    if (imgObserver) {
        imgObserver.disconnect();
        imgObserver = null;
    }
    if (bgObserver) {
        bgObserver.disconnect();
        bgObserver = null;
    }
}

/* --------------------------------------------------------------------------
   Image lazy loading
   -------------------------------------------------------------------------- */

function initImages() {
    // Check if native lazy loading is supported
    if ('loading' in HTMLImageElement.prototype) {
        // Native is supported — still use observer for blur-up effect
        initNativeWithBlurUp();
    } else {
        // Fallback: IntersectionObserver-based lazy loading
        initObserverFallback();
    }
}

/**
 * Use native loading="lazy" but add blur-up + fade-in effects.
 */
function initNativeWithBlurUp() {
    const images = document.querySelectorAll(`${SELECTOR_IMG}:not([data-observer-processed])`);

    images.forEach((img) => {
        if (loadedSet.has(img)) return;

        // Mark as having observer support
        img.setAttribute('data-observer-processed', 'true');

        // Handle the onload event for blur-up → fade-in
        img.addEventListener('load', () => {
            onImageLoaded(img);
        });

        img.addEventListener('error', () => {
            onImageError(img);
        });

        // If already loaded (cached), fire immediately
        if (img.complete && img.naturalWidth > 0) {
            onImageLoaded(img);
        }
    });
}

/**
 * IntersectionObserver-based lazy loading for older browsers.
 */
function initObserverFallback() {
    const images = document.querySelectorAll(`${SELECTOR_IMG}, img[data-src]`);

    if (!images.length) return;

    imgObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    loadImage(entry.target);
                    imgObserver.unobserve(entry.target);
                }
            });
        },
        {
            rootMargin: '200px 0px', // Start loading 200px before visible
            threshold: 0.01,
        }
    );

    images.forEach((img) => imgObserver.observe(img));
}

/**
 * Load an image by swapping data-src → src.
 * @param {HTMLImageElement} img
 */
function loadImage(img) {
    const src = img.getAttribute('data-src');
    const srcset = img.getAttribute('data-srcset');

    if (!src && !srcset) return;

    if (src) img.src = src;
    if (srcset) img.srcset = srcset;

    img.addEventListener('load', () => onImageLoaded(img), { once: true });
    img.addEventListener('error', () => onImageError(img), { once: true });
}

/**
 * Handle image load — fade in from blur placeholder.
 * @param {HTMLImageElement} img
 */
function onImageLoaded(img) {
    if (loadedSet.has(img)) return;
    loadedSet.add(img);

    if (prefersReducedMotion()) {
        img.classList.add('lazy-loaded');
        img.style.filter = 'none';
        return;
    }

    // Remove blur with a small delay for smooth transition
    requestAnimationFrame(() => {
        img.classList.add('lazy-loaded');
    });

    // Clean up after transition
    img.addEventListener(
        'transitionend',
        () => {
            img.style.filter = 'none';
        },
        { once: true }
    );
}

/**
 * Handle image load error — show placeholder colour.
 * @param {HTMLImageElement} img
 */
function onImageError(img) {
    if (loadedSet.has(img)) return;
    loadedSet.add(img);

    // Set a background colour on the parent to indicate missing image
    img.style.opacity = '0.3';
    img.style.filter = 'grayscale(100%)';
    img.classList.add('lazy-error');

    // Try to restore the src if there's a data-src
    const fallbackSrc = img.getAttribute('data-fallback');
    if (fallbackSrc && img.src !== fallbackSrc) {
        img.src = fallbackSrc;
        img.addEventListener('load', () => onImageLoaded(img), { once: true });
    }
}

/* --------------------------------------------------------------------------
   Background image lazy loading
   -------------------------------------------------------------------------- */

function initBackgroundImages() {
    const bgElements = document.querySelectorAll(SELECTOR_BG);

    if (!bgElements.length) return;

    bgObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    loadBackgroundImage(entry.target);
                    bgObserver.unobserve(entry.target);
                }
            });
        },
        {
            rootMargin: '200px 0px',
            threshold: 0.01,
        }
    );

    bgElements.forEach((el) => bgObserver.observe(el));
}

/**
 * Load a background image from data-bg attribute.
 * @param {HTMLElement} el
 */
function loadBackgroundImage(el) {
    const bgUrl = el.getAttribute('data-bg');
    if (!bgUrl) return;

    // Create a test image to preload
    const testImg = new Image();
    testImg.onload = () => {
        el.style.backgroundImage = `url('${bgUrl}')`;
        el.classList.add('bg-loaded');
    };
    testImg.onerror = () => {
        // Keep fallback background or set a subtle colour
        el.classList.add('bg-error');
        const fallback = el.getAttribute('data-bg-fallback');
        if (fallback) {
            el.style.backgroundImage = `url('${fallback}')`;
        }
    };
    testImg.src = bgUrl;
}

/* --------------------------------------------------------------------------
   Public: loadImageNow — force-load a specific image immediately
   -------------------------------------------------------------------------- */

/**
 * Force-load an image immediately without waiting for intersection.
 * @param {HTMLImageElement} img
 */
export function loadImageNow(img) {
    const src = img.getAttribute('data-src') || img.src;
    if (!src) return;

    if (imgObserver) {
        imgObserver.unobserve(img);
    }

    loadImage(img);
}
