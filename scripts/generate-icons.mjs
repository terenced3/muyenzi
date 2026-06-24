/**
 * Generates PWA icons (192x192 and 512x512) using the Canvas API.
 * Run once: node scripts/generate-icons.mjs
 *
 * Requires: npm install canvas --save-dev  (or use the online tool below)
 *
 * Alternative (no Node canvas): paste the SVG below into
 * https://maskable.app/editor  and export 192 + 512 PNGs, place them in
 * public/icons/
 */

import { createCanvas } from 'canvas'
import { writeFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dir, '..', 'public', 'icons')
mkdirSync(outDir, { recursive: true })

function drawIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  const r = size * 0.18  // corner radius

  // Background — indigo gradient
  const grad = ctx.createLinearGradient(0, 0, size, size)
  grad.addColorStop(0, '#6366f1')
  grad.addColorStop(1, '#818cf8')
  ctx.fillStyle = grad

  // Rounded rectangle
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.lineTo(size - r, 0)
  ctx.quadraticCurveTo(size, 0, size, r)
  ctx.lineTo(size, size - r)
  ctx.quadraticCurveTo(size, size, size - r, size)
  ctx.lineTo(r, size)
  ctx.quadraticCurveTo(0, size, 0, size - r)
  ctx.lineTo(0, r)
  ctx.quadraticCurveTo(0, 0, r, 0)
  ctx.closePath()
  ctx.fill()

  // Letter M centred
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${size * 0.52}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('M', size / 2, size / 2 + size * 0.03)

  return canvas.toBuffer('image/png')
}

for (const size of [192, 512]) {
  const buf = drawIcon(size)
  const file = join(outDir, `icon-${size}.png`)
  writeFileSync(file, buf)
  console.log(`✓ ${file}`)
}
console.log('Done. Place the icons in public/icons/ and commit.')
