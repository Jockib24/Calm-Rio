/* ==========================================================================
   gallery.js — Property Image Gallery
   CalmRio — Premium Vacation Rentals, Royan & Saint-Trojan-les-Bains
   Features: thumbnail grid, lightbox, swipe, keyboard, preloading
   ========================================================================== */

import { on, onDirect, generateId } from '../utils/helpers.js';

const SELECTORS = {
    gallery: '.property-gallery',
    thumbnail: '.property-gallery__thumb',
    mainImage: '.property-gallery__main img',
    mainContainer: '.property-gallery__main',
    counter: '.property-gallery__counter',
    prevBtn: '.property-gallery__prev',
    nextBtn: '.property-gallery__next',
    fullscreenBtn: '.property-gallery__fullscreen',
};

const CLASSES = {
    active: 'is-active',
    loading: 'is-loading',
};

/** @type {Map<HTMLElement,object>} */
const galleries = new Map();

/** @type {Function[]} */
let cleanups = [];

const SWIPE_THRESHOLD = 50;

/* --------------------------------------------------------------------------
   Public: init
   -------------------------------------------------------------------------- */

/**
 * Initialise all property galleries on the page.
 */
export function initGallery() {
    const containers = document.querySelectorAll(SELECTORS.gallery);
    if (!containers.length) return;

    containers.forEach((container) => {
        initGalleryContainer(container);
    });
}

/* --------------------------------------------------------------------------
   Public: destroy
   -------------------------------------------------------------------------- */

/**
 * Remove all gallery listeners.
 */
export function destroyGallery() {
    cleanups.forEach((fn) => fn());
    cleanups = [];
    galleries.clear();
}

/* --------------------------------------------------------------------------
   Init a single gallery
   -------------------------------------------------------------------------- */

/**
 * @param {HTMLElement} container
 */
function initGalleryContainer(container) {
    const thumbnails = Array.from(container.querySelectorAll(SELECTORS.thumbnail));
    const mainImage = container.querySelector(SELECTORS.mainImage);
    const counter = container.querySelector(SELECTORS.counter);
    const prevBtn = container.querySelector(SELECTORS.prevBtn);
    const nextBtn = container.querySelector(SELECTORS.nextBtn);
    const fullscreenBtn = container.querySelector(SELECTORS.fullscreenBtn);

    if (!thumbnails.length) return;

    // Build image list from thumbnails
    const images = thumbnails.map((thumb) => ({
        src: thumb.getAttribute('data-full') || thumb.getAttribute('src') || thumb.getAttribute('href'),
        thumbSrc: thumb.getAttribute('src'),
        alt: thumb.getAttribute('alt') || '',
        caption: thumb.getAttribute('data-caption') || '',
    })).filter((img) => img.src);

    const state = {
        container,
        thumbnails,
        mainImage,
        counter,
        prevBtn,
        nextBtn,
        fullscreenBtn,
        images,
        currentIndex: 0,
        preloaded: new Set(),
        touchStartX: 0,
        touchStartY: 0,
        touchMoved: false,
    };

    galleries.set(container, state);

    // Click on thumbnail
    thumbnails.forEach((thumb, i) => {
        const handler = (e) => {
            e.preventDefault();
            setImage(container, i);
        };
        thumb.addEventListener('click', handler);
        cleanups.push(() => thumb.removeEventListener('click', handler));

        // Add keyboard access to thumbnails
        thumb.setAttribute('tabindex', '0');
        thumb.setAttribute('role', 'button');
        thumb.setAttribute('aria-label', `Voir l'image ${i + 1}`);

        const keyHandler = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setImage(container, i);
            }
        };
        thumb.addEventListener('keydown', keyHandler);
        cleanups.push(() => thumb.removeEventListener('keydown', keyHandler));
    });

    // Prev/Next buttons
    if (prevBtn) {
        cleanups.push(onDirect(prevBtn, 'click', () => prevImage(container)));
        prevBtn.setAttribute('aria-label', 'Image précédente');
    }
    if (nextBtn) {
        cleanups.push(onDirect(nextBtn, 'click', () => nextImage(container)));
        nextBtn.setAttribute('aria-label', 'Image suivante');
    }

    // Keyboard navigation on main image
    if (container) {
        const keyHandler = (e) => {
            if (e.key === 'ArrowLeft') { e.preventDefault(); prevImage(container); }
            if (e.key === 'ArrowRight') { e.preventDefault(); nextImage(container); }
        };
        container.addEventListener('keydown', keyHandler);
        cleanups.push(() => container.removeEventListener('keydown', keyHandler));
    }

    // Fullscreen button — delegates to GalleryLightbox via [data-gallery]
    if (fullscreenBtn) {
        cleanups.push(onDirect(fullscreenBtn, 'click', () => {
            const galleryImages = container.querySelectorAll('[data-gallery]');
            if (galleryImages.length > 0) {
                const idx = Math.min(state.currentIndex, galleryImages.length - 1);
                galleryImages[idx].click();
            }
        }));
    }

    // "View all photos" button — delegates to GalleryLightbox
    const moreBtn = container.querySelector('.property-gallery__more');
    if (moreBtn) {
        cleanups.push(onDirect(moreBtn, 'click', (e) => {
            const galleryImages = container.querySelectorAll('[data-gallery]');
            if (galleryImages.length > 0) {
                e.preventDefault();
                const idx = Math.min(state.currentIndex, galleryImages.length - 1);
                galleryImages[idx].click();
            }
        }));
    }

    // Touch/swipe on main image
    initSwipe(container);

    // Set initial image (first)
    setImage(container, 0, false);

    // Preload adjacent images
    preloadAdjacent(container, 0);
}

