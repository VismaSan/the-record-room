/* ============================================================
   covers.ts — procedural "reissue-style" album sleeves
   Generates a deterministic, handsome placeholder per record.
   Ported from the Wax & Paper prototype's covers.js.
   ============================================================ */
import type { Record as VinylRecord } from '../types'

type CoverInput = Pick<VinylRecord, 'id' | 'artist' | 'title'>

// tiny seeded PRNG (mulberry32) from a string
function seedFrom(str: string): () => number {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
  }
}

// warm, paper-friendly palettes (sleeve bg, ink, pop)
const PALETTES: [string, string, string][] = [
  ['oklch(0.56 0.14 40)', 'oklch(0.96 0.02 80)', 'oklch(0.74 0.11 78)'], // rust / cream / mustard
  ['oklch(0.30 0.03 60)', 'oklch(0.93 0.02 82)', 'oklch(0.62 0.13 42)'], // ink / cream / rust
  ['oklch(0.90 0.04 86)', 'oklch(0.28 0.03 56)', 'oklch(0.56 0.14 40)'], // cream / ink / rust
  ['oklch(0.52 0.08 200)', 'oklch(0.94 0.02 82)', 'oklch(0.78 0.10 80)'], // teal / cream / mustard
  ['oklch(0.74 0.11 78)', 'oklch(0.28 0.03 56)', 'oklch(0.56 0.14 40)'], // mustard / ink / rust
  ['oklch(0.42 0.10 28)', 'oklch(0.92 0.03 84)', 'oklch(0.74 0.11 78)'], // maroon / cream / mustard
]

function esc(s: unknown): string {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
}

// build an SVG sleeve given record + rng + palette
function svgFor(rec: CoverInput, rnd: () => number, pal: [string, string, string]): string {
  const [bg, ink, pop] = pal
  const styleN = Math.floor(rnd() * 5)
  const W = 600
  const H = 600
  let art = ''

  if (styleN === 0) {
    // concentric — like a record label
    const cx = 300
    const cy = 220 + rnd() * 160
    art = `
      <circle cx="${cx}" cy="${cy}" r="170" fill="${pop}"/>
      <circle cx="${cx}" cy="${cy}" r="118" fill="none" stroke="${ink}" stroke-width="3" opacity="0.5"/>
      <circle cx="${cx}" cy="${cy}" r="70" fill="${ink}"/>
      <circle cx="${cx}" cy="${cy}" r="10" fill="${bg}"/>`
  } else if (styleN === 1) {
    // split field
    const split = 180 + rnd() * 240
    const horiz = rnd() > 0.5
    art = horiz
      ? `<rect x="0" y="${split}" width="${W}" height="${H - split}" fill="${pop}"/>`
      : `<rect x="${split}" y="0" width="${W - split}" height="${H}" fill="${pop}"/>`
    art += `<circle cx="${horiz ? 150 : split * 0.5}" cy="${horiz ? split * 0.5 : 160}" r="58" fill="${ink}" opacity="0.85"/>`
  } else if (styleN === 2) {
    // stripes
    let s = ''
    const n = 4 + Math.floor(rnd() * 4)
    for (let i = 0; i < n; i++) {
      const y = (H / n) * i
      s += `<rect x="0" y="${y}" width="${W}" height="${(H / n) * (0.3 + rnd() * 0.4)}" fill="${i % 2 ? pop : ink}" opacity="${0.25 + rnd() * 0.4}"/>`
    }
    art = s
  } else if (styleN === 3) {
    // big geometric — triangle / arc
    art = `<path d="M0 ${H} L${300 + rnd() * 200} ${100 + rnd() * 160} L${W} ${H} Z" fill="${pop}"/>
           <circle cx="${120 + rnd() * 120}" cy="${120 + rnd() * 100}" r="${40 + rnd() * 40}" fill="${ink}" opacity="0.8"/>`
  } else {
    // grid of dots
    let g = ''
    const cols = 4 + Math.floor(rnd() * 3)
    for (let x = 0; x < cols; x++)
      for (let y = 0; y < cols; y++) {
        if (rnd() > 0.45) continue
        g += `<circle cx="${(W / cols) * (x + 0.5)}" cy="${(H / cols) * (y + 0.5)}" r="${10 + rnd() * 26}" fill="${rnd() > 0.5 ? pop : ink}" opacity="${0.5 + rnd() * 0.5}"/>`
      }
    art = g
  }

  const artist = esc(rec.artist || '')
  const album = esc(rec.title || '')
  const txtY = styleN === 0 ? 540 : 70
  const anchor = styleN === 0 ? 'middle' : 'start'
  const tx = styleN === 0 ? 300 : 44

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
  <rect width="${W}" height="${H}" fill="${bg}"/>
  ${art}
  <g font-family="'Work Sans', sans-serif" fill="${ink}">
    <text x="${tx}" y="${txtY}" text-anchor="${anchor}" font-size="20" letter-spacing="2" font-weight="600" opacity="0.85" style="text-transform:uppercase">${artist}</text>
    <text x="${tx}" y="${txtY + 34}" text-anchor="${anchor}" font-family="'Yeseva One', serif" font-size="34">${album}</text>
  </g>
</svg>`
}

// deterministic procedural sleeve for a record
export function proceduralSleeveSVG(rec: CoverInput): string {
  const key = (rec.id || '') + (rec.artist || '') + (rec.title || '')
  const rnd = seedFrom(key)
  const pal = PALETTES[Math.floor(rnd() * PALETTES.length)]
  return svgFor(rec, rnd, pal)
}
