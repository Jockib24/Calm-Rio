/* ==========================================================================
   tabs.js — Accessible Tabs Component
   CalmRio — Premium Vacation Rentals, Royan & Saint-Trojan-les-Bains
   Features: keyboard nav, ARIA, URL hash sync, responsive
   ========================================================================== */

import { on, generateId, getQueryParam, onDirect, debounce } from '../utils/helpers.js';

const SELECTORS = {
    tablist: '[role="tablist"]',
    tab: '[role="tab"]',
    tabpanel: '[role="tabpanel"]',
    tabButton: '.tab__button',
    tabPanel: '.tab__panel',
    tabContainer: '[data-tabs]',
};

const CLASSES = {
    active: 'is-active',
};

/** @type {Map<HTMLElement,{tabs:HTMLElement[],panels:HTMLElement[]}>} */
let tabGroups = new Map();

/** @type {Function[]} */
let cleanups = [];

/* --------------------------------------------------------------------------
   Public: init
   -------------------------------------------------------------------------- */

/**
 * Initialise all tab components on the page.
 */
export function initTabs() {
    const containers = document.querySelectorAll(SELECTORS.tabContainer);

    containers.forEach((container, index) => {
        initTabGroup(container, index);
    });
}

/* --------------------------------------------------------------------------
   Public: destroy
   -------------------------------------------------------------------------- */

/**
 * Clean up all listeners.
 */
export function destroyTabs() {
    cleanups.forEach((fn) => fn());
    cleanups = [];
    tabGroups.clear();
}

/* --------------------------------------------------------------------------
   Init a single tab group
   -------------------------------------------------------------------------- */

/**
 * @param {HTMLElement} container
 * @param {number} groupIndex
 */
function initTabGroup(container, groupIndex) {
    const tabs = Array.from(container.querySelectorAll(SELECTORS.tabButton));
    const panels = Array.from(container.querySelectorAll(SELECTORS.tabPanel));

    if (!tabs.length || !panels.length) return;

    // Set up IDs and ARIA
    const baseId = container.id || generateId(`tabs-${groupIndex}`);

    tabs.forEach((tab, i) => {
        const panel = panels[i];
        if (!panel) return;

        const tabId = `${baseId}-tab-${i}`;
        const panelId = `${baseId}-panel-${i}`;

        tab.id = tabId;
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-selected', 'false');
        tab.setAttribute('aria-controls', panelId);
        tab.setAttribute('tabindex', '-1');

        panel.id = panelId;
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', tabId);
        panel.setAttribute('tabindex', '0');
        panel.hidden = true;
    });

    // Store for later
    tabGroups.set(container, { tabs, panels });

    // Determine which tab to activate first
    let activeIndex = 0;

    // Check data-active attribute on tabs
    const preActiveTab = tabs.findIndex((t) => t.hasAttribute('data-active') || t.dataset.active === 'true');
    if (preActiveTab >= 0) activeIndex = preActiveTab;

    // Check URL hash for tab
    const hash = window.location.hash;
    if (hash) {
        const hashIndex = tabs.findIndex((t) => {
            const href = t.getAttribute('href') || t.getAttribute('data-tab');
            return href === hash || href === `#${hash.replace('#', '')}`;
        });
        if (hashIndex >= 0) activeIndex = hashIndex;
    }

    activateTab(container, activeIndex);

    // Click delegation
    const removeClick = on(container, 'click', SELECTORS.tabButton, (e, tab) => {
        e.preventDefault();
        const idx = tabs.indexOf(tab);
        if (idx >= 0) activateTab(container, idx);
    });
    cleanups.push(removeClick);

    // Keyboard navigation
    const removeKey = on(container, 'keydown', SELECTORS.tabButton, (e, tab) => {
        const idx = tabs.indexOf(tab);
        if (idx < 0) return;

        let newIdx = idx;

        switch (e.key) {
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                newIdx = idx - 1;
                if (newIdx < 0) newIdx = tabs.length - 1;
                break;
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                newIdx = idx + 1;
                if (newIdx >= tabs.length) newIdx = 0;
                break;
            case 'Home':
                e.preventDefault();
                newIdx = 0;
                break;
            case 'End':
                e.preventDefault();
                newIdx = tabs.length - 1;
                break;
            default:
                return;
        }

        activateTab(container, newIdx);
        tabs[newIdx]?.focus();
    });
    cleanups.push(removeKey);
}

/* --------------------------------------------------------------------------
   Activate a tab by index
   -------------------------------------------------------------------------- */

/**
 * @param {HTMLElement} container
 * @param {number} index
 */
function activateTab(container, index) {
    const group = tabGroups.get(container);
    if (!group) return;

    const { tabs, panels } = group;

    tabs.forEach((tab, i) => {
        const isActive = i === index;
        tab.classList.toggle(CLASSES.active, isActive);
        tab.setAttribute('aria-selected', String(isActive));
        tab.setAttribute('tabindex', isActive ? '0' : '-1');
    });

    panels.forEach((panel, i) => {
        panel.hidden = i !== index;
        if (i === index) {
            panel.classList.add(CLASSES.active);
        } else {
            panel.classList.remove(CLASSES.active);
        }
    });

    // Update URL hash if tab has a data-hash or href
    const activeTab = tabs[index];
    if (activeTab) {
        const hashAttr = activeTab.getAttribute('data-hash') || activeTab.getAttribute('href');
        if (hashAttr && hashAttr.startsWith('#')) {
            // Replace state so we don't spam history
            const url = new URL(window.location.href);
            url.hash = hashAttr;
            history.replaceState(null, '', url.toString());
        }
    }
}

/* --------------------------------------------------------------------------
   Public: activateTabByHash
   -------------------------------------------------------------------------- */

/**
 * Activate a tab based on a hash value. Useful for deep-linking.
 * @param {string} hash — e.g. '#reviews'
 */
export function activateTabByHash(hash) {
    const containers = document.querySelectorAll(SELECTORS.tabContainer);
    containers.forEach((container) => {
        const group = tabGroups.get(container);
        if (!group) return;
        const idx = group.tabs.findIndex((t) => {
            const h = t.getAttribute('data-hash') || t.getAttribute('href');
            return h === hash;
        });
        if (idx >= 0) activateTab(container, idx);
    });
}
