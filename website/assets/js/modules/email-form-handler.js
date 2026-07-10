/**
 * email-form-handler.js — Wires email.js to DOM forms
 * Uses progressive enhancement: forms work without JS (mailto: fallback)
 *
 * HTML attributes:
 *   data-email-form="newsletter"  — newsletter signup (single email field)
 *   data-email-form="contact"     — contact form (name, email, message, etc.)
 *   data-email-form="booking"     — booking request (name, email, dates, guests)
 *
 * Expected child elements in form:
 *   .form-feedback[aria-live="polite"]  — success/error message container
 *   button[type="submit"]                — submit button (disabled during send)
 *   input, textarea, select              — form fields (name attribute = data key)
 */

import { submitNewsletter, submitContact, submitBooking } from './email.js'

export function initEmailForms() {
  const forms = document.querySelectorAll('[data-email-form]')
  forms.forEach(initForm)
}

function initForm(form) {
  const type = form.dataset.emailForm
  const feedback = form.querySelector('.form-feedback')
  const submitBtn = form.querySelector('button[type="submit"]')

  if (!feedback) {
    console.warn(`email-form-handler: form[data-email-form="${type}"] missing .form-feedback`)
    return
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    // Disable button during send
    if (submitBtn) submitBtn.disabled = true
    feedback.textContent = ''
    feedback.className = 'form-feedback'
    feedback.removeAttribute('role')

    // Collect form data
    const formData = new FormData(form)
    const data = Object.fromEntries(formData.entries())

    let result

    try {
      switch (type) {
        case 'newsletter':
          result = await submitNewsletter(data.email)
          break
        case 'contact':
          result = await submitContact(data)
          break
        case 'booking':
          result = await submitBooking(data)
          break
        default:
          result = { success: false, message: `Unknown form type: ${type}` }
      }
    } catch (err) {
      result = { success: false, message: 'Une erreur est survenue. Veuillez réessayer.' }
    }

    // Show feedback
    feedback.textContent = result.message
    feedback.className = `form-feedback ${result.success ? 'form-feedback--success' : 'form-feedback--error'}`
    feedback.setAttribute('role', 'alert')

    // Re-enable button
    if (submitBtn) submitBtn.disabled = false

    // Reset on success (except for newsletter which stays filled)
    if (result.success && type !== 'newsletter') {
      form.reset()
    }

    // Scroll to feedback on mobile
    feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  })
}
