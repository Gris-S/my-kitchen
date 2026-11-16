import { expect, test } from 'vitest'
import { ingredientEmoji as e } from './emoji'

test('ingrédients de tes recettes', () => {
  expect(e('Œufs')).toBe('🥚')
  expect(e("Jaunes d'œufs")).toBe('🥚')
  expect(e('Pommes de terre')).toBe('🥔')
  expect(e('Pomme')).toBe('🍎')
  expect(e('Beurre demi-sel')).toBe('🧈')
  expect(e('Crème fraiche')).toBe('🥛')
  expect(e('Emmental')).toBe('🧀')
  expect(e('Ail')).toBe('🧄')
  expect(e('Oignons verts entiers')).toBe('🧅')
  expect(e('Viande hachée')).toBe('🥩')
  expect(e('Cuisses de poulet sans os ni peau')).toBe('🍗')
  expect(e('Saumon')).toBe('🐟')
  expect(e('Tagliatelles')).toBe('🍝')
  expect(e('Riz jasmin')).toBe('🍚')
  expect(e('Vin rouge')).toBe('🍷')
  expect(e('Huile de sésame grillée')).toBe('🫒')
  expect(e('Sauce tomate')).toBe('🥫')
  expect(e('Sauce soja')).toBe('🍶')
  expect(e('Pois')).toBe('🫛')
  expect(e('Lentilles corail')).toBe('🫘')
  expect(e('Amidon de maïs')).toBe('🌽')
  expect(e('Pâte brisée')).toBe('🥧')
  expect(e('Fettuccine')).toBe('🍝')
})

test('noms anglais', () => {
  expect(e('Eggs')).toBe('🥚')
  expect(e('Ground beef')).toBe('🥩')
  expect(e('Olive oil')).toBe('🫒')
  expect(e('Potatoes')).toBe('🥔')
  expect(e('Chicken breast')).toBe('🍗')
  expect(e('Bell pepper')).toBe('🫑')
  expect(e('Black pepper')).toBe('🌶️')
})

test('pas de faux amis', () => {
  expect(e('Mayonnaise')).toBe('🥄') // « ail » ne colle pas au milieu d'un mot
  expect(e('Thym')).toBe('🌿') // « the » ne colle pas à « thym »
  expect(e('Inconnu')).toBe('🥄')
})
