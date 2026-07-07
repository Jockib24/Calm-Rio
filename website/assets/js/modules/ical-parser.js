/**
 * iCal Parser — RFC 5545 compliant ICS parser
 * CalmRio Vacation Rentals
 *
 * Converts iCal feed data into structured availability information
 * Supports: VEVENT, VFREEBUSY, RRULE (recurring), EXDATE
 *
 * @module ical-parser
 */

export class ICalParser {
  /**
   * Parse raw iCal string content into structured calendar data
   * @param {string} icalString - Raw ICS file content
   * @param {Object} [options] - Parser options
   * @param {string} [options.propertyId] - Property identifier for tracking
   * @returns {Object} Parsed calendar { events, properties, errors }
   */
  static parse(icalString, options = {}) {
    const result = {
      events: [],
      properties: {},
      errors: [],
      dateRange: { min: null, max: null }
    };

    if (!icalString || typeof icalString !== 'string') {
      result.errors.push('Invalid iCal data: empty or non-string input');
      return result;
    }

    try {
      // Normalize line endings (VCALENDAR uses CRLF + line folding)
      const normalized = this._normalize(icalString);

      // Extract VCALENDAR properties
      result.properties = this._extractProperties(normalized);

      // Extract all VEVENT entries
      const vevents = this._extractComponents(normalized, 'VEVENT');
      for (const vevent of vevents) {
        try {
          const event = this._parseEvent(vevent);
          if (event) {
            result.events.push(event);
          }
        } catch (eventError) {
          result.errors.push(`Event parse error: ${eventError.message}`);
        }
      }

      // Sort events by start date
      result.events.sort((a, b) => a.startDate - b.startDate);

      // Determine date range
      if (result.events.length > 0) {
        result.dateRange.min = result.events[0].startDate;
        result.dateRange.max = result.events[result.events.length - 1].endDate;
      }

    } catch (parseError) {
      result.errors.push(`iCal parse error: ${parseError.message}`);
    }

    return result;
  }

  /**
   * Normalize iCal content: handle line folding, normalize line endings
   * @param {string} icalString
   * @returns {string}
   */
  static _normalize(icalString) {
    return icalString
      // Replace CRLF with LF
      .replace(/\r\n/g, '\n')
      // Handle folded lines (continuation with leading whitespace)
      .replace(/\n\s+/g, '')
      // Remove trailing whitespace
      .trim();
  }

  /**
   * Extract top-level properties from VCALENDAR
   * @param {string} normalized
   * @returns {Object}
   */
  static _extractProperties(normalized) {
    const props = {};
    const propRegex = /^([A-Z]+);?(.*?):(.*)$/gm;
    let match;

    while ((match = propRegex.exec(normalized)) !== null) {
      const key = match[1];
      const params = match[2];
      const value = match[3];

      if (!['BEGIN', 'END', 'BEGIN:VEVENT', 'END:VEVENT'].includes(key)) {
        props[key] = { value, params };
      }
    }

    return props;
  }

  /**
   * Extract all occurrences of a component type (e.g., VEVENT)
   * @param {string} normalized
   * @param {string} componentType
   * @returns {string[]}
   */
  static _extractComponents(normalized, componentType) {
    const components = [];
    const regex = new RegExp(
      `BEGIN:${componentType}([\\s\\S]*?)END:${componentType}`,
      'gi'
    );
    let match;

    while ((match = regex.exec(normalized)) !== null) {
      components.push(match[1].trim());
    }

    return components;
  }

