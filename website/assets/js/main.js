// ============================================================
// CalmRio — Vite Entry Point
// Imports SCSS + boots core modules immediately, lazy-loads
// page-specific modules based on DOM element presence.
// ============================================================

// Import SCSS — Vite extracts this to a separate CSS file on build
import '../scss/main.scss'

// ------------------------------------------------------------
// CORE MODULES — loaded on EVERY page (always needed)
// ------------------------------------------------------------
import { initNavigation } from './modules/navigation.js'
import { initScrollAnimations } from './modules/animations.js'
import { initSmoothScroll } from './modules/smooth-scroll.js'
import { initLazyLoading } from './modules/lazy-load.js'
import { initModals } from './components/modals.js'
import { initForms } from './components/forms.js'
import { initThemeToggle } from './modules/theme-toggle.js'
import { initLanguageSwitcher } from './modules/language-switcher.js'
import { initAnalytics } from './modules/analytics.js'

// ------------------------------------------------------------
// PAGE-SPECIFIC MODULES — lazy-loaded when DOM elements exist
// Each check is a lightweight document.querySelector; imported
// dynamically to create separate chunks via code-splitting.
// ------------------------------------------------------------
function maybeImport(selector, importFn) {
  if (document.querySelector(selector)) {
    importFn().then(mod => {
      const fn = Object.values(mod)[0]
      if (typeof fn === 'function') fn()
    }).catch(err => {
      console.warn('[CalmRio] Failed to lazy-load module for "' + selector + '":', err)
    })
  }
}

// Boot core modules immediately on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  initNavigation()
  initScrollAnimations()
  initSmoothScroll()
  initLazyLoading()
  initModals()
  initForms()
  initThemeToggle()
  initLanguageSwitcher()
  initAnalytics()

  // ------ LAZY-LOADED: Hero Slider (homepage) ------
  maybeImport('.hero__slider', () => import('./modules/hero-slider.js'))

  // ------ LAZY-LOADED: Counters (homepage stats) ------
  maybeImport('[data-counter]', () => import('./modules/counters.js'))

  // ------ LAZY-LOADED: Testimonials slider (homepage) ------
  maybeImport('#testimonials-slider', () => import('./components/testimonials.js'))

  // ------ LAZY-LOADED: Tabs (property detail pages) ------
  maybeImport('[data-tabs]', () => import('./modules/tabs.js'))

  // ------ LAZY-LOADED: Accordion (FAQ page) ------
  maybeImport('.faq-accordion, [data-accordion]', () => import('./modules/accordion.js'))

  // ------ LAZY-LOADED: Gallery + Lightbox (property pages) ------
  maybeImport('[data-gallery]', () => import('./components/gallery.js'))
  maybeImport('[data-gallery]', () => import('./modules/gallery-lightbox.js'))

  // ------ LAZY-LOADED: Availability Calendar (property pages) ------
  maybeImport('#availability-calendar', () => import('./modules/availability-calendar.js'))

  // ------ LAZY-LOADED: Booking Systems (property pages) ------
  maybeImport('#booking-section', () => import('./modules/booking-init.js'))

  // ------ LAZY-LOADED: Sticky Booking Bar (property pages) ------
  maybeImport('[data-sticky-bar]', () => import('./modules/sticky-bar.js'))

  // ------ LAZY-LOADED: Map (property & contact pages) ------
  maybeImport('[data-map], .property-map', () => import('./modules/map.js'))

  // ------ LAZY-LOADED: Email Forms (any page with forms) ------
  maybeImport('[data-email-form]', () => import('./modules/email-form-handler.js'))
})
