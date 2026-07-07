/**
 * Availability Calendar — Interactive booking calendar
 * CalmRio Vacation Rentals
 *
 * Displays month-by-month availability using parsed iCal data.
 * Supports date selection, month navigation, and booking form integration.
 *
 * @module availability-calendar
 * @requires ./ical-parser.js
 */

import { ICalParser } from './ical-parser.js';

export class AvailabilityCalendar {
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    if (!this.container) {
      throw new Error('AvailabilityCalendar: container element not found');
    }

    this.options = {
      propertyId: options.propertyId || 'default',
      propertyName: options.propertyName || 'Property',
      icalUrl: options.icalUrl || null,
      corsProxy: options.corsProxy || null,
      monthsToShow: options.monthsToShow || 2,
      startMonth: options.startMonth || new Date().getMonth(),
      startYear: options.startYear || new Date().getFullYear(),
      minStay: options.minStay || 2,
      maxGuests: options.maxGuests || 6,
      locale: options.locale || 'fr-FR',
      onDateSelect: options.onDateSelect || null,
      onCheckAvailability: options.onCheckAvailability || null,
      useMockData: options.useMockData || false,
      ...options
    };

    this.state = {
      currentMonth: this.options.startMonth,
      currentYear: this.options.startYear,
      availabilityMap: new Map(),
      selectedCheckIn: null,
      selectedCheckOut: null,
      guestCount: 2,
      isLoading: true,
      error: null,
      events: []
    };

    this.elements = {
      calendarGrid: null,
      monthDisplay: null,
      prevBtn: null,
      nextBtn: null,
      checkInDisplay: null,
      checkOutDisplay: null,
      guestSelect: null,
      totalDisplay: null,
      bookingForm: null,
      loadingSpinner: null,
      errorMessage: null
    };

