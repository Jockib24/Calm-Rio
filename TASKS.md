# CalmRio — Implementation Plan

> **Status:** Draft for review  
> **Scope:** All remaining tasks from UI/UX Optimization Plan  
> **Constraint:** Keep current brand identity — no redesign of colors, typography, layout, or core concept

---

## Workstreams Overview

| Priority | Workstream | Est. Hours | Parallelizable |
|----------|-----------|-----------|----------------|
| 🔴 HIGH | B: WCAG 2.2 AA Audit + Remediation | 10.5h | Yes (A, D, E, F, G) |
| 🔴 HIGH | C: Image Optimization (WebP + srcset) | 10.5h | Yes (B, D, E, F, G) |
| 🔴 HIGH | D: Analytics Setup | 5.25h | Yes (A, B, E, F, G) |
| 🟡 MED | A: Guest Reviews on Property Pages | 3.5h | Yes (B, D, E, F, G) |
| 🟡 MED | E: Mobile Gallery Lightbox/Swipe | 6h | Yes (A, B, D, F, G) |
| 🟡 MED | F: Interactive Map (Local Guide) | 8.25h | Yes (A, B, D, E, G) |
| 🟡 MED | G: About Page — Personal Story + Photos | 3.5h | Yes (A, B, D, E, F) |
| 🟡 MED | H: Email Automation | 10h | Yes (any) |
| 🟡 MED | I: Performance Optimization | 9.5h | After C |
| 🟡 MED | J: Cross-Browser Testing | 7h | After A-I |
| 🟢 LOW | P: Missing EN Blog Posts | 3.75h | Yes (any) |
| **Total** | **All high + medium priority** | **~77.5h** | |

---

## Dependency Map

```
                    ┌──────────────────────────────────────────────┐
                    │              CAN START IMMEDIATELY            │
                    │                                              │
                    │  A: Guest Reviews   B: WCAG 2.2 AA          │
                    │  D: Analytics       E: Mobile Gallery        │
                    │  F: Interactive Map G: About Page            │
                    │  P: Missing EN Blog Posts                    │
                    └──────────┬───────────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────────────────────────────────┐
                    │              PHASE 2                          │
                    │                                              │
                    │  C: Image Optimization (can start early)     │
                    │  H: Email Automation (needs external setup)  │
                    │  I: Performance → depends on C               │
                    │  J: Testing → depends on A-I                 │
                    └──────────────────────────────────────────────┘
```

---

## Workstream A: Guest Reviews on Property Pages (~3.5h)

**Context:** Reviews already exist as static HTML on all property pages. Need to wire up the testimonial carousel, add visual star ratings, and add write-review CTAs.

| # | Task | Files |
|---|------|-------|
| A.1 | Add visual star rating component (filled/empty) to property pages | `_review-cards.scss`, 6 property HTML files |
| A.2 | Enable testimonials.js carousel on property pages | `components/testimonials.js`, 6 property HTML files |
| A.3 | Add "Écrire un avis" / "Write a review" button linking to review platform | 6 property HTML files |
| A.4 | Ensure review cards are accessible (ARIA for star ratings) | 6 property HTML files, `_review-cards.scss` |

---

## Workstream B: WCAG 2.2 AA Audit + Remediation (~10.5h)

**Context:** Basics exist (skip links, landmarks, focus styles). No full audit done. EAA compliance required for EU sites.

| # | Task | Files |
|---|------|-------|
| B.1 | axe DevTools scan on all 25 HTML pages | All HTML files |
| B.2 | WAVE evaluation on all pages | All HTML files |
| B.3 | Manual keyboard navigation test (Tab through entire site) | All pages |
| B.4 | Color contrast audit + fix failing elements | `_variables.scss`, `_dark.scss`, `_buttons.scss`, `_hero.scss` |
| B.5 | Fix heading hierarchy (no skipped levels) | All HTML files |
| B.6 | Add descriptive alt text to all images | All HTML files |
| B.7 | Fix form label associations in booking/contact forms | HTML forms, `components/forms.js` |
| B.8 | Screen reader test (VoiceOver Mac) | All pages |
| B.9 | Touch target audit — all interactive ≥ 44×44px on mobile | `_navigation.scss`, `_buttons.scss`, `_sticky-bar.scss` |
| B.10 | Fix focus-obscured issues (sticky header hiding elements) | `_header.scss`, `_sticky-bar.scss` |
| B.11 | Add skip-links to property page booking sections | 6 property HTML files |

---

## Workstream C: Image Optimization — WebP + Responsive srcset (~10.5h)

**Context:** Guide images already have local avif/webp/jpg. Property images are Unsplash CDN URLs. No `<picture>` or srcset anywhere.

| # | Task | Files |
|---|------|-------|
| C.1 | Inventory all image sources across all 25 HTML pages | All HTML files |
| C.2 | Download property images from Unsplash to local assets | `scripts/download-images.mjs` |
| C.3 | Generate webp + avif + multi-resolution jpg for property images | `scripts/optimize-images.mjs` |
| C.4 | Create `<picture>` elements with avif → webp → jpg + srcset | 6 property HTML + homepage |
| C.5 | Add explicit width/height on all images | All HTML files |
| C.6 | Add `<link rel="preload">` for hero/LCP images | All HTML `<head>` |
| C.7 | Update Vite config for all image formats | `vite.config.js` |

---

## Workstream D: Analytics Setup (~5.25h)

**Context:** Zero analytics currently.

