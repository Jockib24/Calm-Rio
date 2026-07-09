// ============================================================
// CalmRio — Vite Entry Point
// Imports SCSS for Vite to process + boots all modules
// ============================================================

// Import SCSS — Vite extracts this to a separate CSS file on build
import '../scss/main.scss'

// Import and boot all application modules
import { initNavigation } from './modules/navigation.js'
import { initScrollAnimations } from './modules/animations.js'
import { initSmoothScroll } from './modules/smooth-scroll.js'
import { initLazyLoading } from './modules/lazy-load.js'
import { initTestimonials, initPropertyReviews } from './components/testimonials.js'
import { initCounters } from './modules/counters.js'
import { initGallery } from './components/gallery.js'
import { initGalleryLightbox } from './modules/gallery-lightbox.js'
import { initModals } from './components/modals.js'
import { initForms } from './components/forms.js'
import { initAccordion } from './modules/accordion.js'
import { initTabs } from './modules/tabs.js'
import { initAvailabilityCalendar } from './modules/availability-calendar.js'
import { initBookingSystems } from './modules/booking-init.js'
import { initThemeToggle } from './modules/theme-toggle.js'
import { initLanguageSwitcher } from './modules/language-switcher.js'
import { initStickyBar } from './modules/sticky-bar.js'
import { initHeroSlider } from './modules/hero-slider.js'
import { initAnalytics } from './modules/analytics.js'
import { initMapModule } from './modules/map.js'

// Boot on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  initNavigation()
  initScrollAnimations()
  initSmoothScroll()
  initLazyLoading()
  initTestimonials()
  initPropertyReviews()
  initCounters()
  initGallery()
  initGalleryLightbox()
  initModals()
  initForms()
  initAccordion()
  initTabs()
  initAvailabilityCalendar()
  initBookingSystems()
  initThemeToggle()
  initLanguageSwitcher()
  initStickyBar()
  initHeroSlider()
  initAnalytics()
  initMapModule()
})