    this._init();
  }

  /**
   * Initialize the calendar component
   */
  async _init() {
    this._render();
    this._cacheElements();
    this._bindEvents();

    try {
      await this._loadAvailability();
    } catch (err) {
      this.state.error = `Erreur de chargement du calendrier: ${err.message}`;
      this._showError();
    }

    this._renderMonth();
  }

  /**
   * Render the calendar HTML structure
   */
  _render() {
    const locale = this.options.locale;
    const monthNames = this._getMonthNames(locale);
    const dayNames = this._getDayNames(locale);

    this.container.innerHTML = `
      <div class="availability-calendar" role="group" aria-label="Calendrier de disponibilité">
        <!-- Loading State -->
        <div class="calendar-loading" aria-hidden="true">
          <div class="calendar-loading__spinner"></div>
          <p class="calendar-loading__text">Chargement du calendrier...</p>
        </div>

        <!-- Error State -->
        <div class="calendar-error" hidden>
          <p class="calendar-error__message"></p>
          <button class="btn btn--ghost calendar-error__retry">Réessayer</button>
        </div>

        <!-- Calendar Header -->
        <div class="calendar-header">
          <button class="calendar-header__nav calendar-header__nav--prev"
                  aria-label="Mois précédent" type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          <h3 class="calendar-header__title" aria-live="polite"></h3>

          <button class="calendar-header__nav calendar-header__nav--next"
                  aria-label="Mois suivant" type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>

        <!-- Calendar Grid Container -->
        <div class="calendar-grids" aria-live="polite" role="application">
          ${this._renderMonthGrid(dayNames)}
        </div>

        <!-- Legend -->
        <div class="calendar-legend">
          <span class="calendar-legend__item calendar-legend__item--available">
            <span class="calendar-legend__dot"></span> Disponible
          </span>
          <span class="calendar-legend__item calendar-legend__item--booked">
            <span class="calendar-legend__dot"></span> Occupé
          </span>
          <span class="calendar-legend__item calendar-legend__item--selected">
            <span class="calendar-legend__dot"></span> Sélectionné
          </span>
        </div>

        <!-- Booking Summary -->
        <div class="calendar-booking-summary" hidden>
          <div class="calendar-booking-summary__dates">
            <div class="calendar-booking-summary__date">
              <span class="calendar-booking-summary__label">Arrivée</span>
              <span class="calendar-booking-summary__value calendar-booking-summary__value--checkin">—</span>
            </div>
            <div class="calendar-booking-summary__arrow">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
            <div class="calendar-booking-summary__date">
              <span class="calendar-booking-summary__label">Départ</span>
              <span class="calendar-booking-summary__value calendar-booking-summary__value--checkout">—</span>
            </div>
          </div>

          <div class="calendar-booking-summary__guests">
            <label for="calendar-guests" class="calendar-booking-summary__label">Voyageurs</label>
            <select id="calendar-guests" class="calendar-booking-summary__select">
              ${Array.from({ length: this.options.maxGuests }, (_, i) => i + 1)
                .map(n => `<option value="${n}" ${n === 2 ? 'selected' : ''}>${n} ${n === 1 ? 'voyageur' : 'voyageurs'}</option>`)
                .join('')}
            </select>
          </div>

          <div class="calendar-booking-summary__total" hidden>
            <span class="calendar-booking-summary__label">Total estimé</span>
            <span class="calendar-booking-summary__price">—</span>
          </div>

          <button class="btn btn--primary btn--full calendar-booking-summary__cta" disabled>
            Vérifier la disponibilité
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render a month grid
   * @param {string[]} dayNames
   * @returns {string}
   */
  _renderMonthGrid(dayNames) {
    return `
      <div class="calendar-month" role="grid" aria-label="Calendrier">
        <div class="calendar-month__header" role="row">
          ${dayNames.map(d => `
            <div class="calendar-month__day-header" role="columnheader" aria-label="${d}">
              ${d.substring(0, 3)}
            </div>
          `).join('')}
        </div>
        <div class="calendar-month__body" role="rowgroup">
          <!-- Weeks will be rendered dynamically -->
        </div>
      </div>
    `;
  }

  /**
   * Cache DOM element references
   */
  _cacheElements() {
    this.elements.loadingSpinner = this.container.querySelector('.calendar-loading');
    this.elements.errorMessage = this.container.querySelector('.calendar-error');
    this.elements.errorMessageText = this.container.querySelector('.calendar-error__message');
    this.elements.retryBtn = this.container.querySelector('.calendar-error__retry');
    this.elements.monthDisplay = this.container.querySelector('.calendar-header__title');
    this.elements.prevBtn = this.container.querySelector('.calendar-header__nav--prev');
    this.elements.nextBtn = this.container.querySelector('.calendar-header__nav--next');
    this.elements.calendarBody = this.container.querySelector('.calendar-month__body');
    this.elements.summary = this.container.querySelector('.calendar-booking-summary');
    this.elements.checkInDisplay = this.container.querySelector('.calendar-booking-summary__value--checkin');
    this.elements.checkOutDisplay = this.container.querySelector('.calendar-booking-summary__value--checkout');
    this.elements.guestSelect = this.container.querySelector('#calendar-guests');
    this.elements.totalDisplay = this.container.querySelector('.calendar-booking-summary__total');
    this.elements.totalPrice = this.container.querySelector('.calendar-booking-summary__price');
    this.elements.ctaBtn = this.container.querySelector('.calendar-booking-summary__cta');
  }

  /**
   * Bind event listeners
   */
  _bindEvents() {
    this.elements.prevBtn.addEventListener('click', () => this._navigateMonth(-1));
    this.elements.nextBtn.addEventListener('click', () => this._navigateMonth(1));
    this.elements.retryBtn.addEventListener('click', () => this._retry());
    this.elements.guestSelect?.addEventListener('change', (e) => {
      this.state.guestCount = parseInt(e.target.value, 10);
      this._updateSummary();
    });
    this.elements.ctaBtn?.addEventListener('click', () => this._handleCTA());
  }

  /**
   * Load availability data (iCal or mock)
   */
  async _loadAvailability() {
    this._setLoading(true);
    this.state.error = null;

    try {
      let icalData;

      if (this.options.useMockData) {
        // Generate mock data for development
        icalData = ICalParser.generateMockData(
          { id: this.options.propertyId, name: this.options.propertyName },
          12
        );
      } else if (this.options.icalUrl) {
        // Fetch real iCal feed
        icalData = await ICalParser.fetch(this.options.icalUrl, {
          corsProxy: this.options.corsProxy
        });
      } else {
        // No data source — use mock
        icalData = ICalParser.generateMockData(
          { id: this.options.propertyId, name: this.options.propertyName },
          6
        );
      }

      // Parse the iCal data
      const parsed = ICalParser.parse(icalData, {
        propertyId: this.options.propertyId
      });

      if (parsed.errors.length > 0) {
        console.warn('iCal parse warnings:', parsed.errors);
      }

      this.state.events = parsed.events;

      // Build availability map covering next 12 months
      const now = new Date();
      const rangeEnd = new Date(now.getFullYear() + 1, now.getMonth(), 1);
      this.state.availabilityMap = ICalParser.buildAvailabilityMap(
        parsed.events,
        now,
        rangeEnd
      );

      this.state.isLoading = false;
      this._setLoading(false);

    } catch (err) {
      this.state.isLoading = false;
      this.state.error = err.message;
      this._setLoading(false);
      this._showError();
    }
  }

  /**
   * Render the current month
   */
  _renderMonth() {
    const locale = this.options.locale;
    const monthNames = this._getMonthNames(locale);

    // Update month display
    this.elements.monthDisplay.textContent = `${monthNames[this.state.currentMonth]} ${this.state.currentYear}`;

    // Generate calendar grid
    const weeks = ICalParser.buildCalendarGrid(
      this.state.availabilityMap,
      this.state.currentYear,
      this.state.currentMonth + 1
    );

    // Render weeks
    this.elements.calendarBody.innerHTML = weeks.map((week, weekIdx) => `
      <div class="calendar-week" role="row">
        ${week.map(day => {
          if (!day) {
            return `<div class="calendar-day calendar-day--empty" role="gridcell"></div>`;
          }

          let classes = 'calendar-day';
          let ariaLabel = this._formatDateLabel(day.date);

          if (day.isPast) {
            classes += ' calendar-day--past';
            ariaLabel += ', passé';
          } else if (day.booked) {
            classes += ' calendar-day--booked';
            ariaLabel += ', occupé';
          } else if (day.available) {
            classes += ' calendar-day--available';
          }

          if (day.isToday) {
            classes += ' calendar-day--today';
          }

          // Selected range
          if (this._isSelected(day.date)) {
            classes += ' calendar-day--in-range';
          }
          if (this._isCheckIn(day.date)) {
            classes += ' calendar-day--checkin';
          }
          if (this._isCheckOut(day.date)) {
            classes += ' calendar-day--checkout';
          }

          return `
            <button class="${classes}"
                    role="gridcell"
                    data-date="${day.key}"
                    aria-label="${ariaLabel}"
                    ${day.available && !day.isPast ? '' : 'disabled'}
                    type="button">
              <span class="calendar-day__number">${day.day}</span>
              ${day.isToday ? '<span class="calendar-day__marker">Aujourd\'hui</span>' : ''}
            </button>
          `;
        }).join('')}
      </div>
    `).join('');

    // Bind day click events
    this.container.querySelectorAll('.calendar-day--available:not(.calendar-day--past)').forEach(el => {
      el.addEventListener('click', () => this._handleDayClick(el));
    });

    // Update navigation state
    this._updateNavState();
  }

  /**
   * Handle day click
   * @param {HTMLElement} element
   */
  _handleDayClick(element) {
    const dateStr = element.dataset.date;
    const date = new Date(dateStr + 'T00:00:00');

    if (!this.state.selectedCheckIn || (this.state.selectedCheckIn && this.state.selectedCheckOut)) {
      // Start new selection
      this.state.selectedCheckIn = date;
      this.state.selectedCheckOut = null;
    } else {
      // Select checkout date
      if (date <= this.state.selectedCheckIn) {
        // If clicking before check-in, swap
        this.state.selectedCheckOut = this.state.selectedCheckIn;
        this.state.selectedCheckIn = date;
      } else {
        // Validate minimum stay
        const diffDays = Math.round((date - this.state.selectedCheckIn) / (1000 * 60 * 60 * 24));
        if (diffDays < this.options.minStay) {
          this._showToast(
            `Séjour minimum : ${this.options.minStay} nuits. Veuillez sélectionner une date de départ ultérieure.`
          );
          return;
        }

        // Check if all dates between are available
        const checkDate = new Date(this.state.selectedCheckIn);
        while (checkDate <= date) {
          const key = ICalParser._dateKey(checkDate);
          const dayStatus = this.state.availabilityMap.get(key);

          if (dayStatus && !dayStatus.available) {
            this._showToast('Ces dates ne sont pas entièrement disponibles. Veuillez choisir d\'autres dates.');
            return;
          }
          checkDate.setDate(checkDate.getDate() + 1);
        }

        this.state.selectedCheckOut = date;
      }
    }

    this._renderMonth();
    this._updateSummary();
  }

  /**
   * Navigate to previous/next month
   * @param {number} direction - -1 for prev, 1 for next
   */
  _navigateMonth(direction) {
    this.state.currentMonth += direction;

    if (this.state.currentMonth > 11) {
      this.state.currentMonth = 0;
      this.state.currentYear++;
    } else if (this.state.currentMonth < 0) {
      this.state.currentMonth = 11;
      this.state.currentYear--;
    }

    this._renderMonth();
  }

  /**
   * Update the booking summary panel
   */
  _updateSummary() {
    if (!this.state.selectedCheckIn) {
      this.elements.summary.hidden = true;
      return;
    }

    this.elements.summary.hidden = false;

    // Format dates
    const dateFormat = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    this.elements.checkInDisplay.textContent = this.state.selectedCheckIn
      ? this.state.selectedCheckIn.toLocaleDateString(this.options.locale, dateFormat)
      : '—';
    this.elements.checkOutDisplay.textContent = this.state.selectedCheckOut
      ? this.state.selectedCheckOut.toLocaleDateString(this.options.locale, dateFormat)
      : '—';

    // Calculate total
    if (this.state.selectedCheckIn && this.state.selectedCheckOut) {
      const nights = Math.round(
        (this.state.selectedCheckOut - this.state.selectedCheckIn) / (1000 * 60 * 60 * 24)
      );

      if (nights > 0) {
        const nightlyRate = this._getNightlyRate();
        const estimatedTotal = nightlyRate * nights;

        this.elements.totalDisplay.hidden = false;
        this.elements.totalPrice.textContent = `${estimatedTotal.toLocaleString(this.options.locale)} €`;

        this.elements.ctaBtn.disabled = false;
        this.elements.ctaBtn.textContent = 'Réserver maintenant';
      }
    } else {
      this.elements.totalDisplay.hidden = true;
      this.elements.ctaBtn.disabled = true;
      this.elements.ctaBtn.textContent = 'Sélectionnez votre départ';
    }
  }

  /**
   * Handle the CTA button click
   */
  _handleCTA() {
    if (this.state.selectedCheckIn && this.state.selectedCheckOut) {
      const nights = Math.round(
        (this.state.selectedCheckOut - this.state.selectedCheckIn) / (1000 * 60 * 60 * 24)
      );

      const bookingData = {
        propertyId: this.options.propertyId,
        checkIn: this._formatDate(this.state.selectedCheckIn),
        checkOut: this._formatDate(this.state.selectedCheckOut),
        guests: this.state.guestCount,
        nights: nights
      };

      if (typeof this.options.onCheckAvailability === 'function') {
        this.options.onCheckAvailability(bookingData);
      }

      // Emit custom event for other components
      this.container.dispatchEvent(new CustomEvent('calendar:book', {
        detail: bookingData,
        bubbles: true
      }));
    }
  }

  /**
   * Check if a date is in the selected range
   * @param {Date} date
   * @returns {boolean}
   */
  _isSelected(date) {
    if (!this.state.selectedCheckIn || !this.state.selectedCheckOut) return false;
    return date >= this.state.selectedCheckIn && date <= this.state.selectedCheckOut;
  }

  /**
   * Check if a date is the check-in
   * @param {Date} date
   * @returns {boolean}
   */
  _isCheckIn(date) {
    return this.state.selectedCheckIn && date.getTime() === this.state.selectedCheckIn.getTime();
  }

  /**
   * Check if a date is the check-out
   * @param {Date} date
   * @returns {boolean}
   */
  _isCheckOut(date) {
    return this.state.selectedCheckOut && date.getTime() === this.state.selectedCheckOut.getTime();
  }

  /**
   * Format date to ISO string
   * @param {Date} date
   * @returns {string}
   */
  _formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  /**
   * Format date label for ARIA
   * @param {Date} date
   * @returns {string}
   */
  _formatDateLabel(date) {
    return date.toLocaleDateString(this.options.locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  /**
   * Get nightly rate (placeholder — would come from pricing API)
   * @returns {number}
   */
  _getNightlyRate() {
    // This would normally come from a pricing engine
    // For demo purposes, use seasonal rates
    const month = this.state.selectedCheckIn?.getMonth() || 6;
    if (month >= 6 && month <= 7) return 200; // Peak summer
    if (month >= 5 || month <= 8) return 150; // Shoulder
    return 100; // Low season
  }

  /**
   * Update navigation button states
   */
  _updateNavState() {
    const now = new Date();
    const isCurrentMonth = this.state.currentMonth === now.getMonth()
      && this.state.currentYear === now.getFullYear();

    this.elements.prevBtn.disabled = isCurrentMonth;

    // Disable next if too far ahead (18 months)
    const maxMonth = new Date(now.getFullYear() + 1, now.getMonth() + 6, 1);
    const current = new Date(this.state.currentYear, this.state.currentMonth, 1);
    this.elements.nextBtn.disabled = current >= maxMonth;
  }

  /**
   * Set loading state
   * @param {boolean} loading
   */
  _setLoading(loading) {
    if (!this.elements.loadingSpinner) return;
    this.elements.loadingSpinner.hidden = !loading;
  }

  /**
   * Show error state
   */
  _showError() {
    if (this.elements.errorMessage) {
      this.elements.errorMessage.hidden = false;
      this.elements.errorMessageText.textContent = this.state.error
        || 'Impossible de charger le calendrier. Veuillez réessayer.';
    }
  }

  /**
   * Retry loading
   */
  async _retry() {
    this.elements.errorMessage.hidden = true;
    await this._loadAvailability();
    this._renderMonth();
  }

  /**
   * Show a toast message
   * @param {string} message
   */
  _showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'calendar-toast';
    toast.textContent = message;
    toast.setAttribute('role', 'alert');

    this.container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('calendar-toast--visible');
    });

    setTimeout(() => {
      toast.classList.remove('calendar-toast--visible');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  /**
   * Get month names in locale
   * @param {string} locale
   * @returns {string[]}
   */
  _getMonthNames(locale) {
    const formatter = new Intl.DateTimeFormat(locale, { month: 'long' });
    return Array.from({ length: 12 }, (_, i) =>
      formatter.format(new Date(2000, i, 1))
    );
  }

  /**
   * Get day names in locale
   * @param {string} locale
   * @returns {string[]}
   */
  _getDayNames(locale) {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: 'long' });
    // Start from Monday (ISO)
    return Array.from({ length: 7 }, (_, i) =>
      formatter.format(new Date(2024, 0, i + 1))
    );
  }

  /**
   * Update calendar with new iCal data
   * @param {string} icalUrl
   */
  async updateFeed(icalUrl) {
    this.options.icalUrl = icalUrl;
    await this._loadAvailability();
    this._renderMonth();
  }

  /**
   * Reset selected dates
   */
  resetSelection() {
    this.state.selectedCheckIn = null;
    this.state.selectedCheckOut = null;
    this._renderMonth();
    this._updateSummary();
  }

  /**
   * Destroy the calendar instance
   */
  destroy() {
    this.container.innerHTML = '';
    this.state = null;
    this.elements = {};
  }
}

export default AvailabilityCalendar;
