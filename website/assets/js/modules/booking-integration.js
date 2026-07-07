/**
 * Booking Integration — Connects availability calendar with booking flow
 * CalmRio Vacation Rentals
 *
 * Handles:
 * - Availability checks via iCal
 * - Booking form pre-fill from calendar selection
 * - Airbnb cross-link when dates are unavailable
 * - Email-based booking inquiry fallback
 *
 * @module booking-integration
 */

export class BookingIntegration {
  constructor(options = {}) {
    this.options = {
      propertyId: options.propertyId || 'default',
      propertyName: options.propertyName || 'Property',
      icalUrl: options.icalUrl || null,
      airbnbUrl: options.airbnbUrl || null,
      bookingEmail: options.bookingEmail || 'bonjour@calmrio.fr',
      nightlyRate: options.nightlyRate || 150,
      minStay: options.minStay || 2,
      maxGuests: options.maxGuests || 6,
      calendarContainer: options.calendarContainer || '#availability-calendar',
      formContainer: options.formContainer || '#booking-form',
      corsProxy: options.corsProxy || 'https://corsproxy.io/?',
      locale: options.locale || 'fr-FR',
      useMockData: options.useMockData || false,
      ...options
    };

    this.calendar = null;
    this.state = {
      isInitialized: false,
      currentBooking: null
    };
  }

  /**
   * Initialize the booking system
   */
  async init() {
    if (this.state.isInitialized) return;

    // Dynamically import the calendar
    const { AvailabilityCalendar } = await import('./availability-calendar.js');

    const calendarContainer = document.querySelector(this.options.calendarContainer);
    if (calendarContainer) {
      this.calendar = new AvailabilityCalendar(calendarContainer, {
        propertyId: this.options.propertyId,
        propertyName: this.options.propertyName,
        icalUrl: this.options.icalUrl,
        corsProxy: this.options.corsProxy,
        minStay: this.options.minStay,
        maxGuests: this.options.maxGuests,
        locale: this.options.locale,
        useMockData: this.options.useMockData,
        onCheckAvailability: (data) => this._handleAvailabilityCheck(data)
      });
    }

    this._setupQuickBooking();
    this.state.isInitialized = true;
  }

  /**
   * Handle availability check from calendar
   * @param {Object} bookingData
   */
  _handleAvailabilityCheck(bookingData) {
    this.state.currentBooking = bookingData;

    // Pre-fill booking form if it exists
    this._prefillForm(bookingData);

    // Scroll to booking section
    const bookingSection = document.querySelector('#booking-section');
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Show booking options
    this._showBookingOptions(bookingData);
  }