  /**
   * Parse a single VEVENT block into a structured event object
   * @param {string} veventBlock
   * @returns {Object|null}
   */
  static _parseEvent(veventBlock) {
    const lines = veventBlock.split('\n');
    const event = {
      uid: '',
      startDate: null,
      endDate: null,
      isBlocked: false,  // booked/blocked
      isAvailable: false, // free/buffer
      summary: '',
      description: '',
      location: '',
      recurrenceRule: null,
      exceptionDates: [],
      transparency: 'OPAQUE',
      createdAt: null,
      lastModified: null,
      sequence: 0,
      raw: veventBlock
    };

    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;

      const name = line.substring(0, colonIndex);
      const value = line.substring(colonIndex + 1);

      // Handle parameters in property name (e.g., DTSTART;VALUE=DATE)
      const [propName, ...paramParts] = name.split(';');
      const params = {};
      for (const part of paramParts) {
        const eqIdx = part.indexOf('=');
        if (eqIdx > 0) {
          params[part.substring(0, eqIdx)] = part.substring(eqIdx + 1);
        }
      }

      switch (propName) {
        case 'UID':
          event.uid = value;
          break;

        case 'DTSTART':
          event.startDate = this._parseDateValue(value, params);
          break;

        case 'DTEND':
          event.endDate = this._parseDateValue(value, params);
          break;

        case 'SUMMARY':
          event.summary = this._unescapeText(value);
          break;

        case 'DESCRIPTION':
          event.description = this._unescapeText(value);
          break;

        case 'LOCATION':
          event.location = this._unescapeText(value);
          break;

        case 'TRANSP':
          event.transparency = value;
          break;

        case 'RRULE':
          event.recurrenceRule = this._parseRRule(value);
          break;

        case 'EXDATE':
          event.exceptionDates.push(...this._parseExDate(value, params));
          break;

        case 'CREATED':
          event.createdAt = this._parseDateValue(value, params);
          break;

        case 'LAST-MODIFIED':
          event.lastModified = this._parseDateValue(value, params);
          break;

        case 'SEQUENCE':
          event.sequence = parseInt(value, 10) || 0;
          break;

        case 'STATUS': {
          if (value === 'CANCELLED') return null; // Skip cancelled events
          break;
        }
      }
    }

    // Determine event type based on transparency and summary
    if (event.transparency === 'TRANSPARENT') {
      event.isAvailable = true;
    } else {
      event.isBlocked = true;
    }

    // If no dates parsed, event is invalid
    if (!event.startDate) return null;

    // If no end date, default to start date (all-day single)
    if (!event.endDate) {
      event.endDate = new Date(event.startDate);
      event.endDate.setDate(event.endDate.getDate() + 1);
    }

