# CalmRio — Cross-Browser & Device Testing Plan

> **Status:** Manual testing required  
> **Estimated time:** ~7 hours  
> **Run after:** All Workstreams A-I complete  

## Setup

### Local Preview
```bash
cd website
npm install
npm run dev
# Opens at http://localhost:3000/Calm-Rio/
```

### Production Preview (after build)
```bash
npm run build
npx serve dist
# Or deploy to GitHub Pages and test live
```

---

## Test Matrix

### 1. Browsers (Desktop)

| Browser | Status | Notes |
|---------|--------|-------|
| **Chrome** latest | ⬜ | Primary dev browser |
| **Firefox** latest | ⬜ | Check layout, fonts |
| **Safari** latest | ⬜ | Check WebP/AVIF support, fonts |
| **Edge** latest | ⬜ | Chromium-based, quick check |

### 2. Browsers (Mobile)

| Browser | Device | Status | Notes |
|---------|--------|--------|-------|
| **Safari iOS** | iPhone 14/15/SE | ⬜ | Check sticky bar, touch targets |
| **Chrome Android** | Pixel / Samsung | ⬜ | Check dark mode, gallery swipe |
| **Safari iPad** | iPad (1024px) | ⬜ | Check responsive breakpoints |

### 3. Breakpoints

| Breakpoint | Device | Status |
|------------|--------|--------|
| 320px | iPhone SE | ⬜ |
| 375px | iPhone 14 | ⬜ |
| 414px | iPhone Plus | ⬜ |
| 768px | iPad | ⬜ |
| 1024px | iPad landscape | ⬜ |
| 1280px | Desktop | ⬜ |
| 1440px+ | Wide desktop | ⬜ |

---

## Page-by-Page Checklist

For each of the 30 HTML pages, check:

| # | Test | Pass Criteria |
|---|------|--------------|
| 1 | **Page loads** | No console errors, no 404s |
| 2 | **Responsive design** | No horizontal scroll, no overlapping elements at any breakpoint |
| 3 | **Images** | All images visible, no broken src, <picture> elements render correctly |
| 4 | **Dark mode** | Toggle works, all text readable, contrast passes |
| 5 | **Navigation** | Menu opens/closes, links navigate correctly |
| 6 | **Keyboard nav** | Tab through all interactive elements, focus visible |
| 7 | **Screen reader** | VoiceOver/NVDA: landmarks, headings, alt text, form labels |
| 8 | **Touch targets** | All buttons/links ≥ 44×44px on mobile |
| 9 | **Forms** | Submit, validation errors display, feedback visible |
| 10 | **Performance** | Load < 3s on 4G, no layout shift |

---

## Priority Pages

Focus testing effort on these high-traffic pages:

1. **Homepage** (`index.html` FR + EN) — hero slider, testimonials, cards, newsletter form
2. **Property pages** (3 properties × 2 languages = 6 pages) — gallery, lightbox, booking form, calendar, map
3. **Contact page** (FR + EN) — form, map, contact info
4. **Local Guide** (FR + EN) — map with pins, filter buttons, guide cards
5. **FAQ** (FR + EN) — accordion, search

---

## Known Issues to Verify

| Issue | Expected Fix | Verify |
|-------|-------------|--------|
| Sticky booking bar overlap | Should not obscure content at 320px | Check bottom of property pages |
| Gallery lightbox on iOS | Swipe works, close with Escape on keyboard | Test on real iPhone |
| Hero slider autoplay | Pauses on focus/keyboard interaction | Tab into slider, verify pause |
| Dark mode toggle | Persists across page navigation | Navigate to 3+ pages in dark mode |
| Map pins | All 3 properties + 6 POIs visible | Check local-guide + contact pages |

---

## Bug Report Template

When you find an issue, document it:

```markdown
### [BUG] Short Description

**Page:** e.g., `en/royan-appartement.html`
**Browser/OS:** Chrome 120 / macOS 14
**Viewport:** 375px (iPhone 14)
**Severity:** High / Medium / Low

**Steps to reproduce:**
1. Go to page
2. Click on X
3. Observe Y

**Expected:** Should do Z
**Actual:** Does Y instead

**Screenshot:** [link]
```

---

## Pass Criteria

The site passes testing when:

- [ ] All 30 pages load without console errors
- [ ] All interactive elements are keyboard-accessible
- [ ] All images render at all breakpoints
- [ ] Dark mode works on all pages
- [ ] Forms submit (or show validation) correctly
- [ ] Gallery lightbox works on mobile (swipe + pinch)
- [ ] Maps render with all pins visible
- [ ] No horizontal scroll at any breakpoint
- [ ] Lighthouse score ≥ 80 on all 4 categories
- [ ] No WCAG violations (axe scan passes)
