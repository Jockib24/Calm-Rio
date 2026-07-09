/* ==========================================================================
   map.js — Leaflet Interactive Map Module
   CalmRio — Premium Vacation Rentals, Royan & Saint-Trojan-les-Bains

   Features:
   - Lazy-loaded Leaflet from CDN (IntersectionObserver)
   - Property pins (gold markers) + POI pins (themed SVG icons)
   - Dark-mode support via CSS filter on tiles
   - Touch-friendly, responsive, accessible
   ========================================================================== */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LEAFLET_CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS_URL  = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const TILE_URL         = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTR        = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** @type {Promise<void>|null} */
let leafletPromise = null;
/** @type {boolean} */
let cssInjected = false;

// ---------------------------------------------------------------------------
// Data — Properties
// ---------------------------------------------------------------------------

const PROPERTIES = [
  {
    id: 'royan-appartement',
    name: 'Appartement Royan',
    nameEn: 'Royan Apartment',
    lat: 45.624,
    lng: -1.028,
    url: 'royan-appartement.html',
    description: '4 pers, 100 m de la plage de la Grande Conche'
  },
  {
    id: 'saint-trojan-villa',
    name: 'Villa Saint-Trojan',
    nameEn: 'Saint-Trojan Villa',
    lat: 45.838,
    lng: -1.208,
    url: 'saint-trojan-villa.html',
    description: '6 pers, jardin clos, à 500 m de la forêt'
  },
  {
    id: 'saint-trojan-maison',
    name: 'Maison Saint-Trojan',
    nameEn: 'Saint-Trojan House',
    lat: 45.837,
    lng: -1.209,
    url: 'saint-trojan-maison.html',
    description: '6 pers, jardin, 2 min du marché'
  }
];

// ---------------------------------------------------------------------------
// Data — Points of Interest
// ---------------------------------------------------------------------------

const POIS = [
  {
    id: 'grande-conche',
    name: 'Plage de la Grande Conche',
    nameEn: 'Grande Conche Beach',
    lat: 45.620,
    lng: -1.025,
    iconType: 'beach'
  },
  {
    id: 'marche-central',
    name: 'Marché Central de Royan',
    nameEn: 'Royan Central Market',
    lat: 45.624,
    lng: -1.032,
    iconType: 'market'
  },
  {
    id: 'notre-dame',
    name: 'Notre-Dame de Royan',
    nameEn: 'Notre-Dame of Royan',
    lat: 45.623,
    lng: -1.030,
    iconType: 'landmark'
  },
  {
    id: 'gatseau-beach',
    name: 'Plage de Gatseau',
    nameEn: 'Gatseau Beach',
    lat: 45.828,
    lng: -1.228,
    iconType: 'beach'
  },
  {
    id: 'foret-saint-trojan',
    name: 'Forêt de Saint-Trojan',
    nameEn: 'Saint-Trojan Forest',
    lat: 45.840,
    lng: -1.210,
    iconType: 'forest'
  },
  {
    id: 'fort-boyard',
    name: 'Fort Boyard',
    nameEn: 'Fort Boyard',
    lat: 45.999,
    lng: -1.213,
    iconType: 'landmark'
  }
];

// ---------------------------------------------------------------------------
// SVG icons for POI types
// ---------------------------------------------------------------------------

