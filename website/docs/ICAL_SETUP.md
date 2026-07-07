# iCal Synchronization — CalmRio Direct Booking

## Overview

iCal (iCalendar) is the industry standard for calendar synchronization between booking platforms. This document explains how to set up iCal sync for CalmRio's direct booking website with Airbnb.

## How It Works

```
Airbnb Calendar
     │
     │  Export iCal URL
     ▼
Direct Website ───→ iCal Parser (JS) ───→ Availability Calendar
     │
     │  Import Airbnb iCal URL
     ▼
Booking.com / Abritel / Vrbo
```

## Step 1: Get Airbnb iCal Export URLs

For each Airbnb listing:

1. Log into Airbnb → **Your listings** → Select a property
2. Go to **Pricing & availability** → **Calendar sync**
3. Under **Export calendar**, copy the iCal URL
4. Save it for each property:

| Property | Airbnb Listing ID | iCal Export URL (placeholder) |
|----------|------------------|-------------------------------|
| Royan Apartment | 1101432035369683458 | `https://www.airbnb.com/calendar/ical/1101432035369683458.ics?s=YOUR_SECRET` |
| Saint-Trojan Villa | 50122536 | `https://www.airbnb.com/calendar/ical/50122536.ics?s=YOUR_SECRET` |
| Saint-Trojan House | 1431741688356720747 | `https://www.airbnb.com/calendar/ical/1431741688356720747.ics?s=YOUR_SECRET` |

## Step 2: Configure iCal URLs in the Website

Edit `/website/assets/js/modules/booking-init.js` and set the `icalUrl` fields:

```javascript
const propertyConfigs = {
  'royan-appartement': {
    propertyId: '1101432035369683458',
    // ... other config ...
    icalUrl: 'https://www.airbnb.com/calendar/ical/1101432035369683458.ics?s=YOUR_SECRET',
  },
  'saint-trojan-villa': {
    propertyId: '50122536',
    // ... other config ...
    icalUrl: 'https://www.airbnb.com/calendar/ical/50122536.ics?s=YOUR_SECRET',
  },
  'saint-trojan-maison': {
    propertyId: '1431741688356720747',
    // ... other config ...
    icalUrl: 'https://www.airbnb.com/calendar/ical/1431741688356720747.ics?s=YOUR_SECRET',
  }
};
```

> **⚠️ CORS Note:** iCal feeds from Airbnb may not be directly fetchable from the browser due to CORS restrictions. Options:
> 1. **WordPress backend** (recommended): Fetch iCal server-side using `wp_remote_get()` and expose via REST API
> 2. **CORS proxy**: Use a service like `corsproxy.io` (configured by default)
> 3. **Cloudflare Worker**: Create a worker to proxy and cache iCal feeds

## Step 3: Import iCal to Other Platforms

### Import into Booking.com
1. Booking.com → **Calendar** → **Import calendar**
2. Paste the same Airbnb iCal URL
3. Set refresh frequency (every 15-60 minutes)

### Import into Abritel / Vrbo
1. Account → **Calendar** → **Import external calendar**
2. Paste the Airbnb iCal URL
3. Choose color/label for Airbnb bookings

## Step 4: WordPress Backend Implementation

When migrating to WordPress, create a REST API endpoint:

```php
// /wp-content/plugins/calmrio-booking/ical-proxy.php

function calmrio_fetch_ical($data) {
    $property_id = sanitize_text_field($data['property_id']);
    $ical_urls = [
        '1101432035369683458' => 'https://www.airbnb.com/calendar/ical/1101432035369683458.ics?s=SECRET',
        '50122536' => 'https://www.airbnb.com/calendar/ical/50122536.ics?s=SECRET',
        '1431741688356720747' => 'https://www.airbnb.com/calendar/ical/1431741688356720747.ics?s=SECRET',
    ];

    if (!isset($ical_urls[$property_id])) {
        return new WP_Error('invalid_property', 'Property not found', ['status' => 404]);
    }

    $response = wp_remote_get($ical_urls[$property_id], [
        'timeout' => 15,
        'headers' => ['Accept' => 'text/calendar']
    ]);

    if (is_wp_error($response)) {
        return new WP_Error('fetch_failed', 'Could not fetch iCal feed', ['status' => 502]);
    }

    // Cache the response (transient)
    $body = wp_remote_retrieve_body($response);
    set_transient('calmrio_ical_' . $property_id, $body, 15 * MINUTE_IN_SECONDS);

    return [
        'property_id' => $property_id,
        'ical' => $body,
        'cached_at' => current_time('mysql')
    ];
}

add_action('rest_api_init', function () {
    register_rest_route('calmrio/v1', '/ical/(?P<property_id>[a-zA-Z0-9_]+)', [
        'methods' => 'GET',
        'callback' => 'calmrio_fetch_ical',
        'permission_callback' => '__return_true',
    ]);
});
```

Then in JS, update the iCal URL to point to your WordPress REST endpoint:

```javascript
icalUrl: 'https://calmrio.fr/wp-json/calmrio/v1/ical/1101432035369683458',
```

## Step 5: Testing

1. **Block a test date** on Airbnb calendar
2. Wait up to 15 minutes for iCal cache to refresh
3. Visit the property page on your website
4. The blocked date should appear as "Occupé" in the calendar
5. Test booking a date range to verify validation works

## Calendar Refresh Frequency

| Source | Method | Frequency |
|--------|--------|-----------|
| Airbnb → Website | iCal fetch (browser/backend) | Every page load + 15min cache |
| Airbnb → Booking.com | iCal import | Every 15-60 minutes |
| Airbnb → Abritel/Vrbo | iCal import | Every 30-60 minutes |
| Website → Guest | Real-time | Instant (upon booking) |

## Emergency: Manual Override

If iCal sync fails, use the mock data fallback:

```javascript
// In booking-init.js, set useMockData to true temporarily
useMockData: true
```

This generates realistic mock availability for development purposes.

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Calendar shows all available | iCal URL not configured | Set `icalUrl` in booking-init.js |
| CORS error in console | Browser can't fetch Airbnb's iCal | Use WordPress backend proxy or CORS proxy |
| Calendar won't load | Invalid iCal data | Check the iCal URL is correct and accessible |
| Dates not updating | Cache too long | Reduce transient cache to 5 minutes |
| Double bookings | iCal not synced fast enough | Use a channel manager (Smoobu, Lodgify) |
