/* ==========================================================================
   testimonials.js — Testimonial Carousel (No Libraries)
   CalmRio — Premium Vacation Rentals, Royan & Saint-Trojan-les-Bains
   Features: touch/swipe, autoplay, dots, keyboard, responsive
   ========================================================================== */

import { onDirect, throttle, prefersReducedMotion, isMobile, isTablet, isDesktop } from '../utils/helpers.js';

const SELECTOR = '.testimonials__carousel';
const SELECTOR_TRACK = '.testimonials__track';
const SELECTOR_SLIDE = '.testimonials__slide';
const SELECTOR_PREV = '.testimonials__prev';
const SELECTOR_NEXT = '.testimonials__next';
const SELECTOR_DOTS = '.testimonials__dots';
const SELECTOR_DOT = '.testimonials__dot';

const CLASSES = {
    active: 'is-active',
    transitioning: 'is-transitioning',
    paused: 'is-paused',
};

/** @type {object|null} */
let state = null;

/** @type {Function[]} */
let cleanups = [];

const SWIPE_THRESHOLD = 50;

/* --------------------------------------------------------------------------
   Public: init
   -------------------------------------------------------------------------- */

/**
 * Initialise the testimonial carousel.
 */
export function initTestimonials() {
    const carousel = document.querySelector(SELECTOR);
    if (!carousel) return;

    const track = carousel.querySelector(SELECTOR_TRACK);
    const slides = Array.from(carousel.querySelectorAll(SELECTOR_SLIDE));
    const prevBtn = carousel.querySelector(SELECTOR_PREV);
    const nextBtn = carousel.querySelector(SELECTOR_NEXT);
    const dotsContainer = carousel.querySelector(SELECTOR_DOTS);

    if (!track || !slides.length) return;

    const autoplayInterval = parseInt(carousel.getAttribute('data-autoplay'), 10) || 5000;

    state = {
        carousel,
        track,
        slides,
        prevBtn,
        nextBtn,
        dotsContainer,
        currentIndex: 0,
        slideCount: slides.length,
        autoplayInterval,
        autoplayTimer: null,
        isPaused: false,
        slidesPerView: 1,
        touchStartX: 0,
        touchStartY: 0,
        touchMoved: false,
    };

    buildDots();
    updateSlidesPerView();
    goToSlide(0, false);

    // Event listeners
    const clickPrev = () => prev();
    const clickNext = () => next();
    const clickDot = (e) => {
        const dot = e.target.closest(SELECTOR_DOT);
        if (dot) {
            const idx = parseInt(dot.getAttribute('data-index'), 10);
            if (!isNaN(idx)) goToSlide(idx);
        }
    };

    if (prevBtn) cleanups.push(onDirect(prevBtn, 'click', clickPrev));
    if (nextBtn) cleanups.push(onDirect(nextBtn, 'click', clickNext));
    if (dotsContainer) cleanups.push(onDirect(dotsContainer, 'click', clickDot));

    // Touch events
    initTouch();

    // Keyboard
    cleanups.push(
        onDirect(carousel, 'keydown', (e) => {
            if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
            if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
        })
    );

    // Resize handler
    const onResize = throttle(() => {
        updateSlidesPerView();
        goToSlide(state.currentIndex, false);
    }, 200);
    cleanups.push(onDirect(window, 'resize', onResize, { passive: true }));

    // Visibility change — pause when tab hidden
    cleanups.push(
        onDirect(document, 'visibilitychange', () => {
            if (document.hidden) {
                pauseAutoplay();
            } else {
                startAutoplay();
            }
        })
    );

    // Autoplay
    if (!prefersReducedMotion()) {
        startAutoplay();
    }
}

/* --------------------------------------------------------------------------
   Public: destroy
   -------------------------------------------------------------------------- */

/**
 * Clean up the carousel.
 */
export function destroyTestimonials() {
    stopAutoplay();
    cleanups.forEach((fn) => fn());
    cleanups = [];
    state = null;
}

/* --------------------------------------------------------------------------
   Navigation
   -------------------------------------------------------------------------- */

function prev() {
    if (!state) return;
    const newIndex = state.currentIndex <= 0
        ? Math.max(0, state.slideCount - state.slidesPerView)
        : state.currentIndex - 1;
    goToSlide(newIndex);
}

function next() {
    if (!state) return;
    const maxIndex = Math.max(0, state.slideCount - state.slidesPerView);
    const newIndex = state.currentIndex >= maxIndex ? 0 : state.currentIndex + 1;
    goToSlide(newIndex);
}

/**
 * @param {number} index
 * @param {boolean} [animate=true]
 */
function goToSlide(index, animate = true) {
    if (!state) return;

    const maxIndex = Math.max(0, state.slideCount - state.slidesPerView);
    state.currentIndex = Math.max(0, Math.min(index, maxIndex));

    const slideWidth = state.slides[0]?.offsetWidth || 0;
    const gap = parseFloat(getComputedStyle(state.track).columnGap || getComputedStyle(state.track).gap) || 0;
    const offset = state.currentIndex * (slideWidth + gap / state.slidesPerView);

    if (animate) {
        state.track.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)';
    } else {
        state.track.style.transition = 'none';
    }

    state.track.style.transform = `translateX(-${offset}px)`;

    updateDots();
    updateActiveSlides();
    updateButtons();
}