const POI_ICONS = {
  beach: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M3 16c0 2 1.5 3 4 3s4-1 8-1 4 1 8 1 4-1 4-3"/>
    <path d="M4 13c3 1 6-1 9-1s6 2 9-1"/>
    <path d="M5 10c2 1 5-1 8-1s5 2 8-1"/>
    <path d="M6 7c1 1 4-1 7-1s4 1 7-1"/>
  </svg>`,
  market: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M3 9h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/>
    <path d="M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2"/>
    <line x1="12" y1="5" x2="12" y2="22"/>
    <line x1="8" y1="9" x2="8" y2="22"/>
    <line x1="16" y1="9" x2="16" y2="22"/>
  </svg>`,
  landmark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="12" width="3" height="10"/>
    <rect x="10.5" y="6" width="3" height="16"/>
    <rect x="18" y="12" width="3" height="10"/>
    <polyline points="1 12 12 2 23 12"/>
  </svg>`,
  forest: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M17 18c1.3 0 2.4-.6 3-1.7.7-1 .7-2.1.3-3-.4-.8-1.2-1.3-2-1.3-.2 0-.5 0-.7.1.2-1.8-.9-3.1-2.6-3.1-1 0-1.8.5-2.3 1.3-.4-.8-1.2-1.3-2.2-1.3-1 0-1.8.5-2.2 1.2-.3-.6-.9-1-1.6-1-.7 0-1.4.3-1.8.9-.6.8-.6 1.8-.2 2.7.4.8 1.2 1.3 2.1 1.3H7"/>
    <path d="M7 18l-.5-2"/>
    <path d="M10 18l-.5-2"/>
    <path d="M13 18l-.5-2"/>
    <path d="M16 18l-.5-2"/>
    <line x1="7" y1="18" x2="17" y2="18"/>
    <line x1="12" y1="22" x2="12" y2="18"/>
    <line x1="9" y1="22" x2="15" y2="22"/>
  </svg>`
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Detect if the page language is French */
function isFrench() {
  return document.documentElement.lang === 'fr';
}

/** Get localized name */
function localName(item) {
  return isFrench() ? item.name : (item.nameEn || item.name);
}

/** Detect dark mode */
function isDarkMode() {
  return document.documentElement.classList.contains('dark-mode');
}

// ---------------------------------------------------------------------------
// Leaflet loader (lazy, once)
// ---------------------------------------------------------------------------

/**
 * Dynamically load Leaflet CSS + JS from CDN.
 * @returns {Promise<void>}
 */
function loadLeaflet() {
  if (leafletPromise) return leafletPromise;

  leafletPromise = new Promise((resolve, reject) => {
    // Inject CSS if not already present
    if (!cssInjected && !document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS_URL;
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
      cssInjected = true;
    }

    // Inject JS if not already present
    if (typeof window.L !== 'undefined') {
      resolve();
      return;
    }

    if (document.querySelector('script[src*="leaflet"]')) {
      // Script is already loading, poll for L
      const interval = setInterval(() => {
        if (typeof window.L !== 'undefined') {
          clearInterval(interval);
          resolve();
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    script.src = LEAFLET_JS_URL;
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Leaflet'));
    document.head.appendChild(script);
  });

  return leafletPromise;
}

// ---------------------------------------------------------------------------
// Map initialization
// ---------------------------------------------------------------------------

/**
 * Initialize a Leaflet map on the given container.
 * @param {string} elementId — DOM id of the map container
 * @param {object} options
 * @param {number} [options.zoom=11]
 * @param {[number, number]} [options.center] — [lat, lng]
 * @returns {Promise<L.Map>}
 */
export async function initMap(elementId, options = {}) {
  await loadLeaflet();
  const L = window.L;

  const container = document.getElementById(elementId);
  if (!container) {
    throw new Error(`Map container #${elementId} not found`);
  }

  // Default center between Royan and Saint-Trojan
  const center = options.center || [45.73, -1.12];
  const zoom = options.zoom || 11;

  const map = L.map(elementId, {
    center,
    zoom,
    scrollWheelZoom: false,    // Prevent accidental zoom while scrolling page
    zoomControl: true,
    attributionControl: true
  });

  // Tile layer
  L.tileLayer(TILE_URL, {
    attribution: TILE_ATTR,
    maxZoom: 18
  }).addTo(map);

  // Dark mode support via CSS filter
  applyDarkModeFilter(map);
  observeDarkModeChanges(map);

  // Force Leaflet to recalculate size after container becomes visible
  setTimeout(() => map.invalidateSize(), 100);

  return map;
}

/** Apply CSS filter to tile layer for dark mode */
function applyDarkModeFilter(map) {
  if (isDarkMode()) {
    map.getContainer().style.setProperty('--leaflet-tile-filter', 'brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7)');
  } else {
    map.getContainer().style.setProperty('--leaflet-tile-filter', 'none');
  }
}

/** Watch for dark mode class changes */
function observeDarkModeChanges(map) {
  const observer = new MutationObserver(() => {
    applyDarkModeFilter(map);
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
}

// ---------------------------------------------------------------------------
// Marker creation
// ---------------------------------------------------------------------------

/**
 * Add a property marker with custom gold pin and clickable popup.
 * @param {L.Map} map
 * @param {number} lat
 * @param {number} lng
 * @param {string} label — display name
 * @param {string} url — link to property page
 * @param {string} [description] — short description for popup
 * @returns {L.Marker}
 */
export function addPropertyPin(map, lat, lng, label, url, description = '') {
  const L = window.L;

  const icon = L.divIcon({
    className: 'map-marker map-marker--property',
    html: `<div class="map-marker__inner" title="${label}">
      <span class="map-marker__label">${label}</span>
    </div>`,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -44]
  });

  const marker = L.marker([lat, lng], { icon }).addTo(map);

  const popupContent = `
    <div class="map-popup">
      <h3 class="map-popup__title">${label}</h3>
      ${description ? `<p class="map-popup__desc">${description}</p>` : ''}
      <a href="${url}" class="map-popup__link">${isFrench() ? 'Voir la propriété →' : 'View property →'}</a>
    </div>
  `;

  marker.bindPopup(popupContent, {
    maxWidth: 260,
    className: 'map-popup-wrapper'
  });

  return marker;
}

/**
 * Add a POI marker with themed SVG icon.
 * @param {L.Map} map
 * @param {number} lat
 * @param {number} lng
 * @param {string} label — display name
 * @param {'beach'|'market'|'landmark'|'forest'} iconType
 * @returns {L.Marker}
 */
export function addPOIPin(map, lat, lng, label, iconType = 'landmark') {
  const L = window.L;

  const svgIcon = POI_ICONS[iconType] || POI_ICONS.landmark;

  const icon = L.divIcon({
    className: `map-marker map-marker--poi map-marker--${iconType}`,
    html: `<div class="map-marker__poi-inner" title="${label}">
      <span class="map-marker__poi-icon">${svgIcon}</span>
      <span class="map-marker__poi-label">${label}</span>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16]
  });

  const marker = L.marker([lat, lng], { icon }).addTo(map);

  marker.bindPopup(`
    <div class="map-popup map-popup--poi">
      <h3 class="map-popup__title">${label}</h3>
    </div>
  `, {
    maxWidth: 220,
    className: 'map-popup-wrapper map-popup-wrapper--poi'
  });

  return marker;
}

// ---------------------------------------------------------------------------
// Map type builders
// ---------------------------------------------------------------------------

/**
 * Build the Local Guide map (3 properties + 6 POIs).
 */
async function buildGuideMap(container) {
  const map = await initMap(container.id, { zoom: 11 });

  // Longer timeout for the initial invalidateSize on lazy-loaded maps
  setTimeout(() => map.invalidateSize(), 300);

  // Add all POIs
  POIS.forEach((poi) => {
    addPOIPin(map, poi.lat, poi.lng, localName(poi), poi.iconType);
  });

  // Add all properties
  PROPERTIES.forEach((prop) => {
    addPropertyPin(map, prop.lat, prop.lng, localName(prop), prop.url, prop.description);
  });

  return map;
}

/**
 * Build the Contact map (3 properties only, no POIs).
 */
async function buildContactMap(container) {
  const map = await initMap(container.id, { zoom: 11 });

  setTimeout(() => map.invalidateSize(), 300);

  PROPERTIES.forEach((prop) => {
    addPropertyPin(map, prop.lat, prop.lng, localName(prop), prop.url, prop.description);
  });

  return map;
}

// ---------------------------------------------------------------------------
// Auto-discovery + Lazy Loading
// ---------------------------------------------------------------------------

/**
 * Initialize all maps on the page via data attributes.
 * Maps are lazy-loaded — Leaflet is only fetched when the map container
 * is visible (IntersectionObserver).
 */
export function initMapModule() {
  const mapContainers = document.querySelectorAll('[data-map]');

  if (!mapContainers.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const container = entry.target;
        observer.unobserve(container);

        const mapType = container.getAttribute('data-map');

        if (mapType === 'guide') {
          buildGuideMap(container);
        } else if (mapType === 'contact') {
          buildContactMap(container);
        }
      });
    },
    {
      rootMargin: '150px 0px',
      threshold: 0.01
    }
  );

  mapContainers.forEach((el) => observer.observe(el));
}
