/* ==========================================================================
   accordion.js — Accessible Accordion Component
   CalmRio — Premium Vacation Rentals, Royan & Saint-Trojan-les-Bains
   Features: max-height animation, single/multi mode, keyboard, ARIA
   ========================================================================== */

import { on, generateId } from '../utils/helpers.js';

const SELECTOR_TRIGGER = '.accordion__trigger';
const SELECTOR_CONTENT = '.accordion__content';
const SELECTOR_ITEM = '.accordion__item';
const SELECTOR_ICON = '.accordion__icon';

const CLASSES = {
    active: 'is-active',
    open: 'is-open',
};

/** @type {Map<HTMLElement,{trigger:HTMLElement,content:HTMLElement,icon:HTMLElement|null}>} */
let accordionMap = new Map();

/** @type {Function[]} */
let cleanups = [];

/* --------------------------------------------------------------------------
   Public: init
   -------------------------------------------------------------------------- */

/**
 * Initialise all accordion instances on the page.
 */
export function initAccordion() {
    const containers = document.querySelectorAll('[data-accordion]');
    if (!containers.length) return;

    containers.forEach((container) => {
        const allowMultiple = container.getAttribute('data-accordion') === 'multi';
        initAccordionContainer(container, allowMultiple);
    });
}

/* --------------------------------------------------------------------------
   Public: destroy
   -------------------------------------------------------------------------- */

/**
 * Remove all event listeners and clean up.
 */
export function destroyAccordion() {
    cleanups.forEach((fn) => fn());
    cleanups = [];
    accordionMap.clear();
}

/* --------------------------------------------------------------------------
   Init a single accordion container
   -------------------------------------------------------------------------- */

/**
 * @param {HTMLElement} container
 * @param {boolean} allowMultiple — whether multiple items can be open
 */
function initAccordionContainer(container, allowMultiple) {
    const items = container.querySelectorAll(SELECTOR_ITEM);

    items.forEach((item) => {
        const trigger = item.querySelector(SELECTOR_TRIGGER);
        const content = item.querySelector(SELECTOR_CONTENT);
        const icon = item.querySelector(SELECTOR_ICON);

        if (!trigger || !content) return;

        // Set up ARIA and IDs
        const contentId = content.id || generateId('accordion-panel');
        const triggerId = trigger.id || generateId('accordion-trigger');

        content.id = contentId;
        trigger.id = triggerId;

        trigger.setAttribute('role', 'button');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.setAttribute('aria-controls', contentId);
        trigger.setAttribute('tabindex', '0');

        if (!trigger.hasAttribute('aria-expanded') || trigger.getAttribute('aria-expanded') === 'false') {
            content.setAttribute('aria-hidden', 'true');
        }
        content.setAttribute('role', 'region');
        content.setAttribute('aria-labelledby', triggerId);

        // Map item to its elements
        accordionMap.set(item, { trigger, content, icon });

        // Initial state from .is-active
        if (item.classList.contains(CLASSES.active)) {
            openItem(item, false);
        }
    });

    // Event delegation on the container
    const removeClick = on(container, 'click', SELECTOR_TRIGGER, (e, trigger) => {
        e.preventDefault();
        const item = trigger.closest(SELECTOR_ITEM);
        if (!item) return;
        toggleItem(item, allowMultiple);
    });

    const removeKey = on(container, 'keydown', SELECTOR_TRIGGER, (e, trigger) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const item = trigger.closest(SELECTOR_ITEM);
            if (!item) return;
            toggleItem(item, allowMultiple);
        }
    });

    cleanups.push(removeClick, removeKey);
}

/* --------------------------------------------------------------------------
   Toggle an accordion item
   -------------------------------------------------------------------------- */

/**
 * @param {HTMLElement} item — the .accordion__item element
 * @param {boolean} allowMultiple
 */
function toggleItem(item, allowMultiple) {
    const isOpen = item.classList.contains(CLASSES.active);

    if (!allowMultiple) {
        // Close all siblings
        const container = item.parentElement;
        if (container) {
            container.querySelectorAll(`${SELECTOR_ITEM}.${CLASSES.active}`).forEach((sibling) => {
                if (sibling !== item) closeItem(sibling);
            });
        }
    }

    if (isOpen) {
        closeItem(item);
    } else {
        openItem(item, true);
    }
}

/* --------------------------------------------------------------------------
   Open an item
   -------------------------------------------------------------------------- */

/**
 * @param {HTMLElement} item
 * @param {boolean} animate — whether to animate the height
 */
function openItem(item, animate = true) {
    const data = accordionMap.get(item);
    if (!data) return;

    const { trigger, content, icon } = data;

    item.classList.add(CLASSES.active);
    trigger.setAttribute('aria-expanded', 'true');
    content.setAttribute('aria-hidden', 'false');

    if (icon) {
        icon.style.transform = 'rotate(180deg)';
    }

    if (animate) {
        animateOpen(content);
    } else {
        content.style.maxHeight = 'none';
    }
}

/* --------------------------------------------------------------------------
   Close an item
   -------------------------------------------------------------------------- */

/**
 * @param {HTMLElement} item
 */
function closeItem(item) {
    const data = accordionMap.get(item);
    if (!data) return;

    const { trigger, content, icon } = data;

    item.classList.remove(CLASSES.active);
    trigger.setAttribute('aria-expanded', 'false');
    content.setAttribute('aria-hidden', 'true');

    if (icon) {
        icon.style.transform = 'rotate(0deg)';
    }

    animateClose(content);
}

/* --------------------------------------------------------------------------
   Height animation helpers
   -------------------------------------------------------------------------- */

/**
 * Animate opening by setting max-height to scrollHeight.
 * @param {HTMLElement} el
 */
function animateOpen(el) {
    el.style.maxHeight = '0px';
    // Force reflow
    el.offsetHeight; // eslint-disable-line no-unused-expressions
    el.style.maxHeight = `${el.scrollHeight}px`;

    const onTransitionEnd = () => {
        el.style.maxHeight = 'none';
        el.removeEventListener('transitionend', onTransitionEnd);
    };
    el.addEventListener('transitionend', onTransitionEnd, { once: true });
}

/**
 * Animate closing by setting max-height to scrollHeight first, then 0.
 * @param {HTMLElement} el
 */
function animateClose(el) {
    // Set to current height so transition can animate to 0
    el.style.maxHeight = `${el.scrollHeight}px`;
    // Force reflow
    el.offsetHeight; // eslint-disable-line no-unused-expressions
    el.style.maxHeight = '0px';
}
