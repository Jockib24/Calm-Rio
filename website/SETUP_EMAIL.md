# CalmRio — Email Automation Setup Guide

> **Duration:** ~30 minutes
> **Cost:** Free (Brevo free tier: 300 emails/day)

## Overview

This setup connects your static site's forms to Brevo (formerly Sendinblue) via a Cloudflare Worker, enabling:
- **Newsletter signups** → stored in Brevo contact list
- **Contact form submissions** → email notification to your inbox
- **Booking requests** → email notification to your inbox

## Prerequisites

- A [Brevo](https://www.brevo.com/) account (free)
- A [Cloudflare](https://dash.cloudflare.com/) account (free)
- Node.js installed (for Wrangler CLI)

---

## Step 1: Create Brevo Account & Get API Key

1. Go to [brevo.com](https://www.brevo.com/) and sign up for free
2. Verify your email address
3. Go to **Settings → API Keys**
4. Click **Generate a new API key**
5. Copy the key (starts with `xkeysib-`)

## Step 2: Verify Sender Email

1. In Brevo, go to **Settings → Senders & IPs → Senders**
2. Click **Add a Sender**
3. Enter your sender email (e.g., `noreply@calmrio.com`)
4. Check your inbox and click the verification link

## Step 3: Create Newsletter List

1. In Brevo, go to **Contacts → Lists**
2. Click **New List**
3. Name it `Newsletter Subscribers`
4. Note the List ID (shown in the URL: `/list/123`)

## Step 4: Deploy Cloudflare Worker

```bash
# Navigate to worker directory
cd /path/to/website/worker

# Install Wrangler (if not installed)
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Set secrets (required)
wrangler secret put BREVO_API_KEY
# Paste your xkeysib-... key

# Deploy
wrangler deploy
```

After deployment, note your Worker URL:
```
https://calmrio-email.<your-subdomain>.workers.dev
```

## Step 5: Configure Environment Variable

Create `.env` in the `website/` root:

```bash
VITE_EMAIL_WORKER_URL=https://calmrio-email.<your-subdomain>.workers.dev
```

Or add to your `opencode.json` / build config.

## Step 6: Test

1. Open the website in a browser
2. Submit a newsletter signup → check Brevo Contacts list
3. Submit the contact form → check your notification inbox
4. Submit a booking request → check your notification inbox

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| "Server configuration error" | Missing Worker secrets | Run `wrangler secret put BREVO_API_KEY` |
| CORS error in browser | ALLOWED_ORIGIN mismatch | Update `ALLOWED_ORIGIN` in `wrangler.toml` |
| "Invalid email address" | Sender not verified in Brevo | Check Settings → Senders in Brevo |
| 402 error | Free tier limit reached | Upgrade Brevo plan or wait for daily reset |
| Worker not responding | Not deployed | Run `wrangler deploy` again |

## Architecture

```
[Static HTML Form]  ──POST──▶  [Cloudflare Worker]  ──POST──▶  [Brevo API]
     │                              │                              │
     │ Newsletter                   │ POST /v3/contacts            │ Add to list
     │ Contact/Booking              │ POST /v3/smtp/email          │ Send email
     └──────────────────────────────┘                              └────────────
```

## Files Created

| File | Purpose |
|------|---------|
| `assets/js/modules/email.js` | Frontend module — send form data to Worker |
| `assets/js/modules/email-form-handler.js` | DOM wiring — connects forms to email.js |
| `worker/email-worker.js` | Cloudflare Worker — routes to Brevo API |
| `worker/wrangler.toml` | Worker configuration |
