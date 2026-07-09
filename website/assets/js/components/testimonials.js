/* ==========================================================================
   testimonials.js — Testimonial Carousel + Property Review Sections
   CalmRio — Premium Vacation Rentals, Royan & Saint-Trojan-les-Bains
   Features: touch/swipe, autoplay, dots, keyboard, responsive
   ========================================================================== */

import { onDirect, throttle, prefersReducedMotion, isMobile, isTablet, isDesktop } from '../utils/helpers.js';

/* ==========================================================================
   Property Review Sections — Interactive Enhancements
   ========================================================================== */

const REVIEW_SECTION_SELECTOR = '.property-reviews';
const REVIEW_CARD_SELECTOR = '.review-card';
const REVIEW_CTA_SELECTOR = '.reviews-cta__link';
const MAX_VISIBLE_INITIAL = 3;

/** @type {Map<Element, {allCards: Element[], hiddenCards: Element[], toggleBtn: HTMLButtonElement|null}>} */
const reviewSections = new Map();

/**
 * Initialise interactive review sections on property pages.
 * - If > MAX_VISIBLE_INITIAL reviews, hides extras behind a "Show more" toggle
 * - Adds entrance animations
 */
export function initPropertyReviews() {
    const sections = document.querySelectorAll(REVIEW_SECTION_SELECTOR);
    if (!sections.length) return;

    sections.forEach((section) => {
        const reviewContainer = section.querySelector('.review-cards') || section.querySelector('.reviews-grid');
        if (!reviewContainer) return;

        const allCards = Array.from(reviewContainer.querySelectorAll(REVIEW_CARD_SELECTOR));
        if (allCards.length <= MAX_VISIBLE_INITIAL) {
            // All cards visible — just add stagger animation
            allCards.forEach((card, i) => {
                card.style.setProperty('--stagger-index', String(i));
                card.classList.add('fade-in');
            });
            return;
        }

        // Hide cards beyond the initial visible set
        const visibleCards = allCards.slice(0, MAX_VISIBLE_INITIAL);
        const hiddenCards = allCards.slice(MAX_VISIBLE_INITIAL);

        hiddenCards.forEach((card) => {
            card.setAttribute('hidden', '');
            card.classList.add('review-card--collapsed');
        });

        visibleCards.forEach((card, i) => {
            card.style.setProperty('--stagger-index', String(i));
            card.classList.add('fade-in');
        });

        // Create "Show more" toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'btn btn--secondary btn--sm review-toggle';
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.setAttribute('aria-controls', `reviews-hidden-${section.id || Math.random().toString(36).slice(2, 8)}`);
        toggleBtn.textContent = getShowMoreText(hiddenCards.length);

        const btnWrapper = document.createElement('div');
        btnWrapper.className = 'review-toggle-wrapper';
        btnWrapper.appendChild(toggleBtn);

        reviewContainer.insertAdjacentElement('afterend', btnWrapper);

        toggleBtn.addEventListener('click', () => {
            const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
            if (isExpanded) {
                hiddenCards.forEach((card) => card.setAttribute('hidden', ''));
                toggleBtn.setAttribute('aria-expanded', 'false');
                toggleBtn.textContent = getShowMoreText(hiddenCards.length);
            } else {
                hiddenCards.forEach((card, i) => {
                    card.removeAttribute('hidden');
                    card.style.setProperty('--stagger-index', String(i));
                    card.classList.add('fade-in');
                });
                toggleBtn.setAttribute('aria-expanded', 'true');
                toggleBtn.textContent = getShowLessText();
                // Scroll to last visible card
                toggleBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });

        reviewSections.set(section, { allCards, hiddenCards, toggleBtn });
    });
}

/**
 * Returns localized "Show more" text based on document language.
 * @param {number} remaining
 * @returns {string}
 */
function getShowMoreText(remaining) {
    const lang = document.documentElement.lang || 'fr';
    if (lang.startsWith('fr')) {
        return `Voir les ${remaining} avis suivants ↓`;
    }
    return `Show ${remaining} more reviews ↓`;
}

/**
 * Returns localized "Show less" text.
 * @returns {string}
 */
function getShowLessText() {
    const lang = document.documentElement.lang || 'fr';
    return lang.startsWith('fr') ? 'Réduire ↑' : 'Show less ↑';
}

/* ==========================================================================
   Testimonial Carousel
   ========================================================================== */

const SELECTOR = '.testimonials-slider';
const SELECTOR_SLIDE = '.card--testimonial';
const SELECTOR_PREV = '.testimonial-prev';
const SELECTOR_NEXT = '.testimonial-next';
const SELECTOR_DOTS = '.testimonials-dots';
const SELECTOR_DOT = '.testimonials-dot';

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

    const slides = Array.from(carousel.querySelectorAll(SELECTOR_SLIDE));
    if (!slides.length) return;

    const prevBtn = document.getElementById('testimonial-prev') || document.querySelector(SELECTOR_PREV);
    const nextBtn = document.getElementById('testimonial-next') || document.querySelector(SELECTOR_NEXT);
    const dotsContainer = document.querySelector(SELECTOR_DOTS);

    const autoplayInterval = parseInt(carousel.getAttribute('data-autoplay'), 10) || 5000;

    state = {
        carousel,
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

    initDots();
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

    // Scroll the carousel to show the current slide
    // Calculate position from slide dimensions (works regardless of offsetParent)
    if (state.carousel && state.slides.length > 0) {
        const slideWidth = state.slides[0].offsetWidth;
        const gap = parseInt(getComputedStyle(state.carousel).gap) || 0;
        const scrollTarget = state.currentIndex * (slideWidth + gap);
        state.carousel.style.scrollBehavior = animate ? 'smooth' : 'auto';
        state.carousel.scrollLeft = scrollTarget;
        state.carousel.style.scrollBehavior = '';
    }

    updateDots();
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

/* --------------------------------------------------------------------------
   Dots — re-use existing HTML dots (do not create new ones)
   -------------------------------------------------------------------------- */

function initDots() {
    if (!state || !state.dotsContainer) return;

    const dots = Array.from(state.dotsContainer.querySelectorAll(SELECTOR_DOT));

    // Ensure each dot has a data-index attribute
    const dotCount = Math.max(1, state.slideCount - state.slidesPerView + 1);
    dots.forEach((dot, i) => {
        if (!dot.hasAttribute('data-index')) {
            dot.setAttribute('data-index', String(Math.min(i, dotCount - 1)));
        }
    });
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
