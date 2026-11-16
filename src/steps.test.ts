import { expect, test } from 'vitest'
import { splitSteps } from './steps'

test('recette importée : présentation puis étapes', () => {
  const r = splitSteps('Recette Quiche lorraine. Notée 4.7/5.\n\nPréchauffer le four.\nÉtaler la pâte.\n\nCuire 45 min.')
  expect(r.intro).toBe('Recette Quiche lorraine. Notée 4.7/5.')
  expect(r.steps).toEqual([{ text: 'Préchauffer le four.' }, { text: 'Étaler la pâte.' }, { text: 'Cuire 45 min.' }])
})

test('recette saisie à la main, numéros et puces retirés', () => {
  const r = splitSteps('1. Couper les oignons\n2) Les faire revenir\n- Servir chaud')
  expect(r.intro).toBe('')
  expect(r.steps.map((s) => s.text)).toEqual(['Couper les oignons', 'Les faire revenir', 'Servir chaud'])
})

test('préparation vide', () => {
  expect(splitSteps('')).toEqual({ intro: '', steps: [] })
})

test('les intertitres deviennent le titre de l’étape suivante', () => {
  const r = splitSteps('Intro.\n\nFaire revenir les aromatiques\nCouper l’oignon et le faire revenir 5 min.\nServir.')
  expect(r.steps).toEqual([
    { title: 'Faire revenir les aromatiques', text: 'Couper l’oignon et le faire revenir 5 min.' },
    { text: 'Servir.' },
  ])
})
