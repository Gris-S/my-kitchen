// KitchenOwl range un repas planifié sur un jour UTC (minuit, en millisecondes).
// On convertit donc « le jour choisi ici » en minuit UTC de ce même jour, sans
// passer par l'heure locale, sinon le repas glisse d'un jour selon l'heure.

import { locale } from './i18n'

const pad = (n: number) => String(n).padStart(2, '0')

export const toInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const todayInput = () => toInput(new Date())

export const localDayToUtc = (input: string) => {
  const [y, m, d] = input.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

export const utcToInput = (ms: number) => {
  const d = new Date(ms)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

export const dayLabel = (input: string) => {
  const [y, m, d] = input.split('-').map(Number)
  const label = new Date(y, m - 1, d).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}
