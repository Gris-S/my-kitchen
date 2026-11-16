// Mesures américaines → mesures françaises. Appliqué seulement aux recettes en
// anglais : les cuillères gardent leur nombre, le reste passe en métrique.
//
// shortcut: une « cup » est convertie en volume (24 cl), jamais en grammes —
// la masse dépend de l'ingrédient (farine ≠ sucre). À corriger à la main si besoin.

const FRACTIONS: Record<string, number> = { '¼': 0.25, '½': 0.5, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': 0.125 }
const NUM = String.raw`(?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?\s*[¼½¾⅓⅔⅛]?|[¼½¾⅓⅔⅛])`

export function toNumber(s: string): number {
  s = s.trim()
  let total = 0
  for (const [f, v] of Object.entries(FRACTIONS)) if (s.includes(f)) (total += v), (s = s.replace(f, '').trim())
  if (!s) return total
  const mixed = /^(\d+)\s+(\d+)\/(\d+)$/.exec(s)
  if (mixed) return total + +mixed[1] + +mixed[2] / +mixed[3]
  const frac = /^(\d+)\/(\d+)$/.exec(s)
  if (frac) return total + +frac[1] / +frac[2]
  return total + Number(s.replace(',', '.'))
}

const fr = (n: number) => (Math.round(n * 10) / 10).toLocaleString('fr-FR')
const round = (n: number, step: number) => Math.max(step, Math.round(n / step) * step)

const grams = (g: number) => (g >= 1000 ? `${fr(g / 1000)} kg` : `${round(g, g < 50 ? 5 : 10)} g`)
const millilitres = (ml: number) => (ml >= 1000 ? `${fr(ml / 1000)} l` : ml >= 100 ? `${round(ml / 10, 1)} cl` : `${round(ml, 5)} ml`)

type Rule = { re: string; to: (n: number, raw: string) => string }
const RULES: Rule[] = [
  { re: String.raw`(?:tbsps?|tablespoons?|T)\b\.?`, to: (_, raw) => `${raw} c. à soupe` },
  { re: String.raw`(?:tsps?|teaspoons?|t)\b\.?`, to: (_, raw) => `${raw} c. à café` },
  { re: String.raw`(?:fl\.?\s*oz|fluid\s+ounces?)\b\.?`, to: (n) => millilitres(n * 29.57) },
  { re: String.raw`cups?\b`, to: (n) => millilitres(n * 240) },
  { re: String.raw`(?:oz|ounces?)\b\.?`, to: (n) => grams(n * 28.35) },
  { re: String.raw`(?:lbs?|pounds?)\b\.?`, to: (n) => grams(n * 453.6) },
  { re: String.raw`sticks?\s+(?:of\s+)?butter\b`, to: (n) => `${grams(n * 113)} de beurre` },
  { re: String.raw`(?:inch(?:es)?|in\.)(?![a-z])`, to: (n) => `${fr(n * 2.54)} cm` },
  { re: String.raw`(?:°\s*F|degrees?\s+F(?:ahrenheit)?)\b`, to: (n) => `${round(((n - 32) * 5) / 9, 5)} °C` },
]

const FULL = new RegExp(String.raw`(${NUM})(?:-|\s*)(${RULES.map((r) => `(${r.re})`).join('|')})`, 'gi')

/** Convertit toutes les mesures américaines d'un texte (quantité ou étape). */
export function convertUnits(text: string): string {
  return text
    .replace(/(\d+)\s*°?\s*F\b(?!\w)/g, (m, n) => (/°|F$/.test(m) ? `${n}°F` : m)) // « 350F » → « 350°F »
    .replace(FULL, (match, num: string, ...groups: unknown[]) => {
      const idx = groups.slice(1, RULES.length + 1).findIndex((g) => g !== undefined)
      if (idx < 0) return match
      const n = toNumber(num)
      if (!Number.isFinite(n) || n <= 0) return match
      return RULES[idx].to(n, num.trim())
    })
}
