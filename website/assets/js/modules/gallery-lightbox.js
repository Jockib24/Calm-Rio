/**
 * Gallery Lightbox — Fullscreen image viewer with swipe + keyboard support
 * CalmRio Vacation Rentals
 *
 * Usage:
 *   Images inside `.property-gallery` that carry `[data-gallery]` are collected
 *   automatically. `data-fullsrc` points to the full-size image, `data-caption`
 *   supplies alt/caption text.
 *
 * @module gallery-lightbox
 */

/* =========================================================================
   Constants
   ========================================================================= */

const SELECTORS = {
  gallery: '.property-gallery',
  image: '[data-gallery]',
};

const SWIPE_THRESHOLD = 50;

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/* =========================================================================
   GalleryLightbox class
   ========================================================================= */

export class GalleryLightbox {
  /**
   * @param {object} [options]
   * @param {string} [options.selector]  — CSS selector for gallery containers
   */
  constructor(options = {}) {
    this.selector = options.selector || SELECTORS.gallery;
    /** @type {HTMLElement[]} */
    this.galleries = [];
    /** @type {Map<HTMLElement, {images: {src:string, caption:string}[], trigger:HTMLElement}[]>} */
    this.galleryData = new Map();

    /* Overlay elements — created once, reused */
    this.overlay = null;
    this.imgEl = null;
    this.captionEl = null;
    this.counterEl = null;
    this.closeBtn = null;
    this.prevBtn = null;
    this.nextBtn = null;

    /* State */
    this.isOpen = false;
    this.currentIndex = 0;
    /** @type {{src:string, caption:string}[]} */
    this.currentImages = [];
    this.triggerEl = null; // element that opened the lightbox (for focus return)
    this.preloaded = new Set();

    /* Touch state */
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchMoved = false;

    /* Bound handlers (for cleanup) */
    this._onKeydown = this._handleKeydown.bind(this);
    this._onTouchStart = this._handleTouchStart.bind(this);
    this._onTouchEnd = this._handleTouchEnd.bind(this);
    this._onOverlayClick = this._handleOverlayClick.bind(this);
  }

  /* -----------------------------------------------------------------------
     Public: init
     ----------------------------------------------------------------------- */

  init() {
    this.galleries = Array.from(document.querySelectorAll(this.selector));
    if (!this.galleries.length) return;

    this._buildOverlay();
    this._bindGalleryImages();
  }

  /* -----------------------------------------------------------------------
     Public: destroy
     ----------------------------------------------------------------------- */

  destroy() {
    this._close();
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    this.galleryData.clear();
  }

  /* -----------------------------------------------------------------------
     Build the overlay DOM (once)
     ----------------------------------------------------------------------- */

