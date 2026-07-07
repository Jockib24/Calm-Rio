# CalmRio — UI/UX Optimization Plan

> **Version:** 1.0  
> **Date:** July 2026  
> **Status:** Draft for review  
> **Scope:** Comprehensive design, user experience, and conversion optimization for the CalmRio vacation rental website (3 properties, Atlantic coast, France)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Assessment](#2-current-state-assessment)
3. [Competitive Landscape](#3-competitive-landscape)
4. [Brand & Design Direction](#4-brand--design-direction)
5. [UX Improvements by Page](#5-ux-improvements-by-page)
6. [Booking Flow Optimization](#6-booking-flow-optimization)
7. [Mobile Experience](#7-mobile-experience)
8. [Accessibility (WCAG 2.2 AA)](#8-accessibility-wcag-22-aa)
9. [Performance Budget](#9-performance-budget)
10. [Hospitality-Specific Features](#10-hospitality-specific-features)
11. [Conversion Rate Optimization](#11-conversion-rate-optimization)
12. [Implementation Roadmap](#12-implementation-roadmap)
13. [Measurement & KPIs](#13-measurement--kpis)

---

## 1. Executive Summary

### Business Context

CalmRio is a **premium vacation rental portfolio** of 3 properties on the Atlantic coast of France (Royan & Île d'Oléron). The target guest is a design-conscious traveler seeking authentic coastal experiences — couples, families, and groups who value quality over quantity.

The site is currently a **static HTML/SCSS/vanilla JS site** designed for eventual WordPress migration. It has strong bones: clean typography, a cohesive color palette, structured content, and technical fundamentals (iCal, SEO metadata, responsive layout).

### Core Opportunity

The site needs to shift from **"it works" to "it converts"**. The primary gap is not design quality but **conversion psychology, mobile UX depth, and trust architecture**. With only 3 properties, every percentage point of conversion matters enormously.

### Target Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Page load (mobile) | ~3-4s | <2s |
| Booking flow steps | 5+ clicks | 3 clicks max |
| Mobile bounce rate | Unknown | <40% |
| Direct booking conversion | Unknown | **2.0%–3.0%** |
| Accessibility score | Partial | WCAG 2.2 AA |
| Lighthouse Performance | Unknown | 90+ |
| Lighthouse Accessibility | Unknown | 95+ |

---

## 2. Current State Assessment

### What's Working ✅

| Aspect | Detail |
|--------|--------|
| Design system | Cohesive palette (ocean navy, sand gold), consistent typography, 8px grid |
| Content architecture | Clear page hierarchy, semantic HTML, WordPress-ready structure |
| iCal system | RFC 5545 parser, interactive availability calendar, booking integration |
| SEO foundation | robots.txt, sitemap.xml, schema.org JSON-LD, hreflang tags |
| Accessibility basics | Skip links, semantic landmarks, focus styles exist |
| Real photography | Actual Airbnb photos used throughout |
| Technical quality | Zero console errors, valid HTML, compiled SCSS |

### What Needs Improvement 🔧

| Area | Issue | Severity |
|------|-------|----------|
| **Mobile UX** | No sticky booking CTA on mobile; calendar picker not mobile-optimized | 🔴 High |
| **Booking flow** | Form is static (no validation, no real-time availability, no payment) | 🔴 High |
| **Trust signals** | No guest reviews visible on site; no transparent pricing breakdown | 🔴 High |
| **Homepage hierarchy** | Hero is clean but lacks clear CTA direction for first-time visitors | 🟡 Medium |
| **Image loading** | No WebP, no responsive images, no lazy loading beyond basic | 🟡 Medium |
| **Content depth** | Property descriptions functional but not aspirational/story-driven | 🟡 Medium |
| **Cross-sell** | Cross-sell exists as text links only; no visual property cards | 🟡 Medium |
| **Accessibility** | Color contrast borderline in places; no ARIA labels on custom widgets | 🟡 Medium |
| **Local guide** | Map area has placeholder — no interactive map with property pins | 🟢 Low |
| **Newsletter/retention** | No email capture anywhere on site | 🟢 Low |

---

## 3. Competitive Landscape

### Competitive Positioning

```
                    MASS-MARKET                    PREMIUM
                        │                            │
                        │                            │
   Airbnb ─── Booking.com ─── Plum Guide ─── Boutique Homes ─── CALMRIO
       │                        │                        │
       │                        │                        │
   Transactional           Curatorial               Personal
   Inventory-first         Expert-curated           Owner-hosted
```

**CalmRio's competitive advantage:** Personal service + authentic local knowledge + curated portfolio quality. This is the **"boutique B&B owner"** experience — something neither Airbnb nor Plum Guide can fully replicate.

### UX Lessons from Competitors

| Site | What CalmRio Should Borrow |
|------|---------------------------|
| **Boutique Homes** | Editorial storytelling; handpicked curation language; press validation |
| **Mr & Mrs Smith** | Trustpilot integration; "speak to a specialist" personal touch |
| **Plum Guide** | Quality-first messaging; visual hierarchy with availability upfront |
| **Airbnb** | Bottom nav on mobile; conversational booking flow; saved/wishlist |

---

## 4. Brand & Design Direction

### Visual Identity Evolution

The current design is clean but **under-leverages the coastal brand opportunity.**

**Proposed refinement:**
- **Color:** Deepen the palette — richer navy (`#0F2A44`), warmer sand (`#D4A96A`), add a deep teal accent (`#1A6B6B`) for CTAs
- **Imagery:** More lifestyle/editorial photography — guests on the terrace with wine, bikes by the beach, morning coffee overlooking the sea
- **Typography:** Maintain Playfair Display + Inter, but increase heading sizes on hero sections for greater emotional impact
- **Spacing:** Add more breathing room on property pages — whitespace signals luxury

### Brand Voice Refinement

| Current | Proposed |
|---------|---------|
| Functional descriptions ("2 chambres, 4 personnes") | Story-driven ("Réveillez-vous au chant des vagues") |
| Neutral tone | Warm + personal ("Chez nous, l'Atlantique est à votre porte") |
| Property-focused | Experience-focused ("Ce n'est pas juste une villa, c'est votre base pour explorer Oléron") |

### Mood Board Direction

```
──── COASTAL ELEGANCE ────

Texture: Linen, raw wood, sea glass, woven baskets
Light: Golden hour, soft diffused morning light, candlelight evenings
Palette: Navy #0F2A44 | Sand #D4A96A | Teal #1A6B6B | Cloud #F5F0EB | Foam #E8F0F0
Tone: Warm, personal, unhurried — the opposite of transactional
```

---

## 5. UX Improvements by Page

### 5.1 Homepage (`index.html`)

| # | Issue | Fix | Effort | Impact |
|---|-------|-----|--------|--------|
| 1 | Hero has no primary CTA | Add prominent "Voir nos propriétés" button + "Disponibilités" secondary link | Low | 🔴 High |
| 2 | No trust signals above fold | Add rating badge (★4.95), "Guest Favorite" label, number of reviews | Low | 🔴 High |
| 3 | Property cards lack urgency/availability | Show live availability status on each card ("Disponible en août" / "Quelques dates disponibles") | Medium | 🟡 Medium |
| 4 | No social proof section | Add testimonial strip after properties section (3 rotating guest quotes) | Low | 🔴 High |
| 5 | No email capture | Add newsletter CTA in footer or as a light section before footer | Low | 🟡 Medium |
| 6 | Hero image not full-bleed on large screens | Extend hero to viewport height with parallax or overlay | Medium | 🟡 Medium |
| 7 | Missing "Why Book Direct" value prop | Add 3-card section: "Meilleur prix garanti" / "Service personnalisé" / "Paiement sécurisé" | Low | 🟡 Medium |

**Desktop hero redesign concept:**
```
┌─────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────┐   │
│  │                                               │   │
│  │         [Logo]     Nav: Propriétés | Guide    │   │
│  │                      | À propos | Contact     │   │
│  │                                               │   │
│  │                                               │   │
│  │    Échappées belles sur la côte atlantique     │   │
│  │    Locations premium — Royan & Île d'Oléron    │   │
│  │                                               │   │
│  │    ┌─────────────────────┐  ┌──────────────┐  │   │
│  │    │  Voir nos propriétés│  │  ★ 4,95 • 40 │  │   │
│  │    └─────────────────────┘  │   avis       │  │   │
│  │                             └──────────────┘  │   │
│  │                                               │   │
│  └──────────────────────────────────────────────┘   │
│       [Photo hero plein écran - coucher de soleil]   │
└─────────────────────────────────────────────────────┘
```

### 5.2 Property Detail Pages

| # | Issue | Fix | Effort | Impact |
|---|-------|-----|--------|--------|
| 1 | No sticky booking bar | Add fixed-bottom bar on mobile showing price + "Vérifier disponibilités" | Medium | 🔴 High |
| 2 | Booking widget too far down (inside sidebar) | Move key info higher; add floating sticky sidebar on desktop | Medium | 🔴 High |
| 3 | Amenities as text list | Convert to visual icon grid with categories | Low | 🟡 Medium |
| 4 | No guest reviews visible | Import/embed Airbnb reviews; add testimonial carousel | Medium | 🔴 High |
| 5 | Cross-sell is text-only | Replace with visual property cards with photos + quick stats | Low | 🟡 Medium |
| 6 | No similar properties recommendation | Add "Vous aimerez aussi" section with remaining 2 properties | Low | 🟡 Medium |
| 7 | Missing seasonal pricing hints | Add rate range indicator ("À partir de 120€/nuit en basse saison") | Low | 🟡 Medium |
| 8 | Cancellation policy hidden in terms | Display prominently as a badge near booking CTA | Low | 🟡 Medium |
| 9 | Gallery lacks lightbox | Add fullscreen lightbox with swipe gesture support | Medium | 🟡 Medium |
| 10 | No video walkthrough placeholder | Add space for future 60s video hero | Low | 🟢 Low |

**Desktop property page layout (re-ordered):**

```
┌─────────────────────────────────────────────────────────────┐
│  [Full-bleed image gallery: hero + thumbnails]              │
│  ★ 4,95 • Guest Favorite • Saint-Trojan-les-Bains          │
├──────────────────────────────────┬──────────────────────────┤
│                                  │                          │
│  Villa neuve 6 pers              │  ┌────────────────────┐ │
│  Jardin clos & terrasses         │  │ À partir de 180€   │ │
│                                  │  │  / nuit            │ │
│  • 3 chambres • 6 pers           │  │                    │ │
│  • Jardin clos • 2 terrasses     │  │  Arrivée  [   ]   │ │
│  • Plage à 15 min à vélo         │  │  Départ   [   ]   │ │
│                                  │  │  Voyageurs [  ]   │ │
│  ★★★★★ "Un séjour idyllique"     │  │                    │ │
│  — Famille Dubois, juillet 2026  │  │  ┌──────────────┐ │ │
│                                  │  │  │ Voir les dispo│ │ │
│  [Description narrative]         │  │  └──────────────┘ │ │
│                                  │  │                    │ │
│  [Amenities icon grid]           │  │  ✔ Annulation      │ │
│                                  │  │    flexible        │ │
│  [Location / Carte interactive]  │  │  ✔ Paiement        │ │
│                                  │  │    sécurisé        │ │
│  [Guest Reviews section]         │  └────────────────────┘ │
│                                  │                          │
│  [Vous aimerez aussi → cross-sell]│                         │
│                                  │                          │
└──────────────────────────────────┴──────────────────────────┘
```

### 5.3 About Page

| # | Issue | Fix | Effort | Impact |
|---|-------|-----|--------|--------|
| 1 | No personal photos | Add photos of the owner/hosts with the properties | Low | 🔴 High |
| 2 | No personal story | Write a warm, authentic "notre histoire" narrative | Low | 🟡 Medium |
| 3 | Missing press mentions | Add press/awards/logos section if applicable | Low | 🟡 Medium |
| 4 | No team/contact info | Add direct phone number, response time promise | Low | 🟡 Medium |

### 5.4 Contact Page

| # | Issue | Fix | Effort | Impact |
|---|-------|-----|--------|--------|
| 1 | Form is generic | Add property interest selector ("Je suis intéressé par...") | Low | 🟡 Medium |
| 2 | No live chat or instant reply | Add "Réponse sous 2h" promise near the form | Low | 🟡 Medium |
| 3 | Missing social links | Add Instagram link (visual platform for properties) | Low | 🟢 Low |

### 5.5 Local Guide

| # | Issue | Fix | Effort | Impact |
|---|-------|-----|--------|--------|
| 1 | Map placeholder empty | Embed interactive map with property pins + key POIs | Medium | 🟡 Medium |
| 2 | No property proximity info | Add distance badges ("À 5 min à vélo de la plage") | Low | 🟡 Medium |
| 3 | No downloadable guide | Offer printable PDF version of the guide | Low | 🟢 Low |

### 5.6 FAQ Page

| # | Issue | Fix | Effort | Impact |
|---|-------|-----|--------|--------|
| 1 | No search/filter | Add simple keyword search for FAQ items | Medium | 🟢 Low |
| 2 | No "still have questions" CTA | Add contact prompt at bottom of FAQs | Low | 🟡 Medium |

### 5.7 404 Page

| # | Issue | Fix | Effort | Impact |
|---|-------|-----|--------|--------|
| 1 | Generic 404 | Add helpful suggestions, search, or property cards | Low | 🟢 Low |

---

## 6. Booking Flow Optimization

### Current Flow (Too Many Steps)

```
Homepage → Property Page → Scroll to booking widget → Fill dates → 
Submit → (no feedback) → ??? → Contact form
```

### Proposed Flow (3 Clicks to Confirm)

```
Homepage → Property Page 
            ↓
   [Sticky booking bar visible everywhere]
            ↓
   Click "Voir disponibilités"
            ↓
   Step 1: Select dates (calendar with availability)
   Step 2: Select guests + see total price (incl. all fees)
   Step 3: Enter guest info (name, email, phone)
            ↓
   Confirm → Confirmation page + email
```

### Booking Widget Redesign

**Critical requirements:**
1. **Real-time availability** — Gray out booked dates on calendar (iCal integration exists)
2. **All-in pricing** — Show total (nuitées + ménage + taxes) before guest info
3. **Guest checkout** — No account creation required
4. **Payment** — Stripe integration with Apple Pay / Google Pay
5. **Confirmation** — Instant email + page confirmation
6. **Sticky bar** — Persistent on mobile (bottom), persistent on desktop (sidebar)
7. **Abandoned booking recovery** — Email follow-up within 2 hours

### Booking Widget States

| State | Design | Copy |
|-------|--------|------|
| **Empty** | Calendar with available dates highlighted in teal, booked in gray | "Sélectionnez vos dates" |
| **Dates selected** | Price breakdown appears (nuitées × taux + ménage + taxes = total) | "Total: 840€ pour 4 nuits" |
| **Not available** | Dates grayed out, tooltip on hover | "Non disponible" |
| **Loading** | Skeleton pulse on price area | "Vérification des disponibilités..." |
| **Error** | Red border on affected field + message | "Ces dates ne sont plus disponibles. Essayez du [date] au [date]." |
| **Success** | Green confirmation + booking reference | "Réservation confirmée ! Un email vous a été envoyé." |

### Form Field Optimization

| Current | Proposed | Reason |
|---------|----------|--------|
| 8+ fields in raw form | 3 steps, visible progress | Reduces abandonment |
| No inline validation | Validate on blur with helpful messages | Prevents errors |
| No date picker UX | Custom calendar with availability overlay | Visual clarity |
| No autofill support | `autocomplete` attributes on all fields | Faster completion |
| No mobile keyboard handling | `inputmode` + `type` optimization | Better mobile UX |

---

## 7. Mobile Experience

### Mobile Priority Fixes (in order)

| # | Fix | Rationale |
|---|-----|-----------|
| 1 | **Sticky bottom booking bar** | 70%+ of traffic will be mobile; booking must be 1 tap away |
| 2 | **Full-width gesture gallery** | Swipeable images are expected; current static gallery is desktop-only feel |
| 3 | **Collapsible all sections** | Property pages are long; accordion for amenities, policies retains readability |
| 4 | **Thumb-friendly CTA (min 44×44px)** | Current "Voir la propriété" buttons are small targets |
| 5 | **Tap-to-call phone** | Clickable phone number for instant concierge feel |
| 6 | **Native date inputs** | Use `<input type="date">` on mobile with min/max attributes |
| 7 | **Reduced motion** | Respect `prefers-reduced-motion` for scroll animations |
| 8 | **Bottom navigation** | Consider tab bar for key sections on mobile |

### Mobile Layout Specification

```
┌──────────────────────────────┐
│  ≡  [Logo CalmRio]    ☎      │  ← Sticky header (compact on scroll)
├──────────────────────────────┤
│                              │
│  [Full-width hero image]     │
│  Villa Saint-Trojan          │
│  ★ 4,95 • jusqu'à 6 pers    │
│                              │
│  ┌────────────────────────┐  │
│  │  ▶ Voir les photos (23)│  │
│  └────────────────────────┘  │
│                              │
│  [Description]               │
│                              │
│  [Équipements — icon grid]   │
│                              │
│  [Avis voyageurs]            │
│                              │
│  [Carte & environs]          │
│                              │
│  [FAQ spécifique au bien]    │
│                              │
├──────────────────────────────┤
│  180€/nuit  │ Voir dispo ▶  │  ← Sticky bottom bar (always visible)
└──────────────────────────────┘
```

---

## 8. Accessibility (WCAG 2.2 AA)

### Current Compliance Status

| Success Criterion | Status | Action Needed |
|------------------|--------|---------------|
| 1.4.3 Color Contrast (min 4.5:1) | ⚠️ Partial | Check teal CTAs on dark backgrounds; ensure sand text on light bg passes |
| 1.4.4 Resize Text (200%) | ✅ Pass | Already uses relative units |
| 1.4.10 Reflow (320px) | ✅ Pass | Responsive layout works |
| 2.1.1 Keyboard | ⚠️ Partial | Custom calendar needs full keyboard nav |
| 2.4.4 Link Purpose | ⚠️ Partial | Some CTAs say "Voir" without specifying what |
| 2.4.7 Focus Visible | ✅ Pass | Focus styles exist on most elements |
| 2.4.11 Focus Not Obscured | ⚠️ Partial | Sticky header may hide focus on some pages |
| 2.5.3 Label in Name | ⚠️ Partial | Ensure ARIA labels match visible text |
| 3.2.2 On Input | ✅ Pass | No auto-submit on form changes |
| 3.3.2 Labels | ⚠️ Partial | Booking form needs explicit `<label>` elements |
| 4.1.2 Name, Role, Value | ⚠️ Partial | Custom components (calendar, accordion) need ARIA |

### Required Fixes for EAA Compliance

The European Accessibility Act (effective June 28, 2025) requires WCAG 2.2 AA compliance for all EU-based commercial websites.

1. **Fix color contrast** on any element below 4.5:1 ratio
2. **Add ARIA labels** to all interactive custom components
3. **Ensure full keyboard navigation** on calendar, booking flow, accordion
4. **Add focus management** to modal/lightbox (trap focus, close with Escape)
5. **Fix heading hierarchy** — ensure no skipped levels on any page
6. **Add descriptive alt text** to all property images
7. **Ensure form error identification** — errors must be programmatically associated

### Accessibility Testing Checklist

```
[ ] Run axe DevTools on all 8 pages
[ ] Run WAVE evaluation on all 8 pages
[ ] Manual keyboard navigation test (Tab through entire site)
[ ] Screen reader test (VoiceOver on Mac, TalkBack on Android)
[ ] Color contrast audit using WebAIM contrast checker
[ ] 200% zoom test on each page
[ ] Reduced motion test (enable in OS settings)
[ ] Touch target audit (all interactive elements ≥ 44×44px)
```

---

## 9. Performance Budget

### Current vs Target

| Metric | Current | Target | Critical? |
|--------|---------|--------|-----------|
| First Contentful Paint (FCP) | ~2.5s | <1.5s | 🔴 |
| Largest Contentful Paint (LCP) | ~3-4s | <2.0s | 🔴 |
| Time to Interactive (TTI) | ~3s | <2.5s | 🟡 |
| Cumulative Layout Shift (CLS) | ~0.15 | <0.1 | 🟡 |
| Total Page Weight | ~2-3MB (images) | <1.5MB | 🔴 |
| Number of Requests | ~25-35 | <20 | 🟡 |

### Optimizations Needed

| # | Optimization | Expected Impact | Effort |
|---|-------------|-----------------|--------|
| 1 | **Convert images to WebP** with fallback JPEG | -40% image weight | Medium |
| 2 | **Implement responsive images** (`srcset`, `sizes`) | Appropriate resolution per device | Medium |
| 3 | **Add explicit width/height** to images | Eliminate CLS | Low |
| 4 | **Lazy load below-fold images** | Faster initial paint | Low |
| 5 | **Preload hero image** | Faster LCP | Low |
| 6 | **Inline critical CSS** | Eliminate render-blocking CSS | Medium |
| 7 | **Defer non-critical JS** | Faster TTI | Low |
| 8 | **Font-display: swap** on Google Fonts (already set) | Text visible during font load | — |
| 9 | **Preconnect to Google Fonts** (already done) | Faster font load | — |
| 10 | **Add proper caching headers** | Repeat visit speed | Low (server config) |
| 11 | **Consider CDN** (Cloudflare, etc.) | Global performance | Low (ops) |

---

## 10. Hospitality-Specific Features

### Must-Have

| Feature | Priority | Implementation Notes |
|---------|----------|---------------------|
| Real-time availability calendar | ✅ **Exists** | iCal parser + integration module ready |
| Booking engine (Stripe) | 🔴 **Add** | booking-integration.js needs Stripe Connect |
| Guest checkout (no signup) | 🔴 **Add** | booking flow update |
| Instant confirmation email | 🟡 **Add** | Email service (SendGrid, Mailjet, etc.) |
| Price breakdown | 🟡 **Add** | Show nightly rate + cleaning + taxes before guest info |
| Cancellation policy display | 🟡 **Add** | Badge near CTA, full text in booking flow |

### Nice-to-Have

| Feature | Priority | Why |
|---------|----------|-----|
| Abandoned booking recovery | 🟡 Medium | ~70% of bookings are abandoned — recovery emails can save 10-15% |
| Guest portal (booking management) | 🟢 Low | Differentiation; allows modification/cancellation without contacting owner |
| Seasonal rate calendar | 🟢 Low | Visual pricing grid for long-stay planning |
| Guest photo upload (post-stay) | 🟢 Low | UGC for social proof |
| Multi-property booking | 🟢 Low | Group bookings across both Saint-Trojan houses |

### WordPress Migration Readiness

Current site is already structured for WordPress migration (component-based HTML, semantic markup, separated concerns). Migration considerations:

```
Migration Readiness Checklist:
[✅] Semantic HTML (5.0)
[✅] Header/footer separation
[✅] Template-part ready structure
[✅] SEO metadata in head
[✅] Schema.org JSON-LD
[✅] Open Graph / Twitter Card tags
[✅] iCal system (convert to WP plugin)
[⚠️] Booking engine → convert to WP plugin + Stripe integration
[⚠️] Forms → convert to WP plugin (Contact Form 7, Gravity Forms, or custom)
[⚠️] Image gallery → native WP gallery or NextGEN
```

---

## 11. Conversion Rate Optimization

### CRO Strategy Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    CRO FLYWHEEL                                  │
│                                                                  │
│   TRAFFIC ──→ ENGAGEMENT ──→ CONSIDERATION ──→ BOOKING ──→ LOYALTY │
│      │              │               │            │           │    │
│      ▼              ▼               ▼            ▼           ▼    │
│   SEO        Sticky bar        Reviews     3-click      Email     │
│   Social     Gallery          Calendar    checkout    follow-up   │
│   Direct     Descriptions    Price       Confirmation  Guest      │
│              Amenities       breakdown                 portal    │
└─────────────────────────────────────────────────────────────────┘
```

### CRO Tactics by Funnel Stage

#### Top of Funnel (Awareness)
- SEO-optimized property pages for "location saint trojan oleron" and related keywords
- Google Vacation Rentals integration (free listings)
- Instagram → direct link to property pages
- Blog/content marketing (local guide as SEO asset)

#### Middle of Funnel (Consideration)
- Guest reviews with photos on every property page
- "Why Book Direct" value prop (best price, personal service, free cancellation)
- Availability calendar showing real-time open dates (scarcity without manipulation)
- Comparison table vs Airbnb for the same property

#### Bottom of Funnel (Decision)
- Sticky booking bar with price + urgency ("Seulement 2 semaines disponibles en août")
- Transparent all-in pricing (no surprise fees)
- Clear cancellation policy badge
- Secure payment logos (Stripe, Visa, Mastercard, Apple Pay)
- "Réponse sous 2h" promise for inquiries

#### Post-Booking (Loyalty)
- Confirmation email with local guide PDF
- Pre-arrival email (1 week before) with weather, activities, check-in details
- Post-stay email requesting review + offering discount for return booking
- Newsletter with seasonal updates and availability alerts

### A/B Test Ideas

| Test | Variant A (Current) | Variant B (Proposed) | What to Measure |
|------|--------------------|----------------------|-----------------|
| Hero CTA | "Voir nos propriétés" | "Vérifier disponibilités" | Click rate |
| Booking CTA color | Primary brand color | High-contrast teal | Click rate |
| Price display | "À partir de X€/nuit" | Total for selected dates | Engagement |
| Social proof placement | Bottom of page | Above fold | Scroll depth |
| Gallery layout | Grid | Full-bleed hero + thumbnails | Time on page |
| Navigation | Top bar | Top bar + sticky booking | Bounce rate |

---

## 12. Implementation Roadmap

### Phase 1: Quick Wins (Week 1)
*Low effort, high impact — do these first*

| # | Task | Effort | Impact |
|---|------|--------|--------|
| 1.1 | Add sticky booking bar (mobile + desktop) | 4h | 🔴 High |
| 1.2 | Add guest review section to property pages | 3h | 🔴 High |
| 1.3 | Add hero CTA on homepage | 1h | 🔴 High |
| 1.4 | Convert amenity lists to icon grids | 2h | 🟡 Medium |
| 1.5 | Add "Why Book Direct" section on homepage | 2h | 🟡 Medium |
| 1.6 | Fix color contrast issues (audit + adjust) | 2h | 🔴 High |
| 1.7 | Add responsive image attributes | 3h | 🟡 Medium |
| **Total Phase 1** | | **~17h** | |

### Phase 2: Core UX Improvements (Week 2)
*Medium effort, structural changes*

| # | Task | Effort | Impact |
|---|------|--------|--------|
| 2.1 | Booking engine integration (Stripe) | 16h | 🔴 High |
| 2.2 | Mobile gallery with swipe + lightbox | 6h | 🔴 High |
| 2.3 | ARIA labels + keyboard navigation for custom widgets | 4h | 🔴 High |
| 2.4 | Reorder property page layout (sidebar booking) | 4h | 🟡 Medium |
| 2.5 | Cross-sell visual cards on property pages | 2h | 🟡 Medium |
| 2.6 | About page personal story + photos | 2h | 🟡 Medium |
| 2.7 | Contact form with property selector | 2h | 🟡 Medium |
| **Total Phase 2** | | **~36h** | |

### Phase 3: Performance & Content (Week 3)

| # | Task | Effort | Impact |
|---|------|--------|--------|
| 3.1 | Image optimization (WebP, srcset, lazy load) | 8h | 🔴 High |
| 3.2 | Newsletter signup + abandoned booking recovery | 6h | 🟡 Medium |
| 3.3 | Interactive map on local guide | 4h | 🟡 Medium |
| 3.4 | Email templates (confirmation, pre-arrival, post-stay) | 6h | 🟡 Medium |
| 3.5 | Seasonal pricing visual grid | 4h | 🟢 Low |
| 3.6 | Responsive audit on 5+ real devices | 3h | 🟡 Medium |
| **Total Phase 3** | | **~31h** | |

### Phase 4: Polish & Launch (Week 4)

| # | Task | Effort | Impact |
|---|------|--------|--------|
| 4.1 | Full WCAG 2.2 AA audit + remediation | 8h | 🔴 High |
| 4.2 | Performance optimization (Lighthouse 90+) | 6h | 🟡 Medium |
| 4.3 | Cross-browser testing (Chrome, Safari, Firefox, Edge) | 4h | 🟡 Medium |
| 4.4 | Google Vacation Rentals setup | 4h | 🟡 Medium |
| 4.5 | Analytics setup (Plausible or GA4) | 2h | 🟡 Medium |
| 4.6 | Final QA + deployment | 4h | 🔴 High |
| **Total Phase 4** | | **~28h** | |

### Total Implementation Estimate

| Phase | Hours | Cost Estimate (at $50/h) |
|-------|-------|-------------------------|
| Phase 1: Quick Wins | 17h | $850 |
| Phase 2: Core UX | 36h | $1,800 |
| Phase 3: Performance | 31h | $1,550 |
| Phase 4: Polish | 28h | $1,400 |
| **Total** | **~112h** | **~$5,600** |

---

## 13. Measurement & KPIs

### Success Metrics Dashboard

| KPI | How to Measure | Current Baseline | 30-Day Target | 90-Day Target |
|-----|---------------|-----------------|---------------|----------------|
| **Page load time (mobile)** | Lighthouse | ~3-4s | <2.5s | <2.0s |
| **Bounce rate** | Analytics | Unknown (new site) | <50% | <40% |
| **Time on page (property)** | Analytics | Unknown | >2min | >3min |
| **Gallery interaction rate** | Analytics (event) | Unknown | >60% | >75% |
| **Booking widget clicks** | Analytics (event) | Unknown | >15% of visits | >20% |
| **Booking flow completion** | Analytics funnel | Unknown | >2.0% | >3.0% |
| **Direct booking conversion** | Analytics | Unknown | 1.0% | 2.0%+ |
| **Mobile conversion rate** | Analytics | Unknown | >1.5% | >2.5% |
| **Email signup rate** | Analytics | 0% | >2% of visits | >5% |
| **Accessibility score** | axe DevTools | Unknown (partial) | 90+ | 95+ |
| **Lighthouse Performance** | Lighthouse audit | Unknown | 85+ | 90+ |
| **Lighthouse Accessibility** | Lighthouse | Unknown | 90+ | 95+ |
| **SEO organic impressions** | Google Search Console | Unknown | Establish baseline | +20% MoM |

### Testing Protocol

```
Weekly:
[ ] Lighthouse audit (performance + accessibility + SEO)
[ ] Console error check
[ ] Booking flow test (complete a test booking)
[ ] Analytics data review

Monthly:
[ ] Full WCAG scan
[ ] Cross-browser visual check
[ ] Image optimization review
[ ] Content freshness review (pricing, availability, reviews)
[ ] A/B test results review

Quarterly:
[ ] Competitor UX review
[ ] Full conversion funnel analysis
[ ] Technology audit (security, dependency updates)
[ ] Content strategy review
```

---

## Appendix A: Quick-Reference Checklist

### 🔴 Must Do This Month
- [ ] Sticky booking bar (mobile + desktop)
- [ ] Guest reviews on property pages
- [ ] Booking engine with Stripe integration
- [ ] WCAG 2.2 AA full audit + fixes (legal requirement)
- [ ] WebP images + responsive srcset
- [ ] Analytics setup

### 🟡 Should Do This Quarter
- [ ] Newsletter signup + abandoned booking recovery
- [ ] Interactive map on local guide
- [ ] About page personal story
- [ ] Mobile gallery lightbox
- [ ] Cross-sell visual cards
- [ ] Email automation (confirmation, pre-arrival, post-stay)

### 🟢 Nice to Do This Year
- [ ] Video walkthrough per property
- [ ] Guest photo gallery (UGC)
- [ ] Multi-property booking
- [ ] Guest portal (modify/cancel bookings)
- [ ] Google Vacation Rentals integration
- [ ] Sustainability certification badges

---

*This plan is a living document. Review and update after each phase is complete, incorporating analytics data and user feedback.*
