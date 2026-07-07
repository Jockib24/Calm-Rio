/* ==========================================================================
   modals.js — Accessible Modal & Lightbox System
   CalmRio — Premium Vacation Rentals, Royan & Saint-Trojan-les-Bains
   Features: focus trap, scroll lock, ARIA, lightbox, multi-instance
   ========================================================================== */

import { lockBodyScroll, getFocusableElements, onDirect, generateId } from '../utils/helpers.js';

const SELECTORS = {
    openTrigger: '[data-modal-open]',
    closeTrigger: '.modal__close, [data-modal-close]',
    overlay: '.modal__overlay',
    modal: '.modal',
    modalContent: '.modal__content',
    lightboxPrev: '[data-lightbox-prev]',
    lightboxNext: '[data-lightbox-next]',
};

const CLASSES = {
    open: 'modal--open',
    visible: 'modal--visible',
    lightbox: 'modal--lightbox',
};

/** @type {Set<HTMLElement>} */
const openModals = new Set();

/** @type {Map<HTMLElement,HTMLElement>} */
const triggerMap = new Map(); // modal → trigger element for focus restore

/** @type {Map<HTMLElement,Function>} */
const cleanupMap = new Map(); // modal → cleanup function

/* --------------------------------------------------------------------------
   Public: init
   -------------------------------------------------------------------------- */

/**
 * Initialise the modal system. Attaches delegated event listeners.
 */
export function initModals() {
    // Open modal on trigger click
    document.addEventListener('click', handleOpenClick);

    // Close modal on close button / overlay click
    document.addEventListener('click', handleCloseClick);

    // Close on Escape
    document.addEventListener('keydown', handleKeyDown);
}

/* --------------------------------------------------------------------------
   Public: destroy
   -------------------------------------------------------------------------- */

/**
 * Remove global listeners and close all open modals.
 */
export function destroyModals() {
    document.removeEventListener('click', handleOpenClick);
    document.removeEventListener('click', handleCloseClick);
    document.removeEventListener('keydown', handleKeyDown);

    // Close all open modals
    openModals.forEach((modal) => closeModal(modal));
}

/* --------------------------------------------------------------------------
   Public: open / close
   -------------------------------------------------------------------------- */

/**
 * Programmatically open a modal by ID or element.
 * @param {string|HTMLElement} target — modal ID (without #) or element
 * @param {HTMLElement|null} [trigger] — element that triggered the open
 */
export function openModal(target, trigger = null) {
    const modal = typeof target === 'string' ? document.getElementById(target) : target;
    if (!modal || openModals.has(modal)) return;

    // Store the triggering element for focus restore
    triggerMap.set(modal, trigger || document.activeElement);

    // Lock body scroll
    const unlock = lockBodyScroll();
    cleanupMap.set(modal, unlock);

    // Show modal
    modal.classList.add(CLASSES.open);
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-hidden', 'false');
    modal.setAttribute('role', modal.getAttribute('role') || 'dialog');

    // Ensure labelledby
    const heading = modal.querySelector('[id]');
    if (heading && !modal.hasAttribute('aria-labelledby')) {
        modal.setAttribute('aria-labelledby', heading.id);
    }

    // Trigger reflow then add visible class for transition
    modal.offsetHeight; // eslint-disable-line no-unused-expressions
    modal.classList.add(CLASSES.visible);

    // Trap focus inside modal
    document.addEventListener('keydown', trapFocus, true);

    // Focus the first focusable element
    setTimeout(() => {
        const focusable = getFocusableElements(modal);
        if (focusable.length > 0) {
            focusable[0].focus();
        }
    }, 50);

    openModals.add(modal);

    // Emit custom event
    modal.dispatchEvent(new CustomEvent('modal:open', { bubbles: true }));
}

/**
 * Programmatically close a modal.
 * @param {HTMLElement} modal
 */
export function closeModal(modal) {
    if (!modal || !openModals.has(modal)) return;

    modal.classList.remove(CLASSES.visible);

    const handleTransitionEnd = () => {
        modal.classList.remove(CLASSES.open);
        modal.setAttribute('aria-hidden', 'true');
        modal.removeAttribute('aria-modal');

        // Restore focus
        const trigger = triggerMap.get(modal);
        if (trigger && typeof trigger.focus === 'function') {
            trigger.focus();
        }
        triggerMap.delete(modal);

        // Unlock scroll
        const unlock = cleanupMap.get(modal);
        if (unlock) unlock();
        cleanupMap.delete(modal);

        document.removeEventListener('keydown', trapFocus, true);

        openModals.delete(modal);
        modal.dispatchEvent(new CustomEvent('modal:close', { bubbles: true }));

        modal.removeEventListener('transitionend', handleTransitionEnd);
    };

    modal.addEventListener('transitionend', handleTransitionEnd, { once: true });

    // Fallback if no transition
    setTimeout(() => {
        if (openModals.has(modal)) {
            handleTransitionEnd();
        }
    }, 350);
}

/* --------------------------------------------------------------------------
   Internal: click handlers
   -------------------------------------------------------------------------- */

/**
 * @param {MouseEvent} e
 */
function handleOpenClick(e) {
    const trigger = e.target.closest(SELECTORS.openTrigger);
    if (!trigger) return;

    // If it's a lightbox trigger, initialise lightbox mode
    const isLightbox = trigger.hasAttribute('data-lightbox');
    const modalId = trigger.getAttribute('data-modal-open');

    if (isLightbox && modalId) {
        e.preventDefault();
        initLightbox(modalId, trigger);
        return;
    }

    if (modalId) {
        e.preventDefault();
        openModal(modalId, trigger);
    }
}