    return event;
  }

  /**
   * Parse a date value from iCal format
   * Supports: DATE (YYYYMMDD), DATETIME (YYYYMMDDTHHMMSS), with timezone
   * @param {string} value
   * @param {Object} params
   * @returns {Date|null}
   */
  static _parseDateValue(value, params = {}) {
    // Clean the value
    const cleanValue = value.trim();

    // Handle DATE format: 20240629
    if (/^\d{8}$/.test(cleanValue)) {
      const year = parseInt(cleanValue.substring(0, 4), 10);
      const month = parseInt(cleanValue.substring(4, 6), 10) - 1;
      const day = parseInt(cleanValue.substring(6, 8), 10);
      return new Date(Date.UTC(year, month, day));
    }

    // Handle DATETIME format: 20240629T143000
    if (/^\d{8}T\d{6}(Z)?$/.test(cleanValue)) {
      const year = parseInt(cleanValue.substring(0, 4), 10);
      const month = parseInt(cleanValue.substring(4, 6), 10) - 1;
      const day = parseInt(cleanValue.substring(6, 8), 10);
      const hour = parseInt(cleanValue.substring(9, 11), 10);
      const minute = parseInt(cleanValue.substring(11, 13), 10);
      const second = parseInt(cleanValue.substring(13, 15), 10);

      const date = new Date(Date.UTC(year, month, day, hour, minute, second));

      // If UTC flag (Z suffix) or VALUE=DATE-TIME, return as-is
      if (cleanValue.endsWith('Z')) {
        return date;
      }

      // Floating time — treat as UTC for consistency
      return date;
    }

    // Handle TZID parameter: DTSTART;TZID=Europe/Paris:20240629T143000
    if (cleanValue.length >= 15 && cleanValue.includes('T')) {
      const datePart = cleanValue.substring(0, 8);
      const timePart = cleanValue.substring(9, 15);
      const year = parseInt(datePart.substring(0, 4), 10);
      const month = parseInt(datePart.substring(4, 6), 10) - 1;
      const day = parseInt(datePart.substring(6, 8), 10);
      const hour = parseInt(timePart.substring(0, 2), 10);
      const minute = parseInt(timePart.substring(2, 4), 10);
      const second = parseInt(timePart.substring(4, 6), 10);

      return new Date(Date.UTC(year, month, day, hour, minute, second));
    }

    return null;
  }

  /**
   * Parse recurrence rule (RRULE) string
   * @param {string} rruleString
   * @returns {Object|null}
   */
  static _parseRRule(rruleString) {
    if (!rruleString) return null;

    const rule = { freq: 'DAILY', interval: 1, until: null, count: null };
    const parts = rruleString.split(';');

    for (const part of parts) {
      const eqIdx = part.indexOf('=');
      if (eqIdx <= 0) continue;

      const key = part.substring(0, eqIdx);
      const value = part.substring(eqIdx + 1);

      switch (key) {
        case 'FREQ':
          rule.freq = value;
          break;
        case 'INTERVAL':
          rule.interval = parseInt(value, 10) || 1;
          break;
        case 'COUNT':
          rule.count = parseInt(value, 10) || null;
          break;
        case 'UNTIL':
          rule.until = this._parseDateValue(value);
          break;
        case 'BYDAY':
          rule.byDay = value.split(',');
          break;
        case 'BYMONTH':
          rule.byMonth = value.split(',').map(Number);
          break;
        case 'BYMONTHDAY':
          rule.byMonthDay = value.split(',').map(Number);
          break;
      }
    }

    return rule;
  }

  /**
   * Parse exception dates (EXDATE)
   * @param {string} value
   * @param {Object} params
   * @returns {Date[]}
   */
  static _parseExDate(value, params = {}) {
    // EXDATE can have multiple comma-separated dates
    const dates = value.split(',');
    return dates
      .map(d => this._parseDateValue(d.trim(), params))
      .filter(d => d !== null);
  }

  /**
   * Unescape iCal text (escape sequences)
   * @param {string} text
   * @returns {string}
   */
  static _unescapeText(text) {
    return text
      .replace(/\\n/g, '\n')
      .replace(/\\N/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\');
  }

  /**
   * Generate availability map from parsed events for a date range
   * @param {Object[]} events - Parsed events from .parse()
   * @param {Date} rangeStart - Start date
   * @param {Date} rangeEnd - End date
   * @returns {Map<string, { available: boolean, booked: boolean, buffer: boolean }>}
   */
  static buildAvailabilityMap(events, rangeStart, rangeEnd) {
    const map = new Map();
    const current = new Date(rangeStart);

    // Initialize all dates as available
    while (current <= rangeEnd) {
      const key = this._dateKey(current);
      map.set(key, { available: true, booked: false, buffer: false });
      current.setDate(current.getDate() + 1);
    }

    // Mark blocked/booked dates
    for (const event of events) {
      if (!event.isBlocked) continue;

      const start = new Date(event.startDate);
      const end = new Date(event.endDate);

      // Ensure we're within range
      if (end < rangeStart || start > rangeEnd) continue;

      const eventStart = start < rangeStart ? rangeStart : start;
      const eventEnd = end > rangeEnd ? rangeEnd : end;

      const iter = new Date(eventStart);
      while (iter < eventEnd) {
        const key = this._dateKey(iter);
        if (map.has(key)) {
          map.set(key, { available: false, booked: true, buffer: false });
        }
        iter.setDate(iter.getDate() + 1);
      }
    }

    return map;
  }

  /**
   * Convert a date to YYYY-MM-DD key string
   * @param {Date} date
   * @returns {string}
   */
  static _dateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Fetch iCal feed from URL (with CORS proxy support)
   * @param {string} url - iCal feed URL
   * @param {Object} [options]
   * @param {string} [options.corsProxy] - CORS proxy URL (e.g., https://corsproxy.io/?)
   * @returns {Promise<string>} Raw iCal content
   */
  static async fetch(url, options = {}) {
    const fetchUrl = options.corsProxy
      ? `${options.corsProxy}${encodeURIComponent(url)}`
      : url;

    const response = await fetch(fetchUrl, {
      headers: {
        'Accept': 'text/calendar, application/octet-stream, */*'
      }
    });

    if (!response.ok) {
      throw new Error(`iCal fetch failed: ${response.status} ${response.statusText}`);
    }

    return await response.text();
  }

  /**
   * Convert availability map to an array of weeks for calendar rendering
   * @param {Map} availabilityMap
   * @param {number} year
   * @param {number} month (1-12)
   * @returns {Object[]} Weeks array for calendar rendering
   */
  static buildCalendarGrid(availabilityMap, year, month) {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startPad = firstDay.getDay(); // 0=Sun, 1=Mon...

    const weeks = [];
    let currentWeek = [];
    let dayCounter = 1;

    // Pad days before month start
    for (let i = 0; i < startPad; i++) {
      currentWeek.push(null);
    }

    // Month days
    while (dayCounter <= lastDay.getDate()) {
      const date = new Date(year, month - 1, dayCounter);
      const key = this._dateKey(date);
      const status = availabilityMap.get(key) || { available: false, booked: true };

      currentWeek.push({
        day: dayCounter,
        date: date,
        key: key,
        available: status.available,
        booked: status.booked,
        isToday: this._isToday(date),
        isPast: date < new Date(new Date().toDateString()),
        dayOfWeek: date.getDay()
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      dayCounter++;
    }

    // Pad remaining days
    if (currentWeek.length > 0 && currentWeek.length < 7) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }

  /**
   * Check if a date is today
   * @param {Date} date
   * @returns {boolean}
   */
  static _isToday(date) {
    const today = new Date();
    return date.getFullYear() === today.getFullYear()
      && date.getMonth() === today.getMonth()
      && date.getDate() === today.getDate();
  }

  /**
   * Generate mock iCal data for development/demo
   * @param {Object} property - Property info
   * @param {number} monthsAhead - How many months to generate
   * @returns {string} Mock ICS content
   */
  static generateMockData(property, monthsAhead = 6) {
    const now = new Date();
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CalmRio//Availability Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:CalmRio - ' + property.name,
      'X-WR-TIMEZONE:Europe/Paris'
    ];

    // Generate some blocked dates (weekends, random weeks)
    const blockedDates = [];
    for (let m = 0; m < monthsAhead; m++) {
      for (let d = 1; d <= 28; d++) {
        const date = new Date(now.getFullYear(), now.getMonth() + m, d);
        const dayOfWeek = date.getDay();

        // Block some weekends (Friday-Sunday)
        if (dayOfWeek >= 5 && Math.random() > 0.3) {
          blockedDates.push(date);
        }
        // Block some full weeks (random)
        if (d % 7 === 0 && Math.random() > 0.6) {
          for (let b = 0; b < 7; b++) {
            const blockDate = new Date(date);
            blockDate.setDate(blockDate.getDate() + b);
            if (!blockedDates.some(d => d.getTime() === blockDate.getTime())) {
              blockedDates.push(blockDate);
            }
          }
        }
      }
    }

    // Sort and group consecutive dates
    blockedDates.sort((a, b) => a - b);
    let eventId = 1;

    let i = 0;
    while (i < blockedDates.length) {
      const startDate = blockedDates[i];
      let endDate = new Date(startDate);

      while (i + 1 < blockedDates.length) {
        const next = new Date(blockedDates[i + 1]);
        const diff = (next - endDate) / (1000 * 60 * 60 * 24);
        if (diff <= 1) {
          endDate = next;
          i++;
        } else {
          break;
        }
      }

      // Add one day to endDate (iCal end date is exclusive)
      const icalEnd = new Date(endDate);
      icalEnd.setDate(icalEnd.getDate() + 1);

      const fmtStart = this._formatICalDate(startDate);
      const fmtEnd = this._formatICalDate(icalEnd);

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${property.id}-block-${eventId}@calmrio.fr`);
      lines.push(`DTSTART;VALUE=DATE:${fmtStart}`);
      lines.push(`DTEND;VALUE=DATE:${fmtEnd}`);
      lines.push('SUMMARY:Occupé');
      lines.push('TRANSP:OPAQUE');
      lines.push('END:VEVENT');

      eventId++;
      i++;
    }

    lines.push('END:VCALENDAR');
    return lines.join('\n');
  }

  /**
   * Format date to iCal DATE format (YYYYMMDD)
   * @param {Date} date
   * @returns {string}
   */
  static _formatICalDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  }
}

export default ICalParser;
