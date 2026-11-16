import { expect, test } from 'vitest'
import { convertUnits as c, toNumber } from './units'

test('nombres américains', () => {
  expect(toNumber('½')).toBe(0.5)
  expect(toNumber('1 1/2')).toBe(1.5)
  expect(toNumber('1½')).toBe(1.5)
  expect(toNumber('3/4')).toBe(0.75)
  expect(toNumber('14.5')).toBe(14.5)
})

test('cuillères : le nombre reste, le nom change', () => {
  expect(c('2 Tbsp')).toBe('2 c. à soupe')
  expect(c('½ tsp')).toBe('½ c. à café')
  expect(c('1 tablespoon')).toBe('1 c. à soupe')
  expect(c('3 teaspoons')).toBe('3 c. à café')
})

test('volumes et masses en métrique', () => {
  expect(c('1 cup')).toBe('24 cl')
  expect(c('¼ cup')).toBe('60 ml')
  expect(c('2 cups')).toBe('48 cl')
  expect(c('1 lb.')).toBe('450 g')
  expect(c('3 lbs')).toBe('1,4 kg')
  expect(c('6 oz.')).toBe('170 g')
  expect(c('14.5 oz.')).toBe('410 g')
  expect(c('8 fl oz')).toBe('24 cl')
  expect(c('1 stick butter')).toBe('110 g de beurre')
})

test('températures et longueurs dans une étape', () => {
  expect(c('Preheat the oven to 350°F.')).toBe('Preheat the oven to 175 °C.')
  expect(c('Bake at 400 degrees F for 20 minutes')).toBe('Bake at 205 °C for 20 minutes')
  expect(c('Roll into a 9-inch circle')).toBe('Roll into a 22,9 cm circle')
  expect(c('Add 1 cup water and 2 tbsp oil')).toBe('Add 24 cl water and 2 c. à soupe oil')
})

test('le texte sans mesure ne bouge pas', () => {
  expect(c('3 eggs')).toBe('3 eggs')
  expect(c('2 garlic cloves')).toBe('2 garlic cloves')
  expect(c('Cook for 10 minutes')).toBe('Cook for 10 minutes')
  expect(c('2 tomatoes')).toBe('2 tomatoes')
})
