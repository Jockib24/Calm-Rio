import sharp from 'sharp'
import { readdirSync, existsSync, statSync } from 'fs'
import { join, parse, relative } from 'path'

const BASE = '/Users/jockib/Desktop/CalmRio/website'
const dirs = ['assets/images/properties', 'assets/images/blog', 'assets/images/guide']

let totalBefore = 0
let totalWebp = 0
let totalAvif = 0
let count = 0

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

for (const dir of dirs) {
  const fullDir = join(BASE, dir)
  if (!existsSync(fullDir)) continue

  const files = readdirSync(fullDir).filter(f => f.match(/\.(jpg|jpeg|png)$/i))

  for (const file of files) {
    const input = join(fullDir, file)
    const name = parse(file).name
    const beforeSize = statSync(input).size
    totalBefore += beforeSize

    // WebP
    const webpPath = join(fullDir, `${name}.webp`)
    await sharp(input)
      .webp({ quality: 80 })
      .toFile(webpPath)
    const webpSize = statSync(webpPath).size
    totalWebp += webpSize

    // AVIF
    const avifPath = join(fullDir, `${name}.avif`)
    await sharp(input)
      .avif({ quality: 65 })
      .toFile(avifPath)
    const avifSize = statSync(avifPath).size
    totalAvif += avifSize

    count++
    const relativePath = relative(BASE, input)
    console.log(`✓ [${count}] ${relativePath}`)
    console.log(`  Original: ${formatBytes(beforeSize)} → WebP: ${formatBytes(webpSize)} (${Math.round((1 - webpSize / beforeSize) * 100)}% save) | AVIF: ${formatBytes(avifSize)} (${Math.round((1 - avifSize / beforeSize) * 100)}% save)`)
  }
}

console.log(`\n========================================`)
console.log(`SUMMARY`)
console.log(`========================================`)
console.log(`Images processed:  ${count}`)
console.log(`Original total:    ${formatBytes(totalBefore)}`)
console.log(`WebP total:        ${formatBytes(totalWebp)}  (${Math.round((1 - totalWebp / totalBefore) * 100)}% smaller)`)
console.log(`AVIF total:        ${formatBytes(totalAvif)}  (${Math.round((1 - totalAvif / totalBefore) * 100)}% smaller)`)
console.log(`All files size:    ${formatBytes(totalBefore + totalWebp + totalAvif)}`)
