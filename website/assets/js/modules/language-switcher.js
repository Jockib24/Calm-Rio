// ============================================================
// language-switcher.js — FR/EN Language Switcher
// CalmRio — Premium Vacation Rentals
// Injects a language toggle button into the site header
// ============================================================

// Pages that exist in both languages (French → English)
// Most pages share the same filename under /en/
const FR_EN_MAP = {
  // Root pages (same filename)
  '/': '/en/',
  '/index.html': '/en/index.html',
  '/about.html': '/en/about.html',
  '/contact.html': '/en/contact.html',
  '/faq.html': '/en/faq.html',
  '/local-guide.html': '/en/local-guide.html',
  '/mentions-legales.html': '/en/mentions-legales.html',
  '/politique-de-confidentialite.html': '/en/politique-de-confidentialite.html',
  '/404.html': '/en/404.html',

  // Property pages (same filename)
  '/royan-appartement.html': '/en/royan-appartement.html',
  '/saint-trojan-villa.html': '/en/saint-trojan-villa.html',
  '/saint-trojan-maison.html': '/en/saint-trojan-maison.html',

  // Blog
  '/blog/index.html': '/en/blog/index.html',
  '/blog/posts/guide-plages-royan.html': '/en/blog/posts/guide-plages-royan.html',
  '/blog/posts/que-faire-oleron-famille.html': '/en/blog/posts/que-faire-oleron-famille.html',

  // French-only blog posts → English blog index
  '/blog/posts/visiter-royan-hiver.html': '/en/blog/',
  '/blog/posts/meilleurs-restaurants-saint-trojan.html': '/en/blog/',
};

// Build reverse map (English → French)
const EN_FR_MAP = {};
for (const [fr, en] of Object.entries(FR_EN_MAP)) {
  EN_FR_MAP[en] = fr;
}

/** @type {HTMLElement|null} */
let langBtn = null;

/* --------------------------------------------------------------------------
   Public: init
   -------------------------------------------------------------------------- */

export function initLanguageSwitcher() {
  injectButton();
}

/* --------------------------------------------------------------------------
   Public: destroy
   -------------------------------------------------------------------------- */

export function destroyLanguageSwitcher() {
  langBtn?.removeEventListener('click', onLangClick);
}

/* --------------------------------------------------------------------------
   Inject button into header
   -------------------------------------------------------------------------- */

function injectButton() {
  const headerInner = document.querySelector('.header-inner');
  if (!headerInner) return;
  if (headerInner.querySelector('.lang-switcher')) return;

  langBtn = document.createElement('a');
  langBtn.className = 'lang-switcher';
  langBtn.setAttribute('title', 'Changer de langue / Switch language');

  // Determine current language and set href
  const { href, label, isEnglish } = getLangInfo();
  langBtn.href = href;
  langBtn.textContent = label;
  langBtn.setAttribute('hreflang', isEnglish ? 'fr' : 'en');
  langBtn.setAttribute('aria-label', isEnglish ? 'Passer en français' : 'Switch to English');

  // Insert before the theme toggle (or CTA if no theme toggle)
  const themeToggle = headerInner.querySelector('.theme-toggle');
  if (themeToggle) {
    headerInner.insertBefore(langBtn, themeToggle);
  } else {
    const cta = headerInner.querySelector('.header-cta');
    if (cta) {
      headerInner.insertBefore(langBtn, cta);
    } else {
      headerInner.appendChild(langBtn);
    }
  }
}

/* --------------------------------------------------------------------------
   Determine current language and find counterpart URL
   -------------------------------------------------------------------------- */

function getLangInfo() {
  const path = window.location.pathname;

  // Strip GitHub Pages base prefix (e.g. /Calm-Rio/) to get a root-relative path
  // that matches the FR_EN_MAP / EN_FR_MAP keys.
  let normalized = path;
  const baseMatch = path.match(/^\/[^/]+\//);
  if (baseMatch) {
    normalized = path.slice(baseMatch[0].length - 1); // keep leading /
  }

  // EN → FR
  if (normalized.startsWith('/en/') || normalized === '/en' || normalized === '/en/index.html') {
    let frPath;
    if (normalized === '/en' || normalized === '/en/index.html') {
      frPath = '/';
    } else {
      frPath = EN_FR_MAP[normalized] || normalized.replace('/en', '');
      // If no mapping found, just strip /en prefix as fallback
      if (!frPath) {
        frPath = normalized.replace('/en', '') || '/';
      }
    }
    // Re-add base prefix if present
    if (baseMatch) {
      frPath = baseMatch[0].replace(/\/$/, '') + frPath;
    }
    return {
      href: frPath,
      label: 'FR',
      isEnglish: true,
    };
  }

  // FR → EN
  let enPath = FR_EN_MAP[normalized];
  if (!enPath) {
    // Try with index.html suffix if it's a directory
    if (normalized.endsWith('/')) {
      enPath = FR_EN_MAP[normalized + 'index.html'];
    }
    // Fallback: just /en/ + path
    if (!enPath) {
      enPath = '/en' + (normalized === '/' ? '/' : normalized);
    }
  }

  // Re-add base prefix if present
  if (baseMatch && enPath) {
    enPath = baseMatch[0].replace(/\/$/, '') + enPath;
  }

  return {
    href: enPath,
    label: 'EN',
    isEnglish: false,
  };
}
