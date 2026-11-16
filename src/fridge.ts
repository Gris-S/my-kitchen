// « Qu'est-ce que je peux faire avec ce que j'ai ? » : classe les recettes selon
// la part de leurs ingrédients que l'on a. Le sel, le poivre, l'eau et l'huile
// sont considérés comme toujours là.

import type { Recipe } from './api'

// En français et en anglais : le foyer KitchenOwl peut avoir des articles anglais (« Water »).
const BASICS = [
  'sel', 'poivre', 'eau', 'huile', 'huile d olive', 'gros sel', 'poivre noir', 'fleur de sel',
  'salt', 'pepper', 'water', 'oil', 'olive oil', 'black pepper', 'kosher salt', 'sea salt',
]

/** « Œufs » → « oeuf », « Crème fraîche » → « creme fraiche » : pour comparer sans se soucier
 *  des accents, des majuscules et du pluriel. */
export const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/['’-]/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (w.length > 3 ? w.replace(/(s|x)$/, '') : w))
    .join(' ')

const STOP = new Set(['de', 'du', 'des', 'd', 'la', 'le', 'les', 'l', 'a', 'au', 'aux', 'en', 'et'])
const words = (s: string) => norm(s).split(' ').filter((w) => !STOP.has(w))

export const isBasic = (name: string) => BASICS.includes(norm(name))

/** Vrai si ce qu'on a (« poulet ») couvre l'ingrédient (« Blancs de poulet »), ou l'inverse
 *  (« crème fraîche épaisse » couvre « Crème fraîche »). */
export function covers(have: string, ingredient: string): boolean {
  const h = words(have)
  const i = words(ingredient)
  if (!h.length || !i.length) return false
  return h.every((w) => i.includes(w)) || i.every((w) => h.includes(w))
}

export type Match = { recipe: Recipe; have: string[]; missing: string[]; score: number }

export function rankRecipes(recipes: Recipe[], fridge: string[]): Match[] {
  if (!fridge.length) return []
  return recipes
    .map((recipe) => {
      const needed = recipe.items.filter((i) => !isBasic(i.name) && !i.optional)
      const have: string[] = []
      const missing: string[] = []
      for (const i of needed) (fridge.some((f) => covers(f, i.name)) ? have : missing).push(i.name)
      return { recipe, have, missing, score: needed.length ? have.length / needed.length : 0 }
    })
    .filter((m) => m.have.length > 0)
    .sort((a, b) => b.score - a.score || a.missing.length - b.missing.length || b.have.length - a.have.length)
}

export type Tile = { key: string; name: string }

/** Une tuile par ingrédient distinct des recettes (basiques exclus), de A à Z.
 *  Variantes d'écriture réunies par `norm` : on garde l'écriture la plus fréquente. */
export function buildTiles(recipes: Recipe[]): Tile[] {
  const seen = new Map<string, Map<string, number>>()
  for (const r of recipes)
    for (const i of r.items) {
      if (isBasic(i.name)) continue
      const key = norm(i.name)
      if (!key) continue
      const names = seen.get(key) ?? new Map<string, number>()
      names.set(i.name, (names.get(i.name) ?? 0) + 1)
      seen.set(key, names)
    }
  return [...seen]
    .map(([key, names]) => ({ key, name: [...names].sort((a, b) => b[1] - a[1])[0][0] }))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
}
