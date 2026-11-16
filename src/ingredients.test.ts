import { expect, test } from 'vitest'
import { parseIngredient as p } from './ingredients'

test('lignes Marmiton', () => {
  expect(p('20 cl de crème fraîche')).toEqual({ name: 'Crème fraîche', description: '20 cl' })
  expect(p('200 g de pâtes brisées')).toEqual({ name: 'Pâtes brisées', description: '200 g' })
  expect(p('3 oeufs')).toEqual({ name: 'Oeufs', description: '3' })
  expect(p('muscade')).toEqual({ name: 'Muscade', description: '' })
  expect(p("2 gousses d'ail")).toEqual({ name: 'Ail', description: '2 gousses' })
  expect(p('1 c. à soupe d’huile d’olive')).toEqual({ name: 'Huile d’olive', description: '1 c. à soupe' })
  expect(p('1 pincée de sel')).toEqual({ name: 'Sel', description: '1 pincée' })
  expect(p('1 oignon, émincé')).toEqual({ name: 'Oignon', description: '1, émincé' })
  expect(p('2 à 3 carottes')).toEqual({ name: 'Carottes', description: '2 à 3' })
  expect(p('1,5 kg de pommes de terre')).toEqual({ name: 'Pommes de terre', description: '1,5 kg' })
})

test("une unité n'est pas coupée au milieu d'un mot", () => {
  expect(p('4 grosses tomates')).toEqual({ name: 'Grosses tomates', description: '4' })
  expect(p('2 lardons')).toEqual({ name: 'Lardons', description: '2' })
})

test('lignes anglaises (Budget Bytes)', () => {
  expect(p('1 lb. boneless, skinless chicken breasts')).toEqual({ name: 'Boneless skinless chicken breasts', description: '1 lb.' })
  expect(p('2 carrots, tomatoes')).toEqual({ name: 'Carrots tomatoes', description: '2' })
  expect(p('1 chicken breast, cut into cubes')).toEqual({ name: 'Chicken breast', description: '1, cut into cubes' })
  expect(p('15.25 oz. can kidney beans (one can, (drained & rinsed) $0.86)').name).toBe('Kidney beans')
  expect(p('1 lb. ground beef ($5.94*)')).toEqual({ name: 'Ground beef', description: '1 lb.' })
  expect(p('2 garlic cloves (minced, $0.12)')).toEqual({ name: 'Garlic cloves', description: '2, minced' })
  expect(p('½ tsp black pepper (freshly cracked, $0.08)')).toEqual({
    name: 'Black pepper',
    description: '½ tsp, freshly cracked',
  })
})
