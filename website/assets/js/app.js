/* ==========================================================================
   app.js — Main Entry Point
   CalmRio — Premium Vacation Rentals, Royan & Saint-Trojan-les-Bains
   Initialises all JavaScript modules and components.
   ========================================================================== */

import { initNavigation } from './modules/navigation.js';
import { initScrollAnimations } from './modules/animations.js';
import { initAccordion } from './modules/accordion.js';
import { initTabs } from './modules/tabs.js';
import { initModals } from './components/modals.js';
import { initForms } from './components/forms.js';
import { initCounters } from './modules/counters.js';
import { initTestimonials } from './components/testimonials.js';
import { initGallery } from './components/gallery.js';
import { initSmoothScroll } from './modules/smooth-scroll.js';
import { initLazyLoading } from './modules/lazy-load.js';
import { initBookingSystems } from './modules/booking-init.js';
import { initGalleryLightbox } from './modules/gallery-lightbox.js';

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initScrollAnimations();
    initAccordion();
    initTabs();
    initModals();
    initForms();
    initCounters();
    initTestimonials();
    initGallery();
    initGalleryLightbox();
    initSmoothScroll();
    initLazyLoading();
    initBookingSystems();
});