/**
 * @param {MouseEvent} e
 */
function handleCloseClick(e) {
    // Close button click
    const closeBtn = e.target.closest(SELECTORS.closeTrigger);
    if (closeBtn) {
        e.preventDefault();
        const modal = closeBtn.closest(SELECTORS.modal);
        if (modal) closeModal(modal);
        return;
    }

    // Overlay click (click outside modal content)
    const overlay = e.target.closest(SELECTORS.overlay);
    if (overlay) {
        // Make sure click was on the overlay itself, not on modal content
        const modalContent = overlay.querySelector(SELECTORS.modalContent);
        if (modalContent && !modalContent.contains(e.target)) {
            const modal = overlay.closest(SELECTORS.modal);
            if (modal) closeModal(modal);
        }
    }
}

/**
 * Global keydown handler for Escape to close.
 * @param {KeyboardEvent} e
 */
function handleKeyDown(e) {
    if (e.key !== 'Escape') return;
    // Close the top-most modal
    const modalsArr = Array.from(openModals);
    if (modalsArr.length > 0) {
        e.preventDefault();
        closeModal(modalsArr[modalsArr.length - 1]);
    }
}

/* --------------------------------------------------------------------------
   Focus Trap
   -------------------------------------------------------------------------- */

/**
 * Trap Tab key within the top-most open modal.
 * @param {KeyboardEvent} e
 */
function trapFocus(e) {
    if (e.key !== 'Tab') return;
    if (openModals.size === 0) return;

    // Get top-most modal
    const modalsArr = Array.from(openModals);
    const activeModal = modalsArr[modalsArr.length - 1];
    if (!activeModal) return;

    const focusable = getFocusableElements(activeModal);
    if (focusable.length === 0) {
        e.preventDefault();
        return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
        if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
        }
    } else {
        if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }
}

/* --------------------------------------------------------------------------
   Lightbox Mode
   -------------------------------------------------------------------------- */

/** @type {HTMLElement[]} */
let lightboxImages = [];
/** @type {number} */
let lightboxIndex = 0;

/**
 * Initialise a modal in lightbox mode.
 * @param {string} modalId
 * @param {HTMLElement} trigger
 */
function initLightbox(modalId, trigger) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    // Collect all lightbox triggers in the same gallery
    const galleryId = trigger.getAttribute('data-gallery') || trigger.getAttribute('data-lightbox');
    const allTriggers = document.querySelectorAll(
        galleryId
            ? `[data-lightbox="${galleryId}"]`
            : '[data-lightbox]'
    );

    lightboxImages = Array.from(allTriggers);
    lightboxIndex = lightboxImages.indexOf(trigger);
    if (lightboxIndex < 0) lightboxIndex = 0;

    loadLightboxImage(modal);
    openModal(modal, trigger);

    // Set up prev/next
    const prevBtn = modal.querySelector(SELECTORS.lightboxPrev);
    const nextBtn = modal.querySelector(SELECTORS.lightboxNext);

    if (prevBtn) {
        prevBtn.onclick = (e) => {
            e.preventDefault();
            lightboxIndex = (lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
            loadLightboxImage(modal);
        };
    }

    if (nextBtn) {
        nextBtn.onclick = (e) => {
            e.preventDefault();
            lightboxIndex = (lightboxIndex + 1) % lightboxImages.length;
            loadLightboxImage(modal);
        };
    }

    // Keyboard prev/next
    function onLightboxKey(e) {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            lightboxIndex = (lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
            loadLightboxImage(modal);
        }
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            lightboxIndex = (lightboxIndex + 1) % lightboxImages.length;
            loadLightboxImage(modal);
        }
    }
    modal.addEventListener('keydown', onLightboxKey);

    // Clean up on close
    modal.addEventListener(
        'modal:close',
        () => {
            modal.removeEventListener('keydown', onLightboxKey);
            lightboxImages = [];
            lightboxIndex = 0;
        },
        { once: true }
    );
}

/**
 * Load the image at current lightboxIndex into the lightbox modal.
 * @param {HTMLElement} modal
 */
function loadLightboxImage(modal) {
    if (lightboxIndex < 0 || lightboxIndex >= lightboxImages.length) return;

    const trigger = lightboxImages[lightboxIndex];
    const imgEl = modal.querySelector('img');
    const counterEl = modal.querySelector('[data-lightbox-counter]');

    const src = trigger.getAttribute('data-lightbox-src') || trigger.getAttribute('href') || trigger.src;
    const caption = trigger.getAttribute('data-lightbox-caption') || trigger.getAttribute('data-caption') || '';

    if (imgEl && src) {
        imgEl.src = src;
        imgEl.alt = caption || imgEl.alt;
    }

    if (counterEl && lightboxImages.length > 1) {
        counterEl.textContent = `${lightboxIndex + 1}/${lightboxImages.length}`;
    }

    // Update thumbnail strip highlight
    const thumbStrip = modal.querySelector('[data-lightbox-thumbs]');
    if (thumbStrip) {
        const thumbs = thumbStrip.querySelectorAll('[data-lightbox-thumb]');
        thumbs.forEach((t, i) => {
            t.classList.toggle('is-active', i === lightboxIndex);
        });
    }
}