  /**
   * Set up quick booking buttons (e.g., "Réserver maintenant" CTAs)
   */
  _setupQuickBooking() {
    document.querySelectorAll('[data-quick-book]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const propertyId = btn.dataset.propertyId || this.options.propertyId;
        this._scrollToCalendar(propertyId);
      });
    });

    // Airbnb direct booking buttons
    document.querySelectorAll('[data-book-airbnb]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const url = btn.dataset.airbnbUrl || this.options.airbnbUrl;
        if (url) {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      });
    });

    // Email inquiry buttons
    document.querySelectorAll('[data-book-email]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const subject = encodeURIComponent(
          `Demande de réservation — ${this.options.propertyName}`
        );
        const body = encodeURIComponent(
          `Bonjour,\n\nJe souhaite réserver ${this.options.propertyName}.\n\nDates souhaitées :\nNombre de voyageurs :\n\nMerci de me contacter pour confirmer la disponibilité.\n\nCordialement,`
        );
        window.location.href = `mailto:${this.options.bookingEmail}?subject=${subject}&body=${body}`;
      });
    });
  }

  /**
   * Scroll to the calendar for a specific property
   * @param {string} propertyId
   */
  _scrollToCalendar(propertyId) {
    const calendar = document.querySelector(this.options.calendarContainer);
    if (calendar) {
      calendar.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Focus the first available day
      setTimeout(() => {
        const firstAvailable = calendar.querySelector('.calendar-day--available');
        if (firstAvailable) firstAvailable.focus();
      }, 600);
    }
  }

  /**
   * Pre-fill booking form fields
   * @param {Object} bookingData
   */
  _prefillForm(bookingData) {
    if (!bookingData) return;

    const form = document.querySelector(this.options.formContainer);
    if (!form) return;

    // Set date inputs
    const checkInInput = form.querySelector('[name="check-in"], [name="check_in"], #booking-checkin');
    const checkOutInput = form.querySelector('[name="check-out"], [name="check_out"], #booking-checkout');
    const guestsInput = form.querySelector('[name="guests"], [name="voyageurs"], #booking-guests');
    const messageInput = form.querySelector('[name="message"], #booking-message');

    if (checkInInput) checkInInput.value = bookingData.checkIn || '';
    if (checkOutInput) checkOutInput.value = bookingData.checkOut || '';
    if (guestsInput) guestsInput.value = bookingData.guests || 2;
    if (messageInput) {
      messageInput.value = `Bonjour,\n\nJe souhaite réserver du ${bookingData.checkIn} au ${bookingData.checkOut} pour ${bookingData.guests} personnes.\n\nMerci de me confirmer la disponibilité.\n\nCordialement,`;
    }
  }

  /**
   * Show booking options panel
   * @param {Object} bookingData
   */
  _showBookingOptions(bookingData) {
    // Remove existing panel if any
    const existing = document.querySelector('.booking-options-panel');
    if (existing) existing.remove();

    const panel = document.createElement('div');
    panel.className = 'booking-options-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-labelledby', 'booking-options-title');

    const nights = bookingData.nights || 0;
    const estimatedTotal = this.options.nightlyRate * nights;

    panel.innerHTML = `
      <div class="booking-options-panel__overlay"></div>
      <div class="booking-options-panel__content">
        <button class="booking-options-panel__close" aria-label="Fermer" type="button">&times;</button>

        <h3 id="booking-options-title" class="booking-options-panel__title">
          Réserver ${this.options.propertyName}
        </h3>

        <div class="booking-options-panel__summary">
          <p><strong>Arrivée :</strong> ${bookingData.checkIn || '—'}</p>
          <p><strong>Départ :</strong> ${bookingData.checkOut || '—'}</p>
          <p><strong>Voyageurs :</strong> ${bookingData.guests}</p>
          <p><strong>Nuits :</strong> ${nights}</p>
          <p class="booking-options-panel__price">
            <strong>Estimation :</strong> ${estimatedTotal.toLocaleString(this.options.locale)} €
          </p>
          <p class="booking-options-panel__note">
            <em>Tarif indicatif. Le prix final sera confirmé par l'hôte.</em>
          </p>
        </div>

        <div class="booking-options-panel__actions">
          <button class="btn btn--primary btn--lg btn--full" data-book-action="email">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            Envoyer une demande
          </button>

          ${this.options.airbnbUrl ? `
            <button class="btn btn--ghost btn--full" data-book-action="airbnb">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"/>
              </svg>
              Réserver sur Airbnb
            </button>
          ` : ''}

          <button class="btn btn--ghost btn--full" data-book-action="calendar">
            Modifier les dates
          </button>
        </div>
      </div>
    `;

    // Close handlers
    panel.querySelector('.booking-options-panel__close').addEventListener('click', () => panel.remove());
    panel.querySelector('.booking-options-panel__overlay').addEventListener('click', () => panel.remove());

    // Action handlers
    panel.querySelector('[data-book-action="email"]')?.addEventListener('click', () => {
      this._sendEmail(bookingData);
      panel.remove();
    });

    panel.querySelector('[data-book-action="airbnb"]')?.addEventListener('click', () => {
      if (this.options.airbnbUrl) {
        window.open(this.options.airbnbUrl, '_blank', 'noopener,noreferrer');
      }
      panel.remove();
    });

    panel.querySelector('[data-book-action="calendar"]')?.addEventListener('click', () => {
      panel.remove();
      this._scrollToCalendar(this.options.propertyId);
    });

    document.body.appendChild(panel);
    document.body.classList.add('booking-panel-open');

    // Animate in
    requestAnimationFrame(() => {
      panel.querySelector('.booking-options-panel__content').classList.add('booking-options-panel__content--visible');
    });

    // Escape key to close
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        panel.remove();
        document.body.classList.remove('booking-panel-open');
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  /**
   * Send booking inquiry via email
   * @param {Object} bookingData
   */
  _sendEmail(bookingData) {
    const subject = encodeURIComponent(
      `Réservation ${this.options.propertyName} — ${bookingData.checkIn} au ${bookingData.checkOut}`
    );
    const body = encodeURIComponent(
      `Bonjour,\n\nJe souhaite réserver ${this.options.propertyName}.\n\n` +
      `Dates : du ${bookingData.checkIn} au ${bookingData.checkOut}\n` +
      `Nombre de voyageurs : ${bookingData.guests}\n` +
      `Nombre de nuits : ${bookingData.nights}\n\n` +
      `Merci de me contacter pour confirmer la disponibilité et le prix final.\n\n` +
      `Cordialement,`
    );

    window.location.href = `mailto:${this.options.bookingEmail}?subject=${subject}&body=${body}`;
  }

  /**
   * Generate iCal export URL for external calendars
   * @param {Object} bookingData
   * @returns {string}
   */
  static generateICalEvent(bookingData) {
    const formatICalDate = (date) => {
      const d = new Date(date + 'T00:00:00');
      return d.toISOString().replace(/[-:]/g, '').substring(0, 15) + 'Z';
    };

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CalmRio//Booking//FR',
      'BEGIN:VEVENT',
      `UID:${bookingData.propertyId}-${Date.now()}@calmrio.fr`,
      `DTSTART:${formatICalDate(bookingData.checkIn)}`,
      `DTEND:${formatICalDate(bookingData.checkOut)}`,
      `SUMMARY:Réservé - ${bookingData.propertyName || 'CalmRio'}`,
      `DESCRIPTION:Confirmation de réservation ${bookingData.propertyName} pour ${bookingData.guests} personnes. ${bookingData.nights || ''} nuits.`,
      'TRANSP:OPAQUE',
      'END:VEVENT',
      'END:VCALENDAR'
    ];

    return lines.join('\r\n');
  }

  /**
   * Download an iCal file for a booking
   * @param {Object} bookingData
   */
  static downloadICal(bookingData) {
    const content = BookingIntegration.generateICalEvent(bookingData);
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calmrio-reservation-${bookingData.checkIn}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Destroy the booking integration
   */
  destroy() {
    if (this.calendar) {
      this.calendar.destroy();
    }
    this.state.isInitialized = false;
  }
}

export default BookingIntegration;
