// ============================================================
// hero-slider.js — Fullscreen Hero Background Slideshow
// CalmRio — Premium Vacation Rentals, Royan & Île d'Oléron
// Crossfade carousel using local property + attraction photos
// ============================================================

// --------------------------------------------------------------------------
// Image data — mix of real property photos and local attraction spots
// --------------------------------------------------------------------------
const HERO_IMAGES = [
  // Properties
  { a: '/Calm-Rio/assets/images/properties/3577b5b7.avif', w: '/Calm-Rio/assets/images/properties/3577b5b7.webp', j: '/Calm-Rio/assets/images/properties/3577b5b7.jpg', alt: 'Appartement Royan — salon avec terrasse' },
  { a: '/Calm-Rio/assets/images/properties/c943e5f4.avif', w: '/Calm-Rio/assets/images/properties/c943e5f4.webp', j: '/Calm-Rio/assets/images/properties/c943e5f4.jpg', alt: 'Villa Saint-Trojan-les-Bains — extérieur' },
  { a: '/Calm-Rio/assets/images/guide/grande-conche-beach.avif', w: '/Calm-Rio/assets/images/guide/grande-conche-beach.webp', j: '/Calm-Rio/assets/images/guide/grande-conche-beach.jpg', alt: 'Plage de la Grande Conche — Royan' },
  { a: '/Calm-Rio/assets/images/properties/e330beaf.avif', w: '/Calm-Rio/assets/images/properties/e330beaf.webp', j: '/Calm-Rio/assets/images/properties/e330beaf.jpg', alt: 'Maison Saint-Trojan-les-Bains — extérieur' },
  { a: '/Calm-Rio/assets/images/guide/gatseau-beach.avif', w: '/Calm-Rio/assets/images/guide/gatseau-beach.webp', j: '/Calm-Rio/assets/images/guide/gatseau-beach.jpg', alt: 'Plage de Gatseau — Île d\'Oléron' },
  { a: '/Calm-Rio/assets/images/properties/07bce65e.avif', w: '/Calm-Rio/assets/images/properties/07bce65e.webp', j: '/Calm-Rio/assets/images/properties/07bce65e.jpg', alt: 'Appartement Royan — chambre' },
  { a: '/Calm-Rio/assets/images/guide/saint-trojan-forest.avif', w: '/Calm-Rio/assets/images/guide/saint-trojan-forest.webp', j: '/Calm-Rio/assets/images/guide/saint-trojan-forest.jpg', alt: 'Forêt de Saint-Trojan — île d\'Oléron' },
  { a: '/Calm-Rio/assets/images/guide/fort-boyard.avif', w: '/Calm-Rio/assets/images/guide/fort-boyard.webp', j: '/Calm-Rio/assets/images/guide/fort-boyard.jpg', alt: 'Fort Boyard — Charente-Maritime' },
  { a: '/Calm-Rio/assets/images/guide/notre-dame-royan.avif', w: '/Calm-Rio/assets/images/guide/notre-dame-royan.webp', j: '/Calm-Rio/assets/images/guide/notre-dame-royan.jpg', alt: 'Notre-Dame de Royan' },
  { a: '/Calm-Rio/assets/images/guide/royan-market.avif', w: '/Calm-Rio/assets/images/guide/royan-market.webp', j: '/Calm-Rio/assets/images/guide/royan-market.jpg', alt: 'Marché de Royan — produits locaux' },
];

const AUTOPLAY_MS = 7000;

/** @type {object|null} */
let state = null;

/** @type {Function[]} */
let cleanups = [];

/* --------------------------------------------------------------------------
   Public: init
   -------------------------------------------------------------------------- */

export function initHeroSlider() {
  const hero = document.querySelector('.hero--home');
  if (!hero) return;

  const slider = hero.querySelector('.hero__slider');
  if (!slider) return;

  const slidesEl = buildSlides(slider);
  const slides = Array.from(slidesEl.querySelectorAll('.hero__slide'));
  if (!slides.length) return;

  // Get existing nav elements from HTML
  const dotsContainer = hero.querySelector('.hero__slider-dots');
  const prevBtn = hero.querySelector('[data-hero-prev]');
  const nextBtn = hero.querySelector('[data-hero-next]');
  const progressBar = hero.querySelector('.hero__slider-progress-bar');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  state = {
    slider, slides, dotsContainer, prevBtn, nextBtn, progressBar,
    currentIndex: 0, slideCount: slides.length,
    autoplayTimer: null, isPaused: false, prefersReduced,
  };

  // Build dots
  if (dotsContainer) {
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'hero__slider-dot' + (i === 0 ? ' is-active' : '');
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-selected', String(i === 0));
      dot.setAttribute('aria-label', `Image ${i + 1} sur ${slides.length}`);
      dot.setAttribute('data-index', String(i));
      dotsContainer.appendChild(dot);
    });
  }

  const dots = dotsContainer ? Array.from(dotsContainer.querySelectorAll('.hero__slider-dot')) : [];

  goToSlide(0, false);
  if (slides[1]) preloadSlide(1);

  // Event wiring
  const onPrev = () => goToSlide(state.currentIndex - 1 < 0 ? state.slideCount - 1 : state.currentIndex - 1);
  const onNext = () => goToSlide(state.currentIndex + 1 >= state.slideCount ? 0 : state.currentIndex + 1);
  const onDotClick = (e) => {
    const dot = e.target.closest('.hero__slider-dot');
    if (dot) { const idx = parseInt(dot.dataset.index, 10); if (!isNaN(idx)) goToSlide(idx); }
  };

  cleanups.push(
    listen(prevBtn, 'click', onPrev),
    listen(nextBtn, 'click', onNext),
    listen(dotsContainer, 'click', onDotClick),
    listen(slider, 'mouseenter', () => pause()),
    listen(slider, 'mouseleave', () => resume()),
    listen(slider, 'focusin', () => pause()),
    listen(slider, 'focusout', () => resume()),
    listen(document, 'keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); onPrev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); onNext(); }
    }),
    listen(document, 'visibilitychange', () => {
      document.hidden ? pause() : resume();
    }),
  );

  if (!prefersReduced) startAutoplay();
}

