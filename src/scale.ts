// Adapte une quantité au nombre de personnes : « 200 g » pour 4 → « 300 g » pour 6.
// Seul le nombre en tête change ; « sel », « 1 pincée », « 2, émincé » gardent leur texte.

import { toNumber } from './units'

const LEAD = /^\s*(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?(?:\s*[¼½¾⅓⅔⅛])?|[¼½¾⅓⅔⅛])(\s*(?:à|-)\s*(?:\d+(?:[.,]\d+)?|[¼½¾⅓⅔⅛]))?/

const NICE: [number, string][] = [
  [0.25, '¼'],
  [0.5, '½'],
  [0.75, '¾'],
]

/** Écrit un nombre comme en cuisine : 1,5 → « 1 ½ », 0,25 → « ¼ », 413 g → 410 g. */
export function formatQty(n: number, unit: string): string {
  // Des pièces sans unité (« 3 » œufs) : pas de 4 ½ œufs, on arrondit à partir de 2.
  if (/^\s*(?:,|$)/.test(unit) && n >= 2) return String(Math.round(n))
  if (/^\s*(?:g|ml)\b/.test(unit) && n >= 20) return String(Math.round(n / (n >= 100 ? 10 : 5)) * (n >= 100 ? 10 : 5))
  const whole = Math.floor(n)
  const frac = n - whole
  if (n < 10) {
    const nice = NICE.find(([v]) => Math.abs(frac - v) < 0.07)
    if (frac < 0.07) return String(whole || (n > 0 ? 1 : 0))
    if (frac > 0.93) return String(whole + 1)
    if (nice) return whole ? `${whole} ${nice[1]}` : nice[1]
    return (Math.round(n * 10) / 10).toLocaleString('fr-FR')
  }
  return String(Math.round(n))
}

export function scaleQuantity(desc: string, factor: number): string {
  if (!desc || factor === 1) return desc
  const m = LEAD.exec(desc)
  if (!m) return desc
  const rest = desc.slice(m[0].length)
  const a = formatQty(toNumber(m[1]) * factor, rest)
  if (!m[2]) return `${a}${rest}`
  const [, sep, b] = /^(\s*(?:à|-)\s*)(.*)$/.exec(m[2])!
  return `${a}${sep}${formatQty(toNumber(b) * factor, rest)}${rest}`
}
