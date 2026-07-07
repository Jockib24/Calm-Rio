# CalmRio Design System

## Brand
CalmRio — Premium vacation rentals on the Atlantic coast of France

## Color Palette
```
--color-primary: #1A2B3C        (Deep navy)
--color-primary-light: #2C4055
--color-primary-dark: #0F1A26
--color-secondary: #C9A96E      (Warm gold/sand)
--color-secondary-light: #DFC99A
--color-secondary-dark: #A88B4F
--color-accent: #3A7CA5         (Ocean blue)
--color-accent-light: #5A9FC9
--color-accent-dark: #2A5C7A

--color-bg: #FAF8F5             (Warm off-white)
--color-bg-alt: #F3EFEA         (Slightly darker warm)
--color-surface: #FFFFFF
--color-surface-alt: #F8F6F3
--color-border: #E8E2DA
--color-border-light: #F0EBE4

--color-text: #1A2B3C
--color-text-secondary: #5A6B7C
--color-text-muted: #8A9BA8
--color-text-inverse: #FFFFFF

--color-success: #4A9E6E
--color-warning: #D4A853
--color-error: #C45858
--color-info: #3A7CA5
```

## Typography
```css
--font-heading: 'Playfair Display', Georgia, serif
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif

Headings:
h1: clamp(2.5rem, 5vw, 4rem) / 1.1 / --font-heading / 700
h2: clamp(2rem, 4vw, 3rem) / 1.15 / --font-heading / 700
h3: clamp(1.5rem, 3vw, 2rem) / 1.2 / --font-heading / 600
h4: clamp(1.25rem, 2vw, 1.5rem) / 1.25 / --font-heading / 600
h5: 1.125rem / 1.3 / --font-body / 600
h6: 1rem / 1.4 / --font-body / 600

Body:
p: 1.0625rem / 1.7 / --font-body / 400
small: 0.875rem / 1.6 / --font-body / 400
```

## Spacing (8px grid)
```
--space-1: 0.25rem   (4px)
--space-2: 0.5rem    (8px)
--space-3: 0.75rem   (12px)
--space-4: 1rem      (16px)
--space-5: 1.5rem    (24px)
--space-6: 2rem      (32px)
--space-7: 2.5rem    (40px)
--space-8: 3rem      (48px)
--space-9: 4rem      (64px)
--space-10: 5rem     (80px)
--space-11: 6rem     (96px)
--space-12: 8rem     (128px)
```

## Border Radius
```
--radius-sm: 4px
--radius-md: 8px
--radius-lg: 12px
--radius-xl: 16px
--radius-full: 9999px
```

## Shadows
```
--shadow-sm: 0 1px 3px rgba(26, 43, 60, 0.06), 0 1px 2px rgba(26, 43, 60, 0.04)
--shadow-md: 0 4px 6px rgba(26, 43, 60, 0.06), 0 2px 4px rgba(26, 43, 60, 0.04)
--shadow-lg: 0 10px 25px rgba(26, 43, 60, 0.08), 0 4px 10px rgba(26, 43, 60, 0.04)
--shadow-xl: 0 20px 40px rgba(26, 43, 60, 0.1), 0 8px 20px rgba(26, 43, 60, 0.06)
--shadow-focus: 0 0 0 3px rgba(58, 124, 165, 0.3)
```

## Transitions
```
--transition-fast: 150ms ease
--transition-base: 250ms ease
--transition-slow: 400ms ease
--transition-spring: 500ms cubic-bezier(0.34, 1.56, 0.64, 1)
```

## Container
```
--container-sm: 640px
--container-md: 768px
--container-lg: 1024px
--container-xl: 1200px
--container-2xl: 1400px
--container-padding: clamp(1rem, 4vw, 2rem)
```

## Z-Index
```
--z-below: -1
--z-base: 0
--z-dropdown: 100
--z-sticky: 200
--z-overlay: 300
--z-modal: 400
--z-toast: 500
```

## Grid
12-column grid system.
Column gap: --space-6 (2rem)
Row gap: --space-6 (2rem)

## Breakpoints
```
--bp-sm: 640px
--bp-md: 768px
--bp-lg: 1024px
--bp-xl: 1200px
--bp-2xl: 1400px
```

## Buttons
- Primary: --color-primary bg, white text, hover darkens
- Secondary: transparent with border, --color-primary text
- Accent: --color-accent bg, white text
- Ghost: transparent, --color-text on hover

## Forms
- Input height: 3rem (48px)
- Border: 1px solid --color-border
- Focus: --shadow-focus
- Label: --font-body, 0.875rem, 600 weight

## Cards
- bg: --color-surface
- border-radius: --radius-lg
- shadow: --shadow-sm
- padding: --space-6
- hover: translateY(-2px), shadow-md

## Navigation
- Height: 4.5rem (72px)
- Sticky on scroll
- Transparent -> white bg on scroll
- Mobile: hamburger -> full-screen overlay menu

## Section Spacing
- Section padding: clamp(3rem, 8vw, 6rem) 0
- Container max-width: --container-xl
