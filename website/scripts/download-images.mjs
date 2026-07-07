import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'

const BASE = '/Users/jockib/Desktop/CalmRio/website'

// === AIRBNB IMAGES (11 unique) ===
const airbnbImages = [
  { url: 'https://a0.muscache.com/im/pictures/hosting/Hosting-1101432035369683458/original/07bce65e-aa65-4b4b-b96f-47565e8eb797.jpeg', name: '07bce65e' },
  { url: 'https://a0.muscache.com/im/pictures/hosting/Hosting-50122536/original/c943e5f4-6a5c-441e-8693-6732e1cde1a7.jpeg', name: 'c943e5f4' },
  { url: 'https://a0.muscache.com/im/pictures/hosting/Hosting-1431741688356720747/original/e330beaf-cfaa-4576-81cb-2d6d328a3425.jpeg', name: 'e330beaf' },
  { url: 'https://a0.muscache.com/im/pictures/hosting/Hosting-1431741688356720747/original/18c0d041-126c-46bd-a6b9-480907d6ed32.jpeg', name: '18c0d041' },
  { url: 'https://a0.muscache.com/im/pictures/hosting/Hosting-1431741688356720747/original/04e8cb4b-e8e6-456a-a2c7-33d3fdeefaea.jpeg', name: '04e8cb4b' },
  { url: 'https://a0.muscache.com/im/pictures/miso/Hosting-1431741688356720747/original/a534fb7b-e7f9-494f-8c20-38e77d30bf2e.jpeg', name: 'a534fb7b' },
  { url: 'https://a0.muscache.com/im/pictures/miso/Hosting-1431741688356720747/original/fb9e575a-75c6-4216-8f8e-b5e041b74bd2.jpeg', name: 'fb9e575a' },
  { url: 'https://a0.muscache.com/im/pictures/hosting/Hosting-1101432035369683458/original/92b8773e-7245-47e3-aafe-a4a3b2dd960f.jpeg', name: '92b8773e' },
  { url: 'https://a0.muscache.com/im/pictures/hosting/Hosting-50122536/original/cc206c89-ae13-4c23-b933-3aeccd4e90ea.jpeg', name: 'cc206c89' },
  { url: 'https://a0.muscache.com/im/pictures/hosting/Hosting-50122536/original/96ad9084-70a5-416b-948d-d43a3eee5e7d.jpeg', name: '96ad9084' },
  { url: 'https://a0.muscache.com/im/pictures/miso/Hosting-1101432035369683458/original/3577b5b7-fb96-41d4-b20c-fd97e25b15a1.jpeg', name: '3577b5b7' },
]

// === UNSPLASH IMAGES (16 unique) ===
const unsplashImages = [
  { id: '1559825481-12a05cc00344', name: 'grande-conche-beach' },
  { id: '1505228395891-9a51e7e86bf6', name: 'gatseau-beach' },
  { id: '1507525428034-b723cf961d3e', name: 'coastal-beach-hero' },
  { id: '1448375240586-882707db888b', name: 'saint-trojan-forest' },
  { id: '1505118380757-91f5f5632de0', name: 'pointe-maumusson' },
  { id: '1590511794750-0c7acc5c6f49', name: 'marennes-oysters' },
  { id: '1488459716781-31db52582fe9', name: 'royan-market' },
  { id: '1542838132-92c53300491e', name: 'saint-trojan-market' },
  { id: '1470071459604-3b5ec3a7fe05', name: 'parc-estuaire' },
  { id: '1501785888041-af3ef285b470', name: 'oleron-marsh' },
  { id: '1566140967404-b8b3932483f5', name: 'notre-dame-royan' },
  { id: '1586528116311-ad8dd3c8310d', name: 'fort-boyard' },
  { id: '1570024960191-8e28b8f4b1b2', name: 'petit-train-st-trojan' },
  { id: '1571068316344-75bc76f77890', name: 'oleron-bike-paths' },
  { id: '1465847899084-d164df4dedc5', name: 'violon-sur-le-sable' },
  { id: '1592853625511-ad0edcc69c07', name: 'fete-du-mimosa' },
]

let successes = 0
let failures = 0
const failedUrls = []

function download(url, filepath, label) {
  if (existsSync(filepath)) {
    console.log(`⏭  SKIP (exists): ${label} -> ${filepath}`)
    successes++
    return
  }
  try {
    console.log(`⬇  Downloading: ${label}`)
    execSync(`curl -L --max-time 30 --retry 2 --retry-delay 5 -o "${filepath}" "${url}"`, {
      cwd: BASE,
      stdio: 'pipe',
      timeout: 35000,
    })
    console.log(`   ✓ SAVED: ${filepath}`)
    successes++
  } catch (e) {
    console.error(`   ✗ FAILED: ${label} — ${e.message?.slice(0, 120)}`)
    failures++
    failedUrls.push({ url, label, error: e.message?.slice(0, 200) })
  }
}

// --- Download Airbnb -> properties/ ---
console.log('\n=== AIRBNB PROPERTY IMAGES ===\n')
for (const img of airbnbImages) {
  download(img.url, join(BASE, 'assets/images/properties', `${img.name}.jpg`), img.name)
}

// --- Download Unsplash -> guide/ (Most are from local-guide page context) ---
// Actually these are mixed: some from property pages, some from local-guide, some from hero
// Let's put them all in guide/ since they're editorial/atmosphere content
console.log('\n=== UNSPLASH EDITORIAL IMAGES ===\n')
for (const img of unsplashImages) {
  // Use w=1200 for good quality
  const url = `https://images.unsplash.com/photo-${img.id}?w=1200&q=85&fm=jpg`
  download(url, join(BASE, 'assets/images/guide', `${img.name}.jpg`), img.name)
}

console.log(`\n=== SUMMARY ===`)
console.log(`Successes: ${successes}`)
console.log(`Failures: ${failures}`)
if (failedUrls.length > 0) {
  console.log('\nFailed URLs:')
  failedUrls.forEach(f => console.log(`  - ${f.label}: ${f.url}`))
}
