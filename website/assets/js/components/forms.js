/* ==========================================================================
   forms.js — Form Validation & Enhancement
   CalmRio — Premium Vacation Rentals, Royan & Saint-Trojan-les-Bains
   Features: validation, loading states, char counter, anti-double-submit
   ========================================================================== */

import { on, debounce, sanitizeHTML } from '../utils/helpers.js';

const SELECTORS = {
    form: 'form[data-validate]',
    required: '[required]',
    email: 'input[type="email"]',
    phone: 'input[type="tel"]',
    textarea: 'textarea[data-maxlength]',
    charCounter: '[data-char-counter]',
    submitBtn: 'button[type="submit"], input[type="submit"]',
    errorContainer: '[data-error]',
    successContainer: '[data-success]',
};

const CLASSES = {
    error: 'is-error',
    valid: 'is-success',
    loading: 'form--loading',
    submitted: 'form--submitted',
    disabled: 'form__btn--disabled',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// French phone: +33 or 0 followed by 9 digits
const PHONE_REGEX = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;

/** @type {Function[]} */
let cleanups = [];

/* --------------------------------------------------------------------------
   Public: init
   -------------------------------------------------------------------------- */

/**
 * Initialise all forms on the page.
 */
export function initForms() {
    const forms = document.querySelectorAll(SELECTORS.form);

    forms.forEach((form) => {
        initForm(form);
    });
}

/* --------------------------------------------------------------------------
   Public: destroy
   -------------------------------------------------------------------------- */

/**
 * Remove all form listeners.
 */
export function destroyForms() {
    cleanups.forEach((fn) => fn());
    cleanups = [];
}

/* --------------------------------------------------------------------------
   Init a single form
   -------------------------------------------------------------------------- */

/**
 * @param {HTMLFormElement} form
 */
function initForm(form) {
    // Real-time validation on blur
    initBlurValidation(form);

    // Submit handler
    const submitHandler = (e) => {
        e.preventDefault();
        handleSubmit(form);
    };
    form.addEventListener('submit', submitHandler);
    cleanups.push(() => form.removeEventListener('submit', submitHandler));

    // Character counters for textareas
    initCharCounters(form);

    // Disable browser validation — we handle it ourselves
    form.setAttribute('novalidate', '');
}

/* --------------------------------------------------------------------------
   Blur validation
   -------------------------------------------------------------------------- */

function initBlurValidation(form) {
    const fields = form.querySelectorAll('input, select, textarea');

    fields.forEach((field) => {
        const validate = () => {
            validateField(field);
        };

        field.addEventListener('blur', validate);
        // Clear error on input
        field.addEventListener('input', debounce(() => {
            if (field.classList.contains(CLASSES.error)) {
                validateField(field);
            }
        }, 300));

        cleanups.push(() => {
            field.removeEventListener('blur', validate);
        });
    });
}

/* --------------------------------------------------------------------------
   Validate a single field
   -------------------------------------------------------------------------- */

/**
 * @param {HTMLElement} field — input, select, or textarea
 * @returns {boolean} — whether the field is valid
 */
function validateField(field) {
    const value = field.value.trim();
    const isRequired = field.hasAttribute('required') || field.getAttribute('aria-required') === 'true';
    let error = '';

    // Required check
    if (isRequired && !value) {
        error = getErrorMessage(field, 'required') || 'Ce champ est requis.';
    }

    // Email check
    if (!error && field.type === 'email' && value) {
        if (!EMAIL_REGEX.test(value)) {
            error = getErrorMessage(field, 'email') || 'Veuillez entrer une adresse email valide.';
        }
    }

    // Phone check
    if (!error && field.type === 'tel' && value) {
        if (!PHONE_REGEX.test(value.replace(/\s+/g, ''))) {
            error = getErrorMessage(field, 'phone') || 'Veuillez entrer un numéro de téléphone valide.';
        }
    }

    // Minlength check
    if (!error && field.hasAttribute('minlength') && value.length < parseInt(field.getAttribute('minlength'), 10)) {
        const min = field.getAttribute('minlength');
        error = getErrorMessage(field, 'minlength') || `Minimum ${min} caractères requis.`;
    }

    // Pattern check
    if (!error && field.hasAttribute('pattern') && value) {
        try {
            const pattern = new RegExp(field.getAttribute('pattern'));
            if (!pattern.test(value)) {
                error = getErrorMessage(field, 'pattern') || 'Format invalide.';
            }
        } catch {
            // Invalid regex pattern — skip
        }
    }

    showFieldError(field, error);
    return !error;
}

/**
 * Show or clear error state on a field.
 * @param {HTMLElement} field
 * @param {string} errorMessage — empty string means valid
 */
function showFieldError(field, errorMessage) {
    const wrapper = field.parentElement;
    if (!wrapper) return;

    let errorEl = wrapper.querySelector('.form-error');
    if (!errorEl) {
        errorEl = document.createElement('span');
        errorEl.className = 'form-error';
        errorEl.setAttribute('role', 'alert');
        wrapper.appendChild(errorEl);
    }

    if (errorMessage) {
        field.classList.add(CLASSES.error);
        field.classList.remove(CLASSES.valid);
        field.setAttribute('aria-invalid', 'true');
        errorEl.textContent = errorMessage;
        errorEl.hidden = false;
    } else {
        field.classList.remove(CLASSES.error);
        field.classList.add(CLASSES.valid);
        field.setAttribute('aria-invalid', 'false');
        errorEl.textContent = '';
        errorEl.hidden = true;
    }
}

/**
 * Get custom error message from data attributes.
 * @param {HTMLElement} field
 * @param {string} type — 'required', 'email', 'phone', etc.
 * @returns {string|null}
 */
function getErrorMessage(field, type) {
    return field.getAttribute(`data-error-${type}`) || null;
}

/* --------------------------------------------------------------------------
   Form submission
   -------------------------------------------------------------------------- */

/**
 * @param {HTMLFormElement} form
 */
function handleSubmit(form) {
    // Validate all fields
    const fields = form.querySelectorAll('input, select, textarea');
    let isValid = true;

    fields.forEach((field) => {
        if (field.hasAttribute('required') || field.type === 'email' || field.type === 'tel') {
            const valid = validateField(field);
            if (!valid) isValid = false;
        }
    });

    if (!isValid) {
        // Focus the first invalid field
        const firstError = form.querySelector(`.${CLASSES.error}`);
        if (firstError) firstError.focus();
        return;
    }

    // Prevent double submission
    if (form.classList.contains(CLASSES.loading)) return;

    startSubmission(form);

    // Check if form has a custom handler
    const customHandler = form.getAttribute('data-submit-handler');
    if (customHandler && typeof window[customHandler] === 'function') {
        try {
            window[customHandler](form, (success, message) => {
                endSubmission(form, success, message);
            });
        } catch (err) {
            endSubmission(form, false, 'Une erreur est survenue. Veuillez réessayer.');
            console.error('Form submission error:', err);
        }
        return;
    }

    // Default: use form action
    submitFormAjax(form);
}

/**
 * Submit the form via fetch API.
 * @param {HTMLFormElement} form
 */
async function submitFormAjax(form) {
    const action = form.getAttribute('action') || window.location.href;
    const method = (form.getAttribute('method') || 'POST').toUpperCase();

    try {
        const formData = new FormData(form);
        const isJson = form.getAttribute('enctype') === 'application/json';

        let body;
        let headers = {};

        if (isJson) {
            const json = {};
            formData.forEach((value, key) => {
                json[key] = value;
            });
            body = JSON.stringify(json);
            headers['Content-Type'] = 'application/json';
        } else {
            // URL-encoded is default for FormData
            body = new URLSearchParams(formData);
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }

        const response = await fetch(action, {
            method,
            headers,
            body,
        });

        if (response.ok) {
            endSubmission(form, true, 'Message envoyé avec succès !');
            // Optionally reset form
            if (form.getAttribute('data-reset') !== 'false') {
                form.reset();
                // Clear valid states
                form.querySelectorAll(`.${CLASSES.valid}`).forEach((el) => {
                    el.classList.remove(CLASSES.valid);
                });
            }
        } else {
            const errorData = await response.json().catch(() => ({}));
            endSubmission(form, false, errorData.message || 'Une erreur est survenue. Veuillez réessayer.');
        }
    } catch (err) {
        endSubmission(form, false, 'Erreur réseau. Vérifiez votre connexion et réessayez.');
        console.error('Form AJAX error:', err);
    }
}

/**
 * Set loading state and disable submit button.
 * @param {HTMLFormElement} form
 */
function startSubmission(form) {
    form.classList.add(CLASSES.loading, CLASSES.submitted);
    const submitBtn = form.querySelector(SELECTORS.submitBtn);
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add(CLASSES.disabled);
        // Store original text
        submitBtn.setAttribute('data-original-text', submitBtn.textContent);
        submitBtn.textContent = submitBtn.getAttribute('data-loading-text') || 'Envoi...';
    }
}

