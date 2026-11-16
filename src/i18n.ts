// Langue de l'interface : français ou anglais. Choisie une fois par appareil (bouton
// FR / EN), sinon d'après la langue du navigateur. Changer de langue recharge la page.

export type Lang = 'fr' | 'en'

function initial(): Lang {
  try {
    const saved = localStorage.getItem('mk-lang')
    if (saved === 'fr' || saved === 'en') return saved
  } catch {
    // stockage indisponible (navigation privée…) : on suit le navigateur
  }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

export const lang: Lang = initial()
export const locale = lang === 'en' ? 'en-GB' : 'fr-FR'

/** Le texte dans la langue choisie : t('Courses', 'Shopping'). */
export const t = (fr: string, en: string) => (lang === 'en' ? en : fr)

/** « 1 ingrédient » / « 2 ingrédients », « 1 ingredient » / « 2 ingredients ». */
export const plural = (n: number, fr: string, en: string) => `${n} ${t(fr, en)}${n > 1 ? 's' : ''}`

export function setLang(l: Lang) {
  try {
    localStorage.setItem('mk-lang', l)
  } catch {
    // tant pis : la langue ne sera pas retenue
  }
  location.reload()
}

if (typeof document !== 'undefined') document.documentElement.lang = lang
