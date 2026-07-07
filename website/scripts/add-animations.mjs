/**
 * Add scroll-reveal animation classes to all HTML files.
 * Run: node scripts/add-animations.mjs
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory() && entry !== 'node_modules' && entry !== 'dist' && entry !== '.git') {
      walk(full, files);
    } else if (entry.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

/**
 * Parse the filename to determine page type.
 */
function pageType(filepath) {
  const name = filepath.replace(ROOT + '/', '');
  if (name.match(/index\.html$/)) return 'home';
  if (name.match(/about\.html$/)) return 'about';
  if (name.match(/contact\.html$/)) return 'contact';
  if (name.match(/royan-appartement\.html$/)) return 'property';
  if (name.match(/saint-trojan-villa\.html$/)) return 'property';
  if (name.match(/saint-trojan-maison\.html$/)) return 'property';
  if (name.match(/local-guide\.html$/)) return 'guide';
  if (name.match(/faq\.html$/)) return 'faq';
  if (name.match(/mentions-legales\.html$/)) return 'legal';
  if (name.match(/politique-de-confidentialite\.html$/)) return 'legal';
  if (name.match(/\/blog\/index\.html$/)) return 'blog-index';
  if (name.match(/\/blog\/posts\//)) return 'blog-post';
  if (name.match(/404\.html$/)) return '404';
  return 'unknown';
}

/**
 * Add a CSS class to an HTML element's class attribute.
 * Handles: class="foo" → class="foo bar" (idempotent)
 */
function addClass(html, selector, newClass) {
  // Match: class="EXISTING" or class='EXISTING'
  const regex = new RegExp(
    `(<${selector}[^>]*?class=")([^"]*?)(")`,
    'g'
  );
  const result = html.replace(regex, (match, prefix, existing, suffix) => {
    // Check if class already exists
    const classes = existing.split(/\s+/);
    if (classes.includes(newClass)) return match; // already there
    return `${prefix}${existing} ${newClass}${suffix}`;
  });
  return result;
}

/**
 * Add class to element matching tag and class
 */
function addClassToTagWithClass(html, tag, existingClass, newClass) {
  const regex = new RegExp(
    `(<${tag}[^>]*?class=")([^"]*?)(")`,
    'g'
  );
  let replaced = false;
  const result = html.replace(regex, (match, prefix, existing, suffix) => {
    if (replaced) return match; // only replace first match
    const classes = existing.split(/\s+/);
    if (!classes.includes(existingClass)) return match;
    if (classes.includes(newClass)) return match;
    replaced = true;
    return `${prefix}${existing} ${newClass}${suffix}`;
  });
  return result;
}

/**
 * Replace nth occurrence of a section with specific class
 */
function addClassToNth(html, tag, existingClass, newClass, n) {
  let count = 0;
  const regex = new RegExp(
    `(<${tag}[^>]*?class=")([^"]*?)(")`,
    'g'
  );
  const result = html.replace(regex, (match, prefix, existing, suffix) => {
    const classes = existing.split(/\s+/);
    if (classes.includes(existingClass)) {
      count++;
      if (count === n && !classes.includes(newClass)) {
        return `${prefix}${existing} ${newClass}${suffix}`;
      }
    }
    return match;
  });
  return result;
}

/**
 * Add class to a section element that contains specific inner text
 */
function addClassToSectionContaining(html, tag, classPrefix, searchText, newClass) {
  // Match opening tag, then body until closing tag
  const regex = new RegExp(
    `(<${tag}[^>]*?class=")([^"]*${classPrefix}[^"]*)(")([\\s\\S]*?)(<\\/${tag}>)`,
    'g'
  );
  const result = html.replace(regex, (match, prefix, existing, suffix, body, closing) => {
    if (body.includes(searchText)) {
      const classes = existing.split(/\s+/);
      if (!classes.includes(newClass)) {
        return `${prefix}${existing} ${newClass}${suffix}${body}${closing}`;
      }
    }
    return match;
  });
  return result;
}

/**
 * Add class to a div that contains specific inner text
 */
function addClassToDivContaining(html, existingClass, searchText, newClass) {
  // Find <div class="EXISTING"> that contains searchText
  const regex = /(<div[^>]*?class=")([^"]*?)(")([\s\S]*?)(<\/div>)/g;
  const result = html.replace(regex, (match, prefix, existing, suffix, body, closing) => {
    const classes = existing.split(/\s+/);
    if (classes.includes(existingClass) && body.includes(searchText)) {
      if (!classes.includes(newClass)) {
        return `${prefix}${existing} ${newClass}${suffix}${body}${closing}`;
      }
    }
    return match;
  });
  return result;
}

function processFile(filepath) {
  const type = pageType(filepath);
  let html = readFileSync(filepath, 'utf8');
  let changes = 0;

  const original = html;

  // ================================================================
  // COMMON to ALL pages: footer + section elements
  // ================================================================
  
  // Footer
  html = addClassToTagWithClass(html, 'footer', 'site-footer', 'fade-in');

  // section.section elements (add fade-in to main content sections)
  // section.section--alt elements
  html = addClassToTagWithClass(html, 'section', 'section--alt', 'fade-in');

  // cta-section
  html = addClassToTagWithClass(html, 'section', 'cta-section', 'fade-in');

  // ================================================================
  // PAGE-SPECIFIC
  // ================================================================

  if (type === 'home') {
    // stats-banner
    html = addClassToTagWithClass(html, 'section', 'stats-banner', 'fade-in');
    // properties-preview section
    html = addClassToTagWithClass(html, 'section', 'properties-preview', 'fade-in');
    // properties-grid → stagger-children
    html = addClassToTagWithClass(html, 'div', 'properties-grid', 'stagger-children');
    // why-book-direct
    html = addClassToTagWithClass(html, 'section', 'why-book-direct', 'fade-in');
    // promise-section
    html = addClassToTagWithClass(html, 'section', 'promise-section', 'fade-in');
    // testimonials-slider → stagger-children
    html = addClassToTagWithClass(html, 'div', 'testimonials-slider', 'stagger-children');
    // newsletter-section has class `section newsletter-section` - handled by section.section check
    html = addClassToTagWithClass(html, 'section', 'newsletter-section', 'fade-in');
    // trust-badges-row
    html = addClassToTagWithClass(html, 'section', 'trust-badges-row', 'fade-in');
    // category-grid
    html = addClassToTagWithClass(html, 'section', 'category-grid', 'fade-in');
    // experience section (first section.section with experience-heading)
    html = addClassToSectionContaining(html, 'section', 'section', 'experience-heading', 'fade-in');
    // local guide preview section
    html = addClassToSectionContaining(html, 'section', 'section--alt', 'guide-heading', 'fade-in');
  }

  if (type === 'property') {
    // property-intro
    html = addClassToTagWithClass(html, 'section', 'property-intro', 'fade-in');
    // tabs
    html = addClassToTagWithClass(html, 'div', 'tabs__nav', 'fade-in');
    // property-highlights → stagger-children
    html = addClassToTagWithClass(html, 'section', 'property-highlights', 'stagger-children');
    // booking-widget → fade-in-right
    html = addClassToTagWithClass(html, 'div', 'booking-widget', 'fade-in-right');
    // property-reviews → fade-in
    html = addClassToTagWithClass(html, 'section', 'property-reviews', 'fade-in');
    // review-cards → stagger-children
    html = addClassToTagWithClass(html, 'div', 'review-cards', 'stagger-children');
    // cross-sell → fade-in
    html = addClassToTagWithClass(html, 'div', 'cross-sell', 'fade-in');
    // cross-sell__grid → stagger-children
    html = addClassToTagWithClass(html, 'div', 'cross-sell__grid', 'stagger-children');
    // property-map → fade-in
    html = addClassToTagWithClass(html, 'div', 'property-map', 'fade-in');
    // FAQ section on property pages (section.bg-alt)
    html = addClassToSectionContaining(html, 'section', 'bg-alt', 'faq-title', 'fade-in');
  }

  if (type === 'guide') {
    // guide-property-filter
    html = addClassToTagWithClass(html, 'div', 'guide-property-filter', 'fade-in');
    // guide-categories section
    html = addClassToTagWithClass(html, 'section', 'guide-categories', 'fade-in');
    // guide-grid → stagger-children
    html = addClassToTagWithClass(html, 'div', 'guide-grid', 'stagger-children');
    // guide-map → fade-in
    html = addClassToTagWithClass(html, 'div', 'guide-map', 'fade-in');
    // guide-seasonal section
    html = addClassToTagWithClass(html, 'section', 'guide-seasonal', 'fade-in');
    // seasonal-grid → stagger-children
    html = addClassToTagWithClass(html, 'div', 'seasonal-grid', 'stagger-children');
  }

  if (type === 'about') {
    // about-story sections
    html = addClassToTagWithClass(html, 'section', 'about-story', 'fade-in');
    // values-grid → stagger-children
    html = addClassToTagWithClass(html, 'div', 'values-grid', 'stagger-children');
    // hosts-grid → stagger-children (host cards)
    html = addClassToTagWithClass(html, 'div', 'hosts-grid', 'stagger-children');
    // portfolio-grid → stagger-children
    html = addClassToTagWithClass(html, 'div', 'portfolio-grid', 'stagger-children');
    // about-values section
    html = addClassToTagWithClass(html, 'section', 'about-values', 'fade-in');
    // about-hosts section
    html = addClassToTagWithClass(html, 'section', 'about-hosts', 'fade-in');
    // about-portfolio section
    html = addClassToTagWithClass(html, 'section', 'about-portfolio', 'fade-in');
  }

  if (type === 'contact') {
    // contact-form → fade-in
    html = addClassToTagWithClass(html, 'div', 'contact-form', 'fade-in');
    // contact-info → stagger-children (sidebar panels)
    html = addClassToTagWithClass(html, 'aside', 'contact-info', 'fade-in');
    // contact-map → fade-in
    html = addClassToTagWithClass(html, 'div', 'contact-map', 'fade-in');
  }

  if (type === 'faq') {
    // faq-accordion → fade-in
    // We need to add fade-in to the FAQ content section
    html = addClassToTagWithClass(html, 'div', 'faq-accordion', 'fade-in');
  }

  if (type === 'legal') {
    // Content sections → fade-in
    html = addClassToSectionContaining(html, 'section', 'section', 'legal', 'fade-in');
  }

  if (type === 'blog-index') {
    // blog-grid or card-grid → stagger-children
    html = addClassToTagWithClass(html, 'div', 'blog-grid', 'stagger-children');
    html = addClassToTagWithClass(html, 'div', 'card-grid', 'stagger-children');
  }

  if (type === 'blog-post') {
    // Article content sections - blog posts use <article class="section">
    html = addClassToTagWithClass(html, 'article', 'section', 'fade-in');
    // Also add fade-in to the blog-post content div
    html = addClassToTagWithClass(html, 'div', 'blog-post', 'fade-in');
  }

  // Count changes
  if (html !== original) {
    changes = 1;
  }

  if (changes > 0) {
    writeFileSync(filepath, html, 'utf8');
    console.log(`✓ ${filepath.replace(ROOT + '/', '')}`);
    return true;
  } else {
    console.log(`  (no changes) ${filepath.replace(ROOT + '/', '')}`);
    return false;
  }
}

// Main
const files = walk(ROOT);
console.log(`Found ${files.length} HTML files to process.\n`);

let changedCount = 0;
for (const file of files) {
  if (processFile(file)) changedCount++;
}

console.log(`\nDone. ${changedCount}/${files.length} files modified.`);
