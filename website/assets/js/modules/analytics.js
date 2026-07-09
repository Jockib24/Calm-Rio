// ============================================================
// analytics.js — Plausible Analytics Integration
// CalmRio — Locations de vacances premium · Premium Vacation Rentals
//
// Intégration Plausible Analytics (privacy-first, sans cookies,
// conforme RGPD/GDPR). Le script Plausible est chargé via une
// balise <script defer> dans le HTML de chaque page.
//
// Ce module fournit des fonctions helper pour le suivi
// d'événements personnalisés et initialise l'event delegation
// qui écoute les attributs data-track dans le DOM.
// ============================================================

/* --------------------------------------------------------------------------
   Helpers — Vérification de disponibilité de Plausible
   -------------------------------------------------------------------------- */

/**
 * Vérifie si l'objet global `window.plausible` est disponible.
 * Plausible est chargé de manière asynchrone (defer), donc il peut
 * ne pas être prêt immédiatement. On fallback silencieusement.
 * @returns {boolean}
 */
function isPlausibleAvailable() {
  return typeof window.plausible !== 'undefined';
}

/**
 * Vérifie si on est en environnement de développement local.
 * On ne tracke pas les événements en dev pour ne pas polluer
 * les stats Plausible avec des visites de test.
 * @returns {boolean}
 */
function isLocalhost() {
  return window.location.hostname === 'localhost'
    || window.location.hostname === '127.0.0.1'
    || window.location.hostname.startsWith('192.168.');
}

/* --------------------------------------------------------------------------
   Public: trackEvent — fonction générique de tracking
   -------------------------------------------------------------------------- */

/**
 * Envoie un événement personnalisé à Plausible.
 * Si Plausible n'est pas disponible (dev, adblock, réseau lent),
 * la fonction échoue silencieusement sans casser la navigation.
 *
 * @param {string} name — nom de l'événement (ex: "Booking CTA")
 * @param {object} [props={}] — propriétés optionnelles
 *   (ex: { property: "Royan Appartement" })
 */
export function trackEvent(name, props = {}) {
  if (isLocalhost()) return;
  if (!isPlausibleAvailable()) return;

  try {
    window.plausible(name, { props });
  } catch (_err) {
    // Silencieux — Plausible peut être bloqué par un adblocker,
    // on ne veut pas que ça empêche le site de fonctionner.
  }
}

/* --------------------------------------------------------------------------
   Public: trackBookingCTA — clic sur un bouton de réservation
   -------------------------------------------------------------------------- */

/**
 * Suivi des clics sur les boutons "Réserver" / "Book Now".
 * Appelé automatiquement via l'event delegation sur [data-track="booking-cta"].
 *
 * @param {string} [propertyName] — nom de la propriété (optionnel,
 *   undefined pour les CTA génériques comme le header de la homepage)
 */
export function trackBookingCTA(propertyName) {
  const props = {};
  if (propertyName) props.property = propertyName;
  trackEvent('Booking CTA', props);
}

/* --------------------------------------------------------------------------
   Public: trackGalleryView — ouverture de la galerie photo
   -------------------------------------------------------------------------- */

/**
 * Suivi des ouvertures de galerie photo (lightbox ou clic sur
 * "Voir toutes les photos").
 * Appelé via event delegation sur [data-track="gallery-view"].
 *
 * @param {string} [propertyName] — nom de la propriété
 */
export function trackGalleryView(propertyName) {
  const props = {};
  if (propertyName) props.property = propertyName;
  trackEvent('Gallery View', props);
}

/* --------------------------------------------------------------------------
   Public: trackFormSubmission — soumission de formulaire
   -------------------------------------------------------------------------- */

/**
 * Suivi des soumissions de formulaire (contact, réservation).
 * Appelé automatiquement via l'event delegation sur [data-track-form].
 *
 * @param {string} formName — type de formulaire :
 *   "contact" | "booking" | "newsletter"
 */
export function trackFormSubmission(formName) {
  trackEvent('Form Submission', { form: formName });
}

/* --------------------------------------------------------------------------
   Public: trackNewsletterSignup — inscription newsletter
   -------------------------------------------------------------------------- */

/**
 * Suivi des inscriptions à la newsletter.
 * Appelé via event delegation sur [data-track-form="newsletter"].
 */
export function trackNewsletterSignup() {
  trackEvent('Newsletter Signup');
}

/* --------------------------------------------------------------------------
   Public: trackLanguageSwitch — changement de langue FR/EN
   -------------------------------------------------------------------------- */

/**
 * Suivi des basculements de langue (FR ↔ EN).
 * Appelé via event delegation sur les clics de .lang-switcher.
 *
 * @param {string} lang — code langue cible : "fr" ou "en"
 */
export function trackLanguageSwitch(lang) {
  trackEvent('Language Switch', { language: lang });
}

/* --------------------------------------------------------------------------
   Public: initAnalytics — initialisation du tracking
   -------------------------------------------------------------------------- */

/**
 * Initialise le suivi analytics avec event delegation.
 *
 * Écoute les événements suivants sur tout le document :
 *   - Clics sur [data-track="booking-cta"]   → trackBookingCTA()
 *   - Clics sur [data-track="gallery-view"]  → trackGalleryView()
 *   - Submit sur [data-track-form]           → trackFormSubmission()
 *   - Clics sur .lang-switcher               → trackLanguageSwitch()
 *
 * À appeler une fois au DOMContentLoaded depuis main.js.
 */
export function initAnalytics() {
  // Ne rien faire en environnement de développement local
  if (isLocalhost()) return;

  // ── Booking CTA clicks ──────────────────────────────────
  // Écoute les clics sur tout élément avec data-track="booking-cta"
  // Le nom de la propriété est optionnel (data-track-property)
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-track="booking-cta"]');
    if (!el) return;
    const property = el.dataset.trackProperty || undefined;
    trackBookingCTA(property);
  });

  // ── Gallery view clicks ─────────────────────────────────
  // Écoute les clics sur les éléments avec data-track="gallery-view"
  // (bouton "Voir toutes les photos" ou container de galerie)
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-track="gallery-view"]');
    if (!el) return;
    const property = el.dataset.trackProperty || undefined;
    trackGalleryView(property);
  });

  // ── Form submissions ────────────────────────────────────
  // Écoute les soumissions de formulaires avec data-track-form
  // Valeurs : "contact", "booking", "newsletter"
  document.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-track-form]');
    if (!form) return;
    const formType = form.dataset.trackForm;

    if (formType === 'newsletter') {
      trackNewsletterSignup();
    } else {
      trackFormSubmission(formType);
    }
  });

  // ── Language switcher ───────────────────────────────────
  // Le bouton de langue est injecté dynamiquement par
  // language-switcher.js avec la classe .lang-switcher.
  // On écoute via event delegation pour que ça fonctionne
  // même si le bouton n'existe pas encore au chargement.
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.lang-switcher');
    if (!btn) return;
    // hreflang indique la langue cible : "en" ou "fr"
    const lang = btn.getAttribute('hreflang') === 'en' ? 'en' : 'fr';
    // On enregistre l'événement AVANT la navigation
    trackLanguageSwitch(lang);
  });
}
