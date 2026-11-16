import { expect, test } from 'vitest'
import type { Recipe } from './api'
import { buildTiles, covers, isBasic, rankRecipes } from './fridge'

const recipe = (id: number, name: string, items: string[]): Recipe =>
  ({ id, name, description: '', photo: null, time: null, cook_time: null, prep_time: null, yields: 4, source: null,
    items: items.map((n, k) => ({ id: k, name: n, optional: false })) }) as Recipe

test('correspondance souple', () => {
  expect(covers('poulet', 'Blancs de poulet')).toBe(true)
  expect(covers('oeufs', 'Œufs')).toBe(true)
  expect(covers('creme', 'Crème fraîche')).toBe(true)
  expect(covers('crème fraîche épaisse', 'Crème fraîche')).toBe(true)
  expect(covers('tomate', 'Tomates')).toBe(true)
  expect(covers('lait', 'Lardons')).toBe(false)
  expect(covers('riz', 'Risotto')).toBe(false)
})

test('les basiques sont ignorés', () => {
  expect(isBasic('Sel')).toBe(true)
  expect(isBasic("Huile d'olive")).toBe(true)
  expect(isBasic('Beurre')).toBe(false)
  expect(isBasic('Water')).toBe(true)
  expect(isBasic('Olive oil')).toBe(true)
})

test('classement : la recette la plus complète en premier', () => {
  const r = rankRecipes(
    [
      recipe(1, 'Quiche', ['Pâte brisée', 'Lardons', 'Œufs', 'Crème fraîche', 'Sel']),
      recipe(2, 'Omelette', ['Œufs', 'Beurre', 'Sel', 'Poivre']),
      recipe(3, 'Gâteau', ['Farine', 'Sucre', 'Chocolat']),
    ],
    ['oeufs', 'beurre', 'creme'],
  )
  expect(r.map((m) => m.recipe.name)).toEqual(['Omelette', 'Quiche'])
  expect(r[0].score).toBe(1)
  expect(r[1].missing).toEqual(['Pâte brisée', 'Lardons'])
})

test('tuiles : dédoublonnées, sans basiques, de A à Z', () => {
  const r1 = recipe(1, 'Quiche', ['Œufs', 'Lardons', 'Sel'])
  const r2 = recipe(2, 'Omelette', ['oeufs', 'Œufs', 'Tomates', 'Huile d’olive', 'Water'])
  expect(buildTiles([r1, r2])).toEqual([
    { key: 'lardon', name: 'Lardons' },
    { key: 'oeuf', name: 'Œufs' },
    { key: 'tomate', name: 'Tomates' },
  ])
})