/* --------------------------------------------------------------------------
   Image navigation
   -------------------------------------------------------------------------- */

/**
 * Set the main image to the given index.
 * @param {HTMLElement} container
 * @param {number} index
 * @param {boolean} [animate=true]
 */
function setImage(container, index, animate = true) {
    const state = galleries.get(container);
    if (!state) return;

    const { images, thumbnails, mainImage, counter } = state;
    const total = images.length;
    if (total === 0) return;

    // Wrap index
    index = ((index % total) + total) % total;
    state.currentIndex = index;

    const image = images[index];
    if (!image) return;

    // Update main image
    if (mainImage) {
        if (animate) {
            mainImage.classList.add(CLASSES.loading);
        }

        const img = new Image();
        img.onload = () => {
            mainImage.src = image.src;
            mainImage.alt = image.alt || `Photo ${index + 1}`;
            mainImage.classList.remove(CLASSES.loading);
        };
        img.onerror = () => {
            mainImage.classList.remove(CLASSES.loading);
            // Keep current image on error
        };
        img.src = image.src;
    }

    // Update active thumbnail
    thumbnails.forEach((thumb, i) => {
        thumb.classList.toggle(CLASSES.active, i === index);
        thumb.setAttribute('aria-current', i === index ? 'true' : 'false');
    });

    // Update counter
    if (counter) {
        counter.textContent = `${index + 1}/${total}`;
    }

    // Update button states
    updateButtons(container);

    // Preload adjacent
    preloadAdjacent(container, index);

    // Emit event
    container.dispatchEvent(new CustomEvent('gallery:change', {
        detail: { index, total, image },
        bubbles: true,
    }));
}

function prevImage(container) {
    const state = galleries.get(container);
    if (!state) return;
    const newIndex = state.currentIndex - 1;
    setImage(container, newIndex < 0 ? state.images.length - 1 : newIndex);
}

function nextImage(container) {
    const state = galleries.get(container);
    if (!state) return;
    setImage(container, (state.currentIndex + 1) % state.images.length);
}

function updateButtons(container) {
    const state = galleries.get(container);
    if (!state) return;
    const { prevBtn, nextBtn, images } = state;

    // We allow wrapping, so buttons are never disabled
    if (prevBtn) prevBtn.disabled = false;
    if (nextBtn) nextBtn.disabled = false;
}

/* --------------------------------------------------------------------------
   Image preloading
   -------------------------------------------------------------------------- */

/**
 * Preload images adjacent to the current index.
 * @param {HTMLElement} container
 * @param {number} index
 */
function preloadAdjacent(container, index) {
    const state = galleries.get(container);
    if (!state) return;

    const { images, preloaded } = state;
    const total = images.length;
    if (total <= 1) return;

    // Preload prev, next, and one beyond each
    const toPreload = [
        (index - 1 + total) % total,
        (index + 1) % total,
        (index + 2) % total,
        (index - 2 + total) % total,
    ];

    toPreload.forEach((i) => {
        if (preloaded.has(i)) return;
        const img = images[i];
        if (!img) return;

        preloaded.add(i);
        const preloadImg = new Image();
        preloadImg.src = img.src;
    });

    // Clean up preload set if it gets too large
    if (preloaded.size > total * 2) {
        // Keep current + adjacent
        const keep = new Set([
            index,
            (index - 1 + total) % total,
            (index + 1) % total,
        ]);
        for (const i of preloaded) {
            if (!keep.has(i)) preloaded.delete(i);
        }
    }
}

/* --------------------------------------------------------------------------
   Touch / Swipe
   -------------------------------------------------------------------------- */

function initSwipe(container) {
    const state = galleries.get(container);
    if (!state) return;

    const mainEl = container.querySelector(SELECTORS.mainContainer) || container;

    const touchStart = (e) => {
        const touch = e.touches[0];
        if (!touch) return;
        state.touchStartX = touch.clientX;
        state.touchStartY = touch.clientY;
        state.touchMoved = false;
    };

    const touchMove = (e) => {
        const touch = e.touches[0];
        if (!touch) return;
        const deltaX = touch.clientX - state.touchStartX;
        const deltaY = touch.clientY - state.touchStartY;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            state.touchMoved = true;
        }
    };

    const touchEnd = (e) => {
        if (!state.touchMoved) return;
        const touch = e.changedTouches[0];
        if (!touch) return;

        const deltaX = touch.clientX - state.touchStartX;

        if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
            if (deltaX > 0) {
                prevImage(container);
            } else {
                nextImage(container);
            }
        }

        state.touchMoved = false;
    };

    if (mainEl) {
        cleanups.push(onDirect(mainEl, 'touchstart', touchStart, { passive: true }));
        cleanups.push(onDirect(mainEl, 'touchmove', touchMove, { passive: false }));
        cleanups.push(onDirect(mainEl, 'touchend', touchEnd, { passive: true }));
    }
}

/* --------------------------------------------------------------------------
   Public API
   -------------------------------------------------------------------------- */

/**
 * Navigate to a specific image by index.
 * @param {HTMLElement} container — gallery container
 * @param {number} index
 */
export function goToImage(container, index) {
    setImage(container, index);
}

/**
 * Get current image index for a gallery.
 * @param {HTMLElement} container
 * @returns {number}
 */
export function getCurrentImage(container) {
    const state = galleries.get(container);
    return state?.currentIndex ?? 0;
}

/**
 * Get image count for a gallery.
 * @param {HTMLElement} container
 * @returns {number}
 */
export function getImageCount(container) {
    const state = galleries.get(container);
    return state?.images.length ?? 0;
}
