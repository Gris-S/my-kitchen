import { expect, test } from 'vitest'
import { scaleQuantity as s } from './scale'

test('masses et volumes', () => {
  expect(s('200 g', 1.5)).toBe('300 g')
  expect(s('20 cl', 1.5)).toBe('30 cl')
  expect(s('1,5 kg', 2)).toBe('3 kg')
  expect(s('125 g', 0.5)).toBe('65 g')
})

test('pièces et cuillères', () => {
  expect(s('3', 2)).toBe('6')
  expect(s('3', 0.5)).toBe('1 ½')
  expect(s('3', 1.5)).toBe('5') // 4,5 œufs → 5
  expect(s('1', 1.5)).toBe('1 ½')
  expect(s('1 c. à soupe', 1.5)).toBe('1 ½ c. à soupe')
  expect(s('½ c. à café', 2)).toBe('1 c. à café')
  expect(s('1, émincé', 2)).toBe('2, émincé')
  expect(s('2 à 3', 2)).toBe('4 à 6')
})

test('sans nombre : inchangé', () => {
  expect(s('', 2)).toBe('')
  expect(s('1 pincée', 1)).toBe('1 pincée')
  expect(s('au goût', 3)).toBe('au goût')
})