  _buildOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Visionneuse d\'images');
    overlay.setAttribute('tabindex', '-1');

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'lightbox__close';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Fermer la galerie');
    closeBtn.addEventListener('click', () => this._close());

    // Prev button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'lightbox__nav lightbox__nav--prev';
    prevBtn.innerHTML = '&#8249;';
    prevBtn.setAttribute('aria-label', 'Image précédente');
    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); this._navigate(-1); });

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'lightbox__nav lightbox__nav--next';
    nextBtn.innerHTML = '&#8250;';
    nextBtn.setAttribute('aria-label', 'Image suivante');
    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); this._navigate(1); });

    // Image
    const imgEl = document.createElement('img');
    imgEl.className = 'lightbox__image';
    imgEl.setAttribute('draggable', 'false');

    // Caption
    const captionEl = document.createElement('div');
    captionEl.className = 'lightbox__caption';
    captionEl.setAttribute('aria-live', 'polite');

    // Counter
    const counterEl = document.createElement('div');
    counterEl.className = 'lightbox__counter';

    overlay.appendChild(closeBtn);
    overlay.appendChild(prevBtn);
    overlay.appendChild(imgEl);
    overlay.appendChild(nextBtn);
    overlay.appendChild(captionEl);
    overlay.appendChild(counterEl);

    document.body.appendChild(overlay);

    this.overlay = overlay;
    this.imgEl = imgEl;
    this.captionEl = captionEl;
    this.counterEl = counterEl;
    this.closeBtn = closeBtn;
    this.prevBtn = prevBtn;
    this.nextBtn = nextBtn;
  }

  /* -----------------------------------------------------------------------
     Bind click handlers to every gallery image
     ----------------------------------------------------------------------- */

  _bindGalleryImages() {
    this.galleries.forEach((gallery) => {
      const images = Array.from(gallery.querySelectorAll(SELECTORS.image));
      if (!images.length) return;

      const imageData = images.map((img) => ({
        src: img.getAttribute('data-fullsrc') || img.getAttribute('src'),
        caption: img.getAttribute('data-caption') || img.getAttribute('alt') || '',
      }));

      images.forEach((img, index) => {
        img.style.cursor = 'pointer';
        img.setAttribute('tabindex', '0');
        img.setAttribute('role', 'button');
        img.setAttribute('aria-label', `Voir l'image ${index + 1} en plein écran`);

        img.addEventListener('click', (e) => {
          e.preventDefault();
          this.currentImages = imageData;
          this.triggerEl = img;
          this._open(index);
        });

        img.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.currentImages = imageData;
            this.triggerEl = img;
            this._open(index);
          }
        });
      });
    });
  }

  /* -----------------------------------------------------------------------
     Open
     ----------------------------------------------------------------------- */

  _open(index) {
    if (!this.overlay || !this.currentImages.length) return;

    this.isOpen = true;
    this.currentIndex = index;
    this.preloaded.clear();

    this._updateImage(index);

    document.body.style.overflow = 'hidden';
    this.overlay.classList.add('lightbox--open');

    /* Focus trap */
    this.overlay.focus();
    document.addEventListener('keydown', this._onKeydown);

    /* Touch events on the overlay */
    this.overlay.addEventListener('touchstart', this._onTouchStart, { passive: true });
    this.overlay.addEventListener('touchend', this._onTouchEnd, { passive: true });

    /* Overlay click to close */
    this.overlay.addEventListener('click', this._onOverlayClick);
  }

  /* -----------------------------------------------------------------------
     Close
     ----------------------------------------------------------------------- */

  _close() {
    if (!this.overlay || !this.isOpen) return;

    this.isOpen = false;
    this.overlay.classList.remove('lightbox--open');
    document.body.style.overflow = '';

    document.removeEventListener('keydown', this._onKeydown);
    this.overlay.removeEventListener('touchstart', this._onTouchStart);
    this.overlay.removeEventListener('touchend', this._onTouchEnd);
    this.overlay.removeEventListener('click', this._onOverlayClick);

    /* Clear image to free memory */
    this.imgEl.src = '';
    this.imgEl.classList.remove('lightbox__image--loaded');

    /* Return focus to trigger */
    if (this.triggerEl) {
      this.triggerEl.focus();
    }
  }

  /* -----------------------------------------------------------------------
     Navigate
     ----------------------------------------------------------------------- */

  _navigate(direction) {
    const total = this.currentImages.length;
    if (total <= 1) return;

    this.currentIndex = ((this.currentIndex + direction) % total + total) % total;
    this._updateImage(this.currentIndex);
  }

  /* -----------------------------------------------------------------------
     Update displayed image
     ----------------------------------------------------------------------- */

  _updateImage(index) {
    const data = this.currentImages[index];
    if (!data) return;

    /* Fade out current */
    this.imgEl.classList.remove('lightbox__image--loaded');

    const img = new Image();
    img.onload = () => {
      this.imgEl.src = data.src;
      this.imgEl.alt = data.caption;
      this.imgEl.classList.add('lightbox__image--loaded');
    };
    img.onerror = () => {
      /* Keep previous image on error */
    };
    img.src = data.src;

    /* Caption */
    this.captionEl.textContent = data.caption;

    /* Counter */
    this.counterEl.textContent = `${index + 1} / ${this.currentImages.length}`;

    /* Preload adjacent */
    this._preloadAdjacent(index);
  }

  /* -----------------------------------------------------------------------
     Preload adjacent images
     ----------------------------------------------------------------------- */

  _preloadAdjacent(index) {
    const total = this.currentImages.length;
    if (total <= 1) return;

    const indices = [
      (index - 1 + total) % total,
      (index + 1) % total,
    ];

    indices.forEach((i) => {
      if (this.preloaded.has(i)) return;
      this.preloaded.add(i);
      const preload = new Image();
      preload.src = this.currentImages[i].src;
    });
  }

  /* -----------------------------------------------------------------------
     Keyboard handler
     ----------------------------------------------------------------------- */

  _handleKeydown(e) {
    if (!this.isOpen) return;

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        this._close();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        this._navigate(-1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        this._navigate(1);
        break;
      case 'Tab':
        this._trapFocus(e);
        break;
    }
  }

  /* -----------------------------------------------------------------------
     Touch / Swipe
     ----------------------------------------------------------------------- */

  _handleTouchStart(e) {
    const touch = e.touches[0];
    if (!touch) return;
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchMoved = false;
  }

  _handleTouchEnd(e) {
    const touch = e.changedTouches[0];
    if (!touch) return;

    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;

    /* Only register horizontal swipes */
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX > 0) {
        this._navigate(-1);
      } else {
        this._navigate(1);
      }
    }
  }

  /* -----------------------------------------------------------------------
     Focus trap
     ----------------------------------------------------------------------- */

  _trapFocus(e) {
    const focusable = Array.from(this.overlay.querySelectorAll(FOCUSABLE));
    if (!focusable.length) return;

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

  /* -----------------------------------------------------------------------
     Overlay click (outside image)
     ----------------------------------------------------------------------- */

  _handleOverlayClick(e) {
    /* Close only if clicking the backdrop itself, not child elements */
    if (e.target === this.overlay) {
      this._close();
    }
  }
}

/* =========================================================================
   Auto-init helper
   ========================================================================= */

/**
 * Initialise all gallery lightboxes on the page.
 */
export function initGalleryLightbox() {
  const lightbox = new GalleryLightbox();
  lightbox.init();
  return lightbox;
}