export function destroyHeroSlider() {
  stopAutoplay();
  cleanups.forEach(fn => fn());
  cleanups = [];
  state = null;
}

/* --------------------------------------------------------------------------
   Navigation
   -------------------------------------------------------------------------- */

function goToSlide(index, animate = true) {
  if (!state) return;
  state.currentIndex = index;

  state.slides.forEach((s, i) => s.classList.toggle('is-active', i === index));

  if (state.dotsContainer) {
    const dots = state.dotsContainer.querySelectorAll('.hero__slider-dot');
    dots.forEach((d, i) => {
      d.classList.toggle('is-active', i === index);
      d.setAttribute('aria-selected', String(i === index));
    });
  }

  // Reset and start progress bar animation
  if (state.progressBar) {
    state.progressBar.style.transition = 'none';
    state.progressBar.style.width = '0%';
    // Force reflow then animate
    state.progressBar.offsetHeight;
    state.progressBar.style.transition = `width ${AUTOPLAY_MS}ms linear`;
    state.progressBar.style.width = '100%';
  }

  // Preload next
  const next = index >= state.slideCount - 1 ? 0 : index + 1;
  preloadSlide(next);
}

/* --------------------------------------------------------------------------
   Slide builder
   -------------------------------------------------------------------------- */

function buildSlides(container) {
  let el = container.querySelector('.hero__slides');
  if (el) return el;

  el = document.createElement('div');
  el.className = 'hero__slides';
  el.setAttribute('aria-live', 'polite');

  HERO_IMAGES.forEach((img, i) => {
    const slide = document.createElement('div');
    slide.className = 'hero__slide' + (i === 0 ? ' is-active' : '');
    slide.setAttribute('role', 'tabpanel');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', img.alt);

    const pic = document.createElement('picture');
    const avif = document.createElement('source');
    avif.srcset = img.a; avif.type = 'image/avif';
    pic.appendChild(avif);
    const webp = document.createElement('source');
    webp.srcset = img.w; webp.type = 'image/webp';
    pic.appendChild(webp);
    const jpg = document.createElement('img');
    jpg.src = img.j; jpg.alt = '';
    jpg.setAttribute('aria-hidden', 'true');
    jpg.loading = i === 0 ? 'eager' : 'lazy';
    jpg.fetchPriority = i === 0 ? 'high' : 'auto';
    jpg.decoding = 'async'; jpg.width = 1200; jpg.height = 675;
    pic.appendChild(jpg);
    slide.appendChild(pic);
    el.appendChild(slide);
  });

  container.appendChild(el);
  return el;
}

/* --------------------------------------------------------------------------
   Preload
   -------------------------------------------------------------------------- */

function preloadSlide(index) {
  if (!state || index >= HERO_IMAGES.length) return;
  const src = HERO_IMAGES[index];
  const href = src.a || src.w || src.j;
  const type = src.a ? 'image/avif' : src.w ? 'image/webp' : 'image/jpeg';
  const link = document.createElement('link');
  link.rel = 'preload'; link.as = 'image'; link.href = href; link.type = type;
  document.head.appendChild(link);
  link.addEventListener('load', () => setTimeout(() => link.remove(), 1000), { once: true });
}

/* --------------------------------------------------------------------------
   Autoplay
   -------------------------------------------------------------------------- */

function startAutoplay() {
  if (!state || state.prefersReduced) return;
  stopAutoplay();
  state.autoplayTimer = setInterval(() => {
    if (!state.isPaused && !document.hidden) {
      const next = state.currentIndex + 1 >= state.slideCount ? 0 : state.currentIndex + 1;
      goToSlide(next);
    }
  }, AUTOPLAY_MS);
}

function stopAutoplay() {
  if (state?.autoplayTimer) { clearInterval(state.autoplayTimer); state.autoplayTimer = null; }
}

function pause() { if (state) state.isPaused = true; }
function resume() { if (state) state.isPaused = false; }

/* --------------------------------------------------------------------------
   Utility
   -------------------------------------------------------------------------- */

function listen(target, type, listener, options) {
  if (!target) return () => {};
  target.addEventListener(type, listener, options);
  return () => target.removeEventListener(type, listener, options);
}