/**
 * End submission — show success or error.
 * @param {HTMLFormElement} form
 * @param {boolean} success
 * @param {string} message
 */
function endSubmission(form, success, message) {
    form.classList.remove(CLASSES.loading);

    const submitBtn = form.querySelector(SELECTORS.submitBtn);
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove(CLASSES.disabled);
        const originalText = submitBtn.getAttribute('data-original-text');
        if (originalText) {
            submitBtn.textContent = originalText;
        }
    }

    // Show message
    const containerClass = success ? 'success' : 'error';
    const containerSelector = success ? SELECTORS.successContainer : SELECTORS.errorContainer;
    let messageContainer = form.querySelector(containerSelector);

    if (!messageContainer) {
        const msgClass = success ? 'form-success-msg' : 'form-error';
        messageContainer = form.querySelector('[data-message]') || form.querySelector(`.${msgClass}`);
    }

    if (!messageContainer) {
        // Create a message container if none exists
        messageContainer = document.createElement('div');
        messageContainer.className = success ? 'form-success-msg' : 'form-error';
        messageContainer.setAttribute('role', 'status');
        (form.querySelector('.form-group') || form).appendChild(messageContainer);
    }

    if (messageContainer) {
        messageContainer.textContent = message;
        messageContainer.hidden = false;

        // Auto-hide after 5 seconds
        setTimeout(() => {
            messageContainer.hidden = true;
        }, 5000);
    }
}

