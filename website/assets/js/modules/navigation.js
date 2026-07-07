/* ==========================================================================
   navigation.js — Full Navigation System
   CalmRio — Premium Vacation Rentals, Royan & Saint-Trojan-les-Bains
   Features: mobile toggle, sticky header, scroll spy, keyboard nav, ARIA
   ========================================================================== */

import { debounce, throttle, onDirect } from '../utils/helpers.js';

const SELECTORS = {
    header: '.site-header',
    mobileToggle: '.nav__toggle',
    mobileMenu: '.nav__mobile-menu',
    navLinks: '.nav__link',
    sectionTargets: '[data-section]',
};

const CLASSES = {
    sticky: 'header--sticky',
    scrolled: 'header--scrolled',
    mobileOpen: 'is-open',
    active: 'is-active',
    activeLink: 'nav__link--active',
};

/** @type {HTMLElement|null} */
let header = null;
/** @type {HTMLElement|null} */
let toggleBtn = null;
/** @type {HTMLElement|null} */
let mobileMenu = null;
/** @type {boolean} */
let menuOpen = false;
/** @type {Function[]} */
let cleanups = [];

/* --------------------------------------------------------------------------
   Public: init
   -------------------------------------------------------------------------- */

/**
 * Initialise the navigation system.
 */
export function initNavigation() {
    header = document.querySelector(SELECTORS.header);
    toggleBtn = document.querySelector(SELECTORS.mobileToggle);
    mobileMenu = document.querySelector(SELECTORS.mobileMenu);

    if (!header) return;

    initMobileToggle();
    initStickyHeader();
    initScrollSpy();
    initKeyboardNav();
    initCloseOnEscape();
    initCloseOnClickOutside();
    initCloseOnLinkClick();
    initResizeHandler();
}

/* --------------------------------------------------------------------------
   Public: destroy (for SPA-style teardown)
   -------------------------------------------------------------------------- */

/**
 * Remove all event listeners. Call before re-initialising.
 */
export function destroyNavigation() {
    cleanups.forEach((fn) => fn());
    cleanups = [];
    menuOpen = false;
    if (header) header.classList.remove(CLASSES.sticky, CLASSES.scrolled);
    if (mobileMenu) mobileMenu.classList.remove(CLASSES.mobileOpen);
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
}

/* --------------------------------------------------------------------------
   Mobile Toggle
   -------------------------------------------------------------------------- */

function initMobileToggle() {
    if (!toggleBtn || !mobileMenu) return;

    const handler = () => toggleMobileMenu();
    cleanups.push(onDirect(toggleBtn, 'click', handler));

    // Ensure proper ARIA on init
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.setAttribute('aria-controls', mobileMenu.id || 'nav-mobile-menu');
    if (!mobileMenu.id) mobileMenu.id = 'nav-mobile-menu';
    toggleBtn.setAttribute('aria-label', toggleBtn.getAttribute('aria-label') || 'Open navigation menu');
    mobileMenu.setAttribute('role', 'navigation');
    mobileMenu.setAttribute('aria-label', 'Mobile navigation');
}

function toggleMobileMenu(force) {
    menuOpen = typeof force === 'boolean' ? force : !menuOpen;

    if (menuOpen) {
        mobileMenu?.classList.add(CLASSES.mobileOpen);
        toggleBtn?.classList.add(CLASSES.active);
        toggleBtn?.setAttribute('aria-expanded', 'true');
        toggleBtn?.setAttribute('aria-label', 'Close navigation menu');
        document.body.classList.add('nav-is-open');
        // Focus first link in mobile menu
        const firstLink = mobileMenu?.querySelector(SELECTORS.navLinks);
        setTimeout(() => firstLink?.focus(), 100);
    } else {
        mobileMenu?.classList.remove(CLASSES.mobileOpen);
        toggleBtn?.classList.remove(CLASSES.active);
        toggleBtn?.setAttribute('aria-expanded', 'false');
        toggleBtn?.setAttribute('aria-label', 'Open navigation menu');
        document.body.classList.remove('nav-is-open');
        toggleBtn?.focus();
    }
}

/* --------------------------------------------------------------------------
   Sticky Header
   -------------------------------------------------------------------------- */

