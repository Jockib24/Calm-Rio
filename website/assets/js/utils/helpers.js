/* ==========================================================================
   helpers.js — Utility Functions
   CalmRio — Premium Vacation Rentals, Royan & Saint-Trojan-les-Bains
   Vanilla ES6+, no dependencies
   ========================================================================== */

/**
 * Debounce — limits the rate at which a function can fire.
 * @param {Function} fn — the function to debounce
 * @param {number} delay — milliseconds to wait
 * @returns {Function} debounced function
 */
export function debounce(fn, delay = 200) {
    let timer = null;
    return function (...args) {
        const ctx = this;
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(ctx, args), delay);
    };
}

/**
 * Throttle — ensures a function is called at most once per limit.
 * @param {Function} fn — the function to throttle
 * @param {number} limit — milliseconds between invocations
 * @returns {Function} throttled function
 */
export function throttle(fn, limit = 200) {
    let inThrottle = false;
    let lastArgs = null;
    let lastCtx = null;

    function execute() {
        if (lastArgs) {
            fn.apply(lastCtx, lastArgs);
            lastArgs = null;
            lastCtx = null;
            setTimeout(execute, limit);
        } else {
            inThrottle = false;
        }
    }

    return function (...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(execute, limit);
        } else {
            lastArgs = args;
            lastCtx = this;
        }
    };
}

/**
 * Check if an element is in the viewport.
 * @param {HTMLElement} el
 * @param {number} [offset=0] — extra margin around element
 * @returns {boolean}
 */
export function isInViewport(el, offset = 0) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const winH = window.innerHeight || document.documentElement.clientHeight;
    const winW = window.innerWidth || document.documentElement.clientWidth;
    return (
        rect.top + offset < winH &&
        rect.bottom - offset > 0 &&
        rect.left + offset < winW &&
        rect.right - offset > 0
    );
}

/**
 * Get current scroll position.
 * @returns {{x: number, y: number}}
 */
export function getScrollPosition() {
    return {
        x: window.pageXOffset ?? document.documentElement.scrollLeft ?? 0,
        y: window.pageYOffset ?? document.documentElement.scrollTop ?? 0,
    };
}

/**
 * Get an element's offset from the top of the document.
 * @param {HTMLElement} el
 * @returns {{top: number, left: number}}
 */
export function getOffset(el) {
    if (!el) return { top: 0, left: 0 };
    const rect = el.getBoundingClientRect();
    const scroll = getScrollPosition();
    return {
        top: rect.top + scroll.y,
        left: rect.left + scroll.x,
    };
}

/**
 * Format a number with commas for display.
 * @param {number} num
 * @returns {string}
 */
export function formatNumber(num) {
    if (typeof num !== 'number') return String(num);
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Sanitize a string by stripping HTML tags.
 * @param {string} str
 * @returns {string}
 */
export function sanitizeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Escape regex special characters in a string.
 * @param {string} str
 * @returns {string}
 */
export function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generate a unique ID with optional prefix.
 * @param {string} [prefix='id']
 * @returns {string}
 */
export function generateId(prefix = 'id') {
    const random = Math.random().toString(36).substring(2, 10);
    const timestamp = Date.now().toString(36);
    return `${prefix}-${timestamp}-${random}`;
}

/**
 * Get query parameter value from URL.
 * @param {string} name — parameter name
 * @returns {string|null}
 */
export function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}

/* --------------------------------------------------------------------------
   Cookie Helpers
   -------------------------------------------------------------------------- */

/**
 * Set a cookie.
 * @param {string} name
 * @param {string} value
 * @param {number} [days=30] — expiry in days
 * @param {string} [path='/']
 */
export function setCookie(name, value, days = 30, path = '/') {
    let expires = '';
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = `; expires=${date.toUTCString()}`;
    }
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}${expires}; path=${path}; SameSite=Lax`;
}

/**
 * Get a cookie by name.
 * @param {string} name
 * @returns {string|null}
 */
export function getCookie(name) {
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${escapeRegExp(encodeURIComponent(name))}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Delete a cookie.
 * @param {string} name
 * @param {string} [path='/']
 */
export function deleteCookie(name, path = '/') {
    document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
}

/* --------------------------------------------------------------------------
   Device / Environment Detection
   -------------------------------------------------------------------------- */

let _isTouch = null;

/**
 * Detect whether the device supports touch.
 * @returns {boolean}
 */
export function detectTouch() {
    if (_isTouch === null) {
        _isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
    }
    return _isTouch;
}

/**
 * Check if user prefers reduced motion.
 * @returns {boolean}
 */
export function prefersReducedMotion() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Emits true while viewport width ≤ 767px.
 * @returns {boolean}
 */
export function isMobile() {
    return window.innerWidth <= 767;
}

/**
 * Emits true while viewport width is 768px—1023px.
 * @returns {boolean}
 */
export function isTablet() {
    const w = window.innerWidth;
    return w >= 768 && w <= 1023;
}

/**
 * Emits true while viewport width ≥ 1024px.
 * @returns {boolean}
 */
export function isDesktop() {
    return window.innerWidth >= 1024;
}

/* --------------------------------------------------------------------------
   DOM Event Helpers
   -------------------------------------------------------------------------- */

/**
 * Delegated event binding — listens on `el` for events on `selector`.
 * @param {HTMLElement|Document} el — container element
 * @param {string} event — event name (e.g. 'click')
 * @param {string} selector — CSS selector for delegation
 * @param {Function} handler — callback receiving (event, matchedElement)
 * @param {boolean|AddEventListenerOptions} [options] — addEventListener options
 * @returns {Function} cleanup function that removes the listener
 */
export function on(el, event, selector, handler, options = false) {
    if (!el) return () => {};

    const listener = (e) => {
        const target = e.target.closest(selector);
        if (target && el.contains(target)) {
            handler.call(target, e, target);
        }
    };

    el.addEventListener(event, listener, options);
    return () => el.removeEventListener(event, listener, options);
}

/**
 * Simple on() that calls handler directly (no delegation).
 * @param {HTMLElement|Document} el
 * @param {string} event
 * @param {Function} handler
 * @param {boolean|AddEventListenerOptions} [options]
 * @returns {Function} cleanup
 */
export function onDirect(el, event, handler, options = false) {
    if (!el) return () => {};
    el.addEventListener(event, handler, options);
    return () => el.removeEventListener(event, handler, options);
}

/**
 * Lock body scroll — saves scroll position, fixes body, restores on cleanup.
 * Prevents page jump to top on mobile when opening overlays/modals.
 * @returns {Function} — cleanup / unlock function
 */
export function lockBodyScroll() {
    const scrollY = window.scrollY;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
    if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        window.scrollTo(0, scrollY);
    };
}

/**
 * Get all focusable descendants of a container (for focus trapping).
 * @param {HTMLElement} container
 * @returns {HTMLElement[]}
 */
export function getFocusableElements(container) {
    if (!container) return [];
    const selectors = [
        'a[href]',
        'area[href]',
        'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'button:not([disabled])',
        'iframe',
        'object',
        'embed',
        '[contenteditable]',
        '[tabindex]:not([tabindex="-1"])',
    ];
    const elements = Array.from(container.querySelectorAll(selectors.join(',')));
    return elements.filter((el) => {
        const style = getComputedStyle(el);
        return style.visibility !== 'hidden' && style.display !== 'none';
    });
}
