/**
 * email.js — CalmRio Email Module
 * Handles form submissions via Cloudflare Worker → Brevo API
 * Forms: newsletter signup, contact inquiry, booking request
 *
 * Usage:
 *   import { submitNewsletter, submitContact, submitBooking } from './modules/email.js'
 *   await submitNewsletter('user@example.com')
 */

const WORKER_URL = import.meta.env.VITE_EMAIL_WORKER_URL || '{{WORKER_URL}}'

/**
 * Submit a newsletter signup
 * @param {string} email
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function submitNewsletter(email) {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: 'Veuillez entrer une adresse email valide.' }
  }

  try {
    const res = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'newsletter', email }),
    })
    const data = await res.json()
    return {
      success: res.ok,
      message: data.message || (res.ok ? 'Merci pour votre inscription !' : 'Une erreur est survenue.'),
    }
  } catch (err) {
    return { success: false, message: 'Erreur de connexion. Veuillez réessayer.' }
  }
}

/**
 * Submit a contact form inquiry
 * @param {Object} data - { name, email, phone, property, dates, message }
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function submitContact(data) {
  if (!data.name || !data.email || !data.message) {
    return { success: false, message: 'Veuillez remplir tous les champs obligatoires.' }
  }

  try {
    const res = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'contact', ...data }),
    })
    const json = await res.json()
    return {
      success: res.ok,
      message: json.message || (res.ok ? 'Message envoyé ! Nous vous répondrons sous 2h.' : 'Erreur lors de l\'envoi.'),
    }
  } catch (err) {
    return { success: false, message: 'Erreur de connexion. Veuillez réessayer.' }
  }
}

/**
 * Submit a booking request
 * @param {Object} data - { name, email, phone, checkIn, checkOut, guests, message, property }
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function submitBooking(data) {
  if (!data.name || !data.email || !data.checkIn || !data.checkOut) {
    return { success: false, message: 'Veuillez remplir tous les champs obligatoires.' }
  }

  try {
    const res = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'booking', ...data }),
    })
    const json = await res.json()
    return {
      success: res.ok,
      message: json.message || (res.ok ? 'Demande de réservation envoyée ! Nous vous confirmons sous 24h.' : 'Erreur lors de l\'envoi.'),
    }
  } catch (err) {
    return { success: false, message: 'Erreur de connexion. Veuillez réessayer.' }
  }
}