function initStickyHeader() {
    if (!header) return;

    const scrollThreshold = header.offsetHeight || 80;

    // Determine initial state
    if (window.scrollY > scrollThreshold) {
        header.classList.add(CLASSES.sticky);
    }

    const onScroll = throttle(() => {
        if (window.scrollY > scrollThreshold) {
            header.classList.add(CLASSES.sticky);
            // Add scrolled class for further styling after a secondary threshold
            if (window.scrollY > scrollThreshold + 60) {
                header.classList.add(CLASSES.scrolled);
            } else {
                header.classList.remove(CLASSES.scrolled);
            }
        } else {
            header.classList.remove(CLASSES.sticky, CLASSES.scrolled);
        }
    }, 50);

    cleanups.push(onDirect(window, 'scroll', onScroll, { passive: true }));
}

/* --------------------------------------------------------------------------
   Scroll Spy — highlight nav links based on visible section
   -------------------------------------------------------------------------- */

function initScrollSpy() {
    const sections = document.querySelectorAll(SELECTORS.sectionTargets);
    const navLinks = document.querySelectorAll(SELECTORS.navLinks);
    if (!sections.length || !navLinks.length) return;

    const onScroll = throttle(() => {
        let currentId = '';
        const scrollY = window.scrollY + (header?.offsetHeight || 80) + 20;

        sections.forEach((section) => {
            const top = section.offsetTop - (header?.offsetHeight || 80) - 10;
            const bottom = top + section.offsetHeight;
            if (scrollY >= top && scrollY < bottom) {
                currentId = section.getAttribute('id') || section.getAttribute('data-section');
            }
        });

        navLinks.forEach((link) => {
            link.classList.remove(CLASSES.activeLink);
            const href = link.getAttribute('href') || '';
            if (href.includes(`#${currentId}`) || href === `#${currentId}`) {
                link.classList.add(CLASSES.activeLink);
            }
        });
    }, 100);

    cleanups.push(onDirect(window, 'scroll', onScroll, { passive: true }));
    // Fire once on load
    onScroll();
}

/* --------------------------------------------------------------------------
   Keyboard Navigation for mobile menu
   -------------------------------------------------------------------------- */

function initKeyboardNav() {
    if (!mobileMenu) return;

    const handler = (e) => {
        if (!menuOpen) return;
        if (e.key === 'Escape') {
            e.preventDefault();
            toggleMobileMenu(false);
        }
    };
    cleanups.push(onDirect(document, 'keydown', handler));
}

/* --------------------------------------------------------------------------
   Escape to close
   -------------------------------------------------------------------------- */

function initCloseOnEscape() {
    const handler = (e) => {
        if (e.key === 'Escape' && menuOpen) {
            e.preventDefault();
            toggleMobileMenu(false);
        }
    };
    cleanups.push(onDirect(document, 'keydown', handler));
}

/* --------------------------------------------------------------------------
   Close on click outside
   -------------------------------------------------------------------------- */

function initCloseOnClickOutside() {
    if (!mobileMenu) return;

    const handler = (e) => {
        if (!menuOpen) return;
        const clickedOutside =
            !mobileMenu.contains(e.target) &&
            !toggleBtn?.contains(e.target);
        if (clickedOutside) {
            toggleMobileMenu(false);
        }
    };
    cleanups.push(onDirect(document, 'click', handler));
    cleanups.push(onDirect(document, 'touchend', handler, { passive: true }));
}

/* --------------------------------------------------------------------------
   Close on nav link click (mobile only)
   -------------------------------------------------------------------------- */

function initCloseOnLinkClick() {
    if (!mobileMenu) return;

    mobileMenu.addEventListener(
        'click',
        (e) => {
            // Close if the clicked element is a nav link inside the mobile menu
            const link = e.target.closest(SELECTORS.navLinks);
            if (link && menuOpen) {
                // Small delay so the link navigation happens before the menu closes
                setTimeout(() => toggleMobileMenu(false), 100);
            }
        },
        { passive: false }
    );
}

/* --------------------------------------------------------------------------
   Handle resize — close mobile menu when transitioning to desktop
   -------------------------------------------------------------------------- */

function initResizeHandler() {
    const onResize = debounce(() => {
        if (window.innerWidth >= 1024 && menuOpen) {
            toggleMobileMenu(false);
        }
    }, 200);
    cleanups.push(onDirect(window, 'resize', onResize, { passive: true }));
}
