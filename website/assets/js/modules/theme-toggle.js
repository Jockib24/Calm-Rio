// ============================================================
// theme-toggle.js — Dark/Light Mode Switcher
// CalmRio — Premium Vacation Rentals
// Features: manual toggle, system detection on init, localStorage
// ============================================================
// NOTE: CSS uses ONLY .dark-mode class (no @media query).
// JS detects system preference on load and applies the class.
// This prevents the media query from fighting the manual toggle.

const STORAGE_KEY = 'calmrio-theme';
const CLASS_DARK = 'dark-mode';
const CLASS_TRANSITION = 'color-theme-in-transition';

/** @type {HTMLElement|null} */
let toggleBtn = null;

/* --------------------------------------------------------------------------
   Public: init
   -------------------------------------------------------------------------- */

export function initThemeToggle() {
  injectToggleButton();
  initTheme();
}

/* --------------------------------------------------------------------------
   Public: destroy
   -------------------------------------------------------------------------- */

export function destroyThemeToggle() {
  toggleBtn?.removeEventListener('click', onToggleClick);
}

/* --------------------------------------------------------------------------
   Inject button into header
   -------------------------------------------------------------------------- */

function injectToggleButton() {
  const headerInner = document.querySelector('.header-inner');
  if (!headerInner) return;
  if (headerInner.querySelector('.theme-toggle')) return;

  toggleBtn = document.createElement('button');
  toggleBtn.className = 'theme-toggle';
  toggleBtn.setAttribute('type', 'button');
  toggleBtn.setAttribute('aria-label', 'Changer le thème (clair/sombre)');
  toggleBtn.setAttribute('title', 'Changer le thème');

  const cta = headerInner.querySelector('.header-cta');
  if (cta) {
    headerInner.insertBefore(toggleBtn, cta);
  } else {
    headerInner.appendChild(toggleBtn);
  }

  toggleBtn.addEventListener('click', onToggleClick);
}

/* --------------------------------------------------------------------------
   Init — determine correct initial state
   -------------------------------------------------------------------------- */

function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved === 'dark') {
    enableDarkMode();
  } else if (saved === 'light') {
    disableDarkMode();
  } else {
    // No saved preference — check system
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      enableDarkMode();
    } else {
      disableDarkMode();
    }
  }
}

/* --------------------------------------------------------------------------
   Apply
   -------------------------------------------------------------------------- */

function startTransition() {
  document.documentElement.classList.add(CLASS_TRANSITION);
  setTimeout(() => {
    document.documentElement.classList.remove(CLASS_TRANSITION);
  }, 400);
}

function enableDarkMode() {
  startTransition();
  document.documentElement.classList.add(CLASS_DARK);
  localStorage.setItem(STORAGE_KEY, 'dark');
  updateButtonUI();
}

function disableDarkMode() {
  startTransition();
  document.documentElement.classList.remove(CLASS_DARK);
  localStorage.setItem(STORAGE_KEY, 'light');
  updateButtonUI();
}

/* --------------------------------------------------------------------------
   Cycle: current → opposite
   -------------------------------------------------------------------------- */

function cycleTheme() {
  const isDark = document.documentElement.classList.contains(CLASS_DARK);
  if (isDark) {
    disableDarkMode();
  } else {
    enableDarkMode();
  }
}

/* --------------------------------------------------------------------------
   Events
   -------------------------------------------------------------------------- */

function onToggleClick(e) {
  e.preventDefault();
  cycleTheme();
}

/* --------------------------------------------------------------------------
   Button icon — shows the OPPOSITE of current state
   -------------------------------------------------------------------------- */

function updateButtonUI() {
  if (!toggleBtn) return;

  const isDark = document.documentElement.classList.contains(CLASS_DARK);

  // Dark mode active → show sun icon (switch to light)
  // Light mode active → show moon icon (switch to dark)
  toggleBtn.innerHTML = isDark
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

  toggleBtn.setAttribute(
    'aria-label',
    isDark ? 'Activer le thème clair' : 'Activer le thème sombre'
  );
}
