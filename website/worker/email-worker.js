/**
 * CalmRio Email Worker
 * Deployed on Cloudflare Workers
 *
 * Handles:
 *   - Newsletter signups (adds to Brevo contact list)
 *   - Contact form submissions (sends notification email)
 *   - Booking requests (sends notification email)
 *
 * Environment variables (set via wrangler secret or dashboard):
 *   BREVO_API_KEY       — Brevo API key (starts with xkeysib-)
 *   BREVO_SENDER_EMAIL  — Verified sender email in Brevo
 *   BREVO_SENDER_NAME   — Sender display name
 *   NOTIFICATION_EMAIL  — Where contact/booking notifications go
 *   NEWSLETTER_LIST_ID  — Brevo list ID for newsletter subscribers
 *   ALLOWED_ORIGIN      — GitHub Pages URL (CORS)
 */

const ALLOWED_ORIGIN = 'https://jockib24.github.io'

export default {
  async fetch(request) {
    // CORS headers
    const origin = request.headers.get('Origin') || ''
    const corsHeaders = {
      'Access-Control-Allow-Origin': origin.startsWith(ALLOWED_ORIGIN) ? origin : ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    // Only accept POST
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate required env vars
    if (!BREVO_API_KEY || !BREVO_SENDER_EMAIL || !NOTIFICATION_EMAIL) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    try {
      const body = await request.json()
      const { type } = body

      if (!type) {
        return new Response(JSON.stringify({ error: 'Missing form type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      let result

      switch (type) {
        case 'newsletter':
          result = await handleNewsletter(body)
          break
        case 'contact':
          result = await handleContact(body)
          break
        case 'booking':
          result = await handleBooking(body)
          break
        default:
          return new Response(JSON.stringify({ error: `Unknown form type: ${type}` }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
      }

      return new Response(JSON.stringify(result.data), {
        status: result.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  },
}

/**
 * Handle newsletter signup — add contact to Brevo list
 */
async function handleNewsletter(body) {
  const { email } = body

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: 400, data: { error: 'Invalid email address' } }
  }

  const listId = parseInt(NEWSLETTER_LIST_ID || '1', 10)

  const res = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      email,
      listIds: [listId],
      updateEnabled: true,
    }),
  })

  const data = await res.json()

  if (res.ok || res.status === 409) {
    // 409 = already exists (updateEnabled handles it)
    return { status: 200, data: { success: true, message: 'Merci pour votre inscription !' } }
  }

  return { status: 500, data: { error: data.message || 'Failed to add contact' } }
}

/**
 * Handle contact form submission — send notification email
 */
async function handleContact(body) {
  const { name, email, phone, property, dates, message } = body

  if (!name || !email || !message) {
    return { status: 400, data: { error: 'Missing required fields (name, email, message)' } }
  }

  const htmlContent = `
    <h2>📬 Nouveau message de contact</h2>
    <table style="border-collapse:collapse;width:100%;max-width:600px;font-family:sans-serif;">
      <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Nom</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(name)}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Email</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(email)}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Téléphone</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(phone || 'N/A')}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Propriété</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(property || 'N/A')}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Dates</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(dates || 'N/A')}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Message</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(message)}</td></tr>
    </table>
  `

  return sendEmail({
    to: NOTIFICATION_EMAIL,
    subject: `📬 Nouveau contact — ${name}`,
    htmlContent,
    replyTo: { email, name },
    tags: ['contact-form'],
  })
}

/**
 * Handle booking request — send notification email
 */
async function handleBooking(body) {
  const { name, email, phone, checkIn, checkOut, guests, message, property } = body

  if (!name || !email || !checkIn || !checkOut) {
    return { status: 400, data: { error: 'Missing required fields (name, email, checkIn, checkOut)' } }
  }

  const htmlContent = `
    <h2>🏡 Nouvelle demande de réservation</h2>
    <table style="border-collapse:collapse;width:100%;max-width:600px;font-family:sans-serif;">
      <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Nom</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(name)}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Email</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(email)}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Téléphone</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(phone || 'N/A')}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Propriété</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(property || 'N/A')}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Arrivée</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(checkIn)}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Départ</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(checkOut)}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Voyageurs</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(guests || 'N/A')}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Message</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(message || '—')}</td></tr>
    </table>
  `

  return sendEmail({
    to: NOTIFICATION_EMAIL,
    subject: `🏡 Demande de réservation — ${name} (${checkIn} → ${checkOut})`,
    htmlContent,
    replyTo: { email, name },
    tags: ['booking-form'],
  })
}

/**
 * Send transactional email via Brevo API
 */
async function sendEmail({ to, subject, htmlContent, replyTo, tags }) {
  const payload = {
    sender: {
      name: BREVO_SENDER_NAME,
      email: BREVO_SENDER_EMAIL,
    },
    to: [{ email: to }],
    subject,
    htmlContent,
    tags: tags || [],
  }

  if (replyTo) {
    payload.replyTo = {
      email: replyTo.email,
      name: replyTo.name || replyTo.email,
    }
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await res.json()

  if (res.ok) {
    return {
      status: 200,
      data: { success: true, message: 'Message envoyé avec succès !' },
    }
  }

  return {
    status: 500,
    data: { error: data.message || 'Failed to send email' },
  }
}

/**
 * Escape HTML to prevent XSS in email content
 */
function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