| # | Task | Files |
|---|------|-------|
| D.1 | Choose Plausible (privacy-first) or GA4 | Decision |
| D.2 | Add analytics script to all 25 HTML pages | All HTML files |
| D.3 | Create `modules/analytics.js` for custom event tracking | New file |
| D.4 | Track key events: booking CTA, gallery, property clicks, form submits, newsletter | `analytics.js` + HTML elements |
| D.5 | Add analytics module to main.js | `main.js` |
| D.6 | Test events fire correctly | Testing |

---

## Workstream E: Mobile Gallery Lightbox/Swipe (~6h)

**Context:** `gallery-lightbox.js` already has swipe support, fullscreen, keyboard nav, focus trap. Need to ensure it's wired up on property pages. Hero slider lacks swipe.

| # | Task | Files |
|---|------|-------|
| E.1 | Verify lightbox initializes on all property pages | 6 property HTML + `gallery-lightbox.js` |
| E.2 | Remove duplicate fullscreen logic from gallery.js | `components/gallery.js` |
| E.3 | Add swipe/touch to hero-slider.js | `modules/hero-slider.js` |
| E.4 | Test on real mobile devices (iOS + Android) | Testing |

---

## Workstream F: Interactive Map (~8.25h)

**Context:** Map areas are placeholders on local-guide.html and contact.html. Property pages have static Unsplash images labeled as maps.

| # | Task | Files |
|---|------|-------|
| F.1 | Create Leaflet map module (free, no API key) | New: `assets/js/modules/map.js` |
| F.2 | Add Leaflet CSS + JS to project | HTML or `package.json` |
| F.3 | Build map with property pins + POIs on local-guide.html | `local-guide.html` (FR + EN), `map.js` |
| F.4 | Build map with property pins on contact.html | `contact.html` (FR + EN), `map.js` |
| F.5 | Add map module to main.js | `main.js` |
| F.6 | Create `_map.scss` for map styling | New file |
| F.7 | Replace static property-map images with mini Leaflet maps | 6 property HTML files |

---

## Workstream G: About Page — Personal Story + Photos (~3.5h)

**Context:** About page has host bios (Mélanie & Agnès) with text but no photos — placeholder initials only.

| # | Task | Files |
|---|------|-------|
| G.1 | Source/prepare owner photos or use tasteful placeholders | `assets/images/about/` |
| G.2 | Update host section with actual `<img>` tags | `about.html`, `en/about.html` |
| G.3 | Add warm personal story narrative ("Notre histoire") | `about.html`, `en/about.html` |
| G.4 | Add contact info / response time promise | `about.html`, `en/about.html` |
| G.5 | Style owner photos (circular crop, gold border) | `_about.scss` |

---

## Workstream H: Email Automation (~10h)

**Context:** Newsletter form submits to `#`. Booking uses `mailto:`. No email infrastructure. GitHub Pages can't run backend.

| # | Task | Files |
|---|------|-------|
| H.1 | Choose email service (Brevo recommended — free tier, EU-hosted) | Decision |
| H.2 | Create email templates (confirmation, pre-arrival, post-stay) | New: `email-templates/` |
| H.3 | Wire newsletter form to email service API | `components/forms.js` |
| H.4 | Add booking confirmation email trigger | `modules/booking-integration.js` |
| H.5 | Create email module | New: `assets/js/modules/email.js` |
| H.6 | Create serverless function (Netlify/Cloudflare Worker) for email sending | New file |

---

## Workstream I: Performance Optimization (~9.5h)

**Context:** Depends on C for full effect. SCSS duplication exists.

| # | Task | Files |
|---|------|-------|
| I.1 | Audit current Lighthouse scores | Testing |
| I.2 | Clean up SCSS duplication (components/ vs pages/) | `pages/_property-detail.scss` |
| I.3 | Inline critical CSS | `vite.config.js` |
| I.4 | Add `fetchpriority="high"` on LCP images | All HTML files |
| I.5 | Audit and remove unused CSS | Compiled CSS |
| I.6 | Add resource hints (preconnect, dns-prefetch) | All HTML `<head>` |
| I.7 | Add caching headers for GitHub Pages | `_headers` or config |
| I.8 | Final Lighthouse audit (target 90+) | Testing |

---

## Workstream J: Cross-Browser / Device Testing (~7h)

| # | Task |
|---|------|
| J.1 | Chrome (desktop + mobile) |
| J.2 | Safari (desktop + iOS) |
| J.3 | Firefox (desktop) |
| J.4 | Edge (desktop) |
| J.5 | Real mobile devices (iPhone, Android) |
| J.6 | All breakpoints: 320px → 1440px |
| J.7 | Dark mode on all browsers |
| J.8 | Slow network throttling |
| J.9 | Document and fix all bugs |

---

## Lower Priority

### Workstream P: Missing EN Blog Posts (~3.75h)
- Translate 2 blog posts from FR to EN
- Add hreflang tags
- Update sitemap.xml

### Workstream K: Abandoned Booking Recovery (~7.5h)
- Depends on H (Email) + D (Analytics)

### Workstream L-O: Video, UGC Gallery, Multi-Booking, GVR
- Nice-to-have, no immediate dependencies

---

## Suggested Sprint Plan

### Sprint 1: Foundation (~37h)
Run in parallel:
- **B**: WCAG audit (10.5h) — starts first, reveals issues
- **D**: Analytics (5.25h) — quick win
- **A**: Guest reviews (3.5h) — quick win
- **F**: Interactive map (8.25h) — high visibility
- **G**: About page (3.5h) — content
- **P**: EN blog posts (3.75h) — simple

### Sprint 2: Optimization (~26h)
- **C**: Image optimization (10.5h)
- **E**: Gallery lightbox (6h)
- **I**: Performance (9.5h)

### Sprint 3: Finalize (~17h)
- **H**: Email automation (10h)
- **J**: Cross-browser testing (7h)