/* --------------------------------------------------------------------------
   Character counters
   -------------------------------------------------------------------------- */

function initCharCounters(form) {
    const textareas = form.querySelectorAll(`${SELECTORS.textarea}, textarea[data-maxlength]`);

    textareas.forEach((textarea) => {
        const maxLength = parseInt(textarea.getAttribute('data-maxlength') || textarea.getAttribute('maxlength'), 10);
        if (!maxLength) return;

        // Find or create counter element
        let counter = textarea.nextElementSibling;
        if (!counter || !counter.hasAttribute('data-char-counter')) {
            // Look for a sibling with the data attribute
            counter = textarea.parentElement?.querySelector(SELECTORS.charCounter);
        }

        const updateCounter = () => {
            const remaining = maxLength - textarea.value.length;
            if (counter) {
                counter.textContent = `${remaining} caractère${remaining !== 1 ? 's' : ''} restant${remaining !== 1 ? 's' : ''}`;
                counter.classList.toggle('counter--warning', remaining < maxLength * 0.2);
                counter.classList.toggle('counter--exceeded', remaining < 0);
            }

            // Truncate if over limit
            if (remaining < 0 && textarea.getAttribute('data-truncate') !== 'false') {
                textarea.value = textarea.value.substring(0, maxLength);
                if (counter) counter.textContent = `0 caractère restant`;
            }
        };

        textarea.addEventListener('input', debounce(updateCounter, 100));
        updateCounter(); // Initial count
    });
}

/* --------------------------------------------------------------------------
   Form data serialization (utility)
   -------------------------------------------------------------------------- */

/**
 * Serialize form data to a plain object.
 * @param {HTMLFormElement} form
 * @returns {Object<string,string>}
 */
export function serializeForm(form) {
    const data = {};
    const formData = new FormData(form);
    formData.forEach((value, key) => {
        // Handle multiple values for same key
        if (data[key] !== undefined) {
            if (!Array.isArray(data[key])) {
                data[key] = [data[key]];
            }
            data[key].push(value);
        } else {
            data[key] = value;
        }
    });
    return data;
}

/**
 * Reset a form and clear all validation states.
 * @param {HTMLFormElement} form
 */
export function resetForm(form) {
    form.reset();
    form.querySelectorAll(`.${CLASSES.error}, .${CLASSES.valid}`).forEach((el) => {
        el.classList.remove(CLASSES.error, CLASSES.valid);
        el.setAttribute('aria-invalid', 'false');
    });
    const messageContainer = form.querySelector('[data-message], .form-success-msg, .form-error');
    if (messageContainer) {
        messageContainer.hidden = true;
        messageContainer.textContent = '';
    }
}
