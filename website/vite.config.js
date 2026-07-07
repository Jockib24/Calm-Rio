import { defineConfig } from 'vite'
import { resolve } from 'path'

// Multi-page app — list every HTML entry point
const pages = [
  // French pages
  'index.html',
  'about.html',
  'contact.html',
  'faq.html',
  'local-guide.html',
  '404.html',
  'mentions-legales.html',
  'politique-de-confidentialite.html',
  'royan-appartement.html',
  'saint-trojan-villa.html',
  'saint-trojan-maison.html',
  'blog/index.html',
  'blog/posts/guide-plages-royan.html',
  'blog/posts/que-faire-oleron-famille.html',
  'blog/posts/meilleurs-restaurants-saint-trojan.html',
  'blog/posts/visiter-royan-hiver.html',
  // English pages
  'en/index.html',
  'en/about.html',
  'en/contact.html',
  'en/faq.html',
  'en/local-guide.html',
  'en/404.html',
  'en/mentions-legales.html',
  'en/politique-de-confidentialite.html',
  'en/royan-appartement.html',
  'en/saint-trojan-villa.html',
  'en/saint-trojan-maison.html',
  'en/blog/index.html',
  'en/blog/posts/guide-plages-royan.html',
  'en/blog/posts/que-faire-oleron-famille.html',
]

const input = {}
pages.forEach(page => {
  const name = page
    .replace(/\.html$/, '')
    .replace(/\//g, '-')
    .replace(/^index$/, 'home')
  input[name] = resolve(__dirname, page)
})

export default defineConfig({
  root: '.',
  base: '/Calm-Rio/',
  publicDir: 'public',

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssMinify: 'lightningcss',
    rollupOptions: {
      input,
      output: {
        entryFileNames: 'assets/js/[name]-[hash].js',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name
          if (name.endsWith('.css')) return 'assets/css/[name]-[hash][extname]'
          if (name.match(/\.(woff2?|ttf|otf|eot)$/)) return 'assets/fonts/[name][extname]'
          if (name.match(/\.(png|jpe?g|gif|svg|webp|avif)$/)) return 'assets/images/[name][extname]'
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  },

  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler'
      }
    }
  },

  server: {
    port: 3000,
    host: true
  }
})