function updateSlidesPerView() {
    if (!state) return;
    if (isDesktop()) state.slidesPerView = 3;
    else if (isTablet()) state.slidesPerView = 2;
    else state.slidesPerView = 1;
}

function updateButtons() {
    if (!state) return;
    const maxIndex = Math.max(0, state.slideCount - state.slidesPerView);

    if (state.prevBtn) {
        state.prevBtn.disabled = state.currentIndex <= 0;
        state.prevBtn.setAttribute('aria-disabled', String(state.currentIndex <= 0));
    }
    if (state.nextBtn) {
        state.nextBtn.disabled = state.currentIndex >= maxIndex;
        state.nextBtn.setAttribute('aria-disabled', String(state.currentIndex >= maxIndex));
    }
}

function updateActiveSlides() {
    if (!state) return;
    const end = state.currentIndex + state.slidesPerView;
    state.slides.forEach((slide, i) => {
        const isActive = i >= state.currentIndex && i < end;
        slide.classList.toggle(CLASSES.active, isActive);
        slide.setAttribute('aria-hidden', String(!isActive));
    });
}

/* --------------------------------------------------------------------------
   Dots
   -------------------------------------------------------------------------- */

function buildDots() {
    if (!state || !state.dotsContainer) return;

    state.dotsContainer.innerHTML = '';

    const dotCount = Math.max(1, state.slideCount - state.slidesPerView + 1);
    for (let i = 0; i < dotCount; i++) {
        const dot = document.createElement('button');
        dot.classList.add('testimonials__dot');
        dot.setAttribute('data-index', String(i));
        dot.setAttribute('aria-label', `Témoignage ${i + 1}`);
        dot.setAttribute('type', 'button');
        state.dotsContainer.appendChild(dot);
    }
}

function updateDots() {
    if (!state || !state.dotsContainer) return;
    const dots = state.dotsContainer.querySelectorAll(SELECTOR_DOT);
    dots.forEach((dot, i) => {
        dot.classList.toggle(CLASSES.active, i === state.currentIndex);
        dot.setAttribute('aria-current', i === state.currentIndex ? 'true' : 'false');
    });
}

/* --------------------------------------------------------------------------
   Autoplay
   -------------------------------------------------------------------------- */

function startAutoplay() {
    if (!state || state.autoplayInterval <= 0 || prefersReducedMotion()) return;
    stopAutoplay();
    state.autoplayTimer = setInterval(() => {
        if (!state.isPaused && !document.hidden) {
            next();
        }
    }, state.autoplayInterval);
}

function stopAutoplay() {
    if (state?.autoplayTimer) {
        clearInterval(state.autoplayTimer);
        state.autoplayTimer = null;
    }
}

function pauseAutoplay() {
    if (state) state.isPaused = true;
}

function resumeAutoplay() {
    if (!state) return;
    state.isPaused = false;
}

/* --------------------------------------------------------------------------
   Touch / Swipe
   -------------------------------------------------------------------------- */

function initTouch() {
    if (!state) return;

    const handleTouchStart = (e) => {
        const touch = e.touches[0];
        if (!touch) return;
        state.touchStartX = touch.clientX;
        state.touchStartY = touch.clientY;
        state.touchMoved = false;
    };

    const handleTouchMove = (e) => {
        if (!state) return;
        const touch = e.touches[0];
        if (!touch) return;
        const deltaX = touch.clientX - state.touchStartX;
        const deltaY = touch.clientY - state.touchStartY;

        // Only prevent default if primarily horizontal
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            state.touchMoved = true;
        }
    };

    const handleTouchEnd = (e) => {
        if (!state || !state.touchMoved) return;
        const touch = e.changedTouches[0];
        if (!touch) return;

        const deltaX = touch.clientX - state.touchStartX;

        if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
            if (deltaX > 0) {
                prev();
            } else {
                next();
            }
        }

        state.touchMoved = false;
    };

    // Pause on hover (via touch start/end for mobile-compatibility)
    const pause = () => pauseAutoplay();
    const resume = () => resumeAutoplay();

    cleanups.push(onDirect(state.carousel, 'touchstart', handleTouchStart, { passive: true }));
    cleanups.push(onDirect(state.carousel, 'touchmove', handleTouchMove, { passive: false }));
    cleanups.push(onDirect(state.carousel, 'touchend', handleTouchEnd, { passive: true }));
    cleanups.push(onDirect(state.carousel, 'mouseenter', pause));
    cleanups.push(onDirect(state.carousel, 'mouseleave', resume));
    cleanups.push(onDirect(state.carousel, 'focusin', pause));
    cleanups.push(onDirect(state.carousel, 'focusout', resume));
}

/* --------------------------------------------------------------------------
   Public API
   -------------------------------------------------------------------------- */

/**
 * Navigate to a specific slide.
 * @param {number} index
 */
export function goTo(index) {
    if (state) goToSlide(index);
}

/**
 * Get the current slide index.
 * @returns {number}
 */
export function getCurrentIndex() {
    return state?.currentIndex ?? 0;
}

/**
 * Get total slide count.
 * @returns {number}
 */
export function getSlideCount() {
    return state?.slideCount ?? 0;
}
