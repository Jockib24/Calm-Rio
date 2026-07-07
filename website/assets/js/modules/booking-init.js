/**
 * Booking Init — Initializes booking systems for all properties
 * CalmRio Vacation Rentals
 *
 * Auto-detects property pages by URL/data attributes and
 * initializes the appropriate booking integration.
 *
 * @module booking-init
 */

export function initBookingSystems() {
  const propertyConfigs = {
    'royan-appartement': {
      propertyId: '1101432035369683458',
      propertyName: 'Appartement neuf — 100m de la Grande Conche',
      nightlyRate: 175,
      airbnbUrl: 'https://www.airbnb.fr/rooms/1101432035369683458',
      icalUrl: null, // Set this to your Airbnb iCal export URL
      minStay: 2,
      maxGuests: 4
    },
    'saint-trojan-villa': {
      propertyId: '50122536',
      propertyName: 'Villa neuve — Jardin clos & terrasses',
      nightlyRate: 220,
      airbnbUrl: 'https://www.airbnb.fr/rooms/50122536',
      icalUrl: null,
      minStay: 3,
      maxGuests: 6
    },
    'saint-trojan-maison': {
      propertyId: '1431741688356720747',
      propertyName: 'Maison familiale — Jardin & plage à vélo',
      nightlyRate: 180,
      airbnbUrl: 'https://www.airbnb.fr/rooms/1431741688356720747',
      icalUrl: null,
      minStay: 2,
      maxGuests: 6
    }
  };

  // Detect current property page from URL
  const path = window.location.pathname;
  let currentProperty = null;

  for (const [slug, config] of Object.entries(propertyConfigs)) {
    if (path.includes(slug)) {
      currentProperty = config;
      break;
    }
  }

  // Initialize booking integration
  if (currentProperty) {
    initializeForProperty(currentProperty);
  }

  // Initialize quick-book buttons on homepage
  initializeQuickBookButtons(propertyConfigs);
}

/**
 * Initialize full booking system for a property detail page
 * @param {Object} config - Property configuration
 */
async function initializeForProperty(config) {
  const container = document.querySelector('#availability-calendar');
  if (!container) return;

  try {
    const { default: BookingIntegration } = await import('./booking-integration.js');
    const booking = new BookingIntegration({
      ...config,
      calendarContainer: '#availability-calendar',
      formContainer: '#booking-form',
      useMockData: !config.icalUrl, // Use mock data until real iCal URLs are configured
      corsProxy: 'https://corsproxy.io/?',
      locale: 'fr-FR'
    });

    await booking.init();
    window.__bookingIntegration = booking;
  } catch (err) {
    console.warn('Booking system initialization skipped:', err.message);
  }
}

/**
 * Initialize quick-book buttons that link to property pages
 * @param {Object} propertyConfigs - All property configurations
 */
function initializeQuickBookButtons(propertyConfigs) {
  document.querySelectorAll('[data-quick-book]').forEach(btn => {
    const propertyId = btn.dataset.propertyId;
    const propertySlug = btn.dataset.propertySlug;

    if (propertySlug) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = propertySlug;
      });
    }
  });
}

/**
 * Set iCal feed URLs for properties (call this when you have the URLs)
 * @param {Object} feeds - { propertyId: 'icalUrl' }
 */
export function setICalFeeds(feeds) {
  if (window.__bookingIntegration) {
    for (const [propertyId, icalUrl] of Object.entries(feeds)) {
      if (window.__bookingIntegration.options.propertyId === propertyId) {
        window.__bookingIntegration.options.icalUrl = icalUrl;
        window.__bookingIntegration.calendar?.updateFeed(icalUrl);
      }
    }
  }
}

export default initBookingSystems;
