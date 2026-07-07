# CalmRio — Premium Vacation Rentals

A production-quality static website for **CalmRio**, a premium vacation rental portfolio on the Atlantic coast of France (Royan & Île d'Oléron).

## Properties

| Property | Location | Host | Type |
|----------|----------|------|------|
| Appartement neuf — 100m de la Grande Conche | Royan | Mélanie | 2BR Apartment (4 pers) |
| Villa neuve — Jardin clos & terrasses | Saint-Trojan-les-Bains | Agnès | 3BR Villa (6 pers) |
| Maison familiale — Jardin & plage à vélo | Saint-Trojan-les-Bains | Agnès | 3BR House (6 pers) |

## Tech Stack

- **HTML5** — Semantic, accessible, SEO-optimized
- **SCSS** — Modular architecture (7-1 pattern), compiled to CSS
- **Vanilla JavaScript ES6+** — Modular, framework-free components

## Architecture

```
website/
├── assets/
│   ├── css/            # Compiled CSS
│   ├── scss/            # SCSS source files
│   │   ├── abstracts/   # Variables, mixins, functions
│   │   ├── base/        # Reset, typography, base styles
│   │   ├── layout/      # Grid, container, header, footer
│   │   ├── components/  # Buttons, cards, forms, hero, etc.
│   │   ├── pages/       # Page-specific styles
│   │   ├── themes/      # Dark mode support
│   │   └── utilities/   # Helper classes
│   ├── js/              # JavaScript modules
│   │   ├── modules/     # Navigation, animations, accordion, etc.
│   │   ├── components/  # Modals, forms, testimonials, gallery
│   │   └── utils/       # Helper functions
│   ├── fonts/           # Web fonts
│   ├── icons/           # SVG icons
│   └── images/          # Images
├── src/                 # Source templates
├── docs/                # Design system documentation
├── favicon/             # Favicon assets
├── index.html           # Homepage
├── about.html           # À propos
├── contact.html         # Contact
├── faq.html             # FAQ
├── local-guide.html     # Guide local
├── royan-appartement.html
├── saint-trojan-villa.html
├── saint-trojan-maison.html
├── 404.html             # Page non trouvée
├── robots.txt
├── sitemap.xml
└── README.md
```

## Development

### Prerequisites
- Node.js + npm (for SCSS compilation)

### Compile SCSS
```bash
npm install -g sass
sass assets/scss/main.scss assets/css/style.css --style compressed
```

### Watch for changes
```bash
sass --watch assets/scss/main.scss:assets/css/style.css
```

## Design System

See [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) for full design tokens and component documentation.

## WordPress Migration

The site architecture is prepared for WordPress conversion:
- Semantic HTML5 maps to WordPress template hierarchy
- Header/footer patterns separate concerns
- Component-based sections map to template parts
- CSS/JS architecture follows WordPress enqueue pattern

## Performance Targets

- Lighthouse Performance: 95+
- Lighthouse Accessibility: 100
- Lighthouse Best Practices: 100
- Lighthouse SEO: 100

## License

All rights reserved. © 2026 CalmRio
