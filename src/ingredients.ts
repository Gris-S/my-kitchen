// Découpe une ligne d'ingrédient (« 20 cl de crème fraîche ») en un nom
// (« Crème fraîche ») et une quantité (« 20 cl »). KitchenOwl ne sait le faire
// qu'en anglais sans IA : c'est ce qui rendait l'import Marmiton inutilisable.
//
// shortcut: liste d'unités écrite à la main (français + anglais courant) ; une
// unité absente reste dans le nom, que l'on corrige à l'écran avant d'enregistrer.

const QTY = String.raw`(?:environ\s+|about\s+)?[\d¼½¾⅓⅔⅛]+(?:[.,/]\d+)?(?:\s*(?:à|-|to)\s*[\d¼½¾⅓⅔]+(?:[.,/]\d+)?)?`

const UNITS = [
  'kg', 'g', 'mg', 'l', 'dl', 'cl', 'ml',
  'c\\.?\\s*à\\s*s(?:oupe)?\\.?', 'c\\.?\\s*à\\s*c(?:afé)?\\.?', 'cs', 'cc', 'càs', 'càc',
  'cuill?(?:è|e)res?\\s+à\\s+(?:soupe|café)', 'cuil\\.?\\s*à\\s*(?:soupe|café)',
  'pinc(?:é|e)es?', 'gousses?', 'tranches?', 'bo(?:î|i)tes?', 'sachets?', 'verres?', 'tasses?',
  'brins?', 'feuilles?', 'bottes?', 'poign(?:é|e)es?', 'pots?', 'morceaux?', 'filets?', 'noix',
  'noisettes?', 'bouquets?', 'branches?', 'zestes?', 'rouleaux?', 'paquets?', 'briques?', 'barquettes?',
  'cups?', 'tbsps?\\.?', 'tsps?\\.?', 'tablespoons?', 'teaspoons?', 'oz\\.?', 'lbs?\\.?', 'pounds?',
  'cans?', 'cloves?', 'pinch(?:es)?', 'slices?', 'sticks?',
].join('|')

const LINE = new RegExp(
  String.raw`^\s*(${QTY})?\s*(?:(${UNITS})(?![a-zà-ÿ]))?\.?\s*(?:de\s+|d['’]\s*|des\s+|du\s+|of\s+)?(.*)$`,
  'i',
)

const PREP = /^(?:\S+(?:é|ée|és|ées|ed)|cut|to|for|about|plus|divided|optional|room|at|in|into|en|à|au|pour|selon|facultatif|environ|or|ou|bien|finely|thinly|roughly|freshly|coarsely|lightly)(?=[\s,;]|$)/i

export type Parsed = { name: string; description: string }

export function parseIngredient(line: string): Parsed {
  let text = line.replace(/\s+/g, ' ').trim()
  // Ce qui est entre parenthèses (« (en dés) », « ($0.74) ») part dans la quantité.
  const notes: string[] = []
  text = text.replace(/\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g, (_, n: string) => {
    // Les prix (« $0.74 ») ne servent à rien dans une liste de courses.
    notes.push(...n.split(',').map((x) => x.trim()).filter((x) => x && !x.includes('$')))
    return ''
  }).replace(/\s+/g, ' ').trim()

  const m = LINE.exec(text)
  const qty = [m?.[1], m?.[2]].filter(Boolean).join(' ').trim()
  let name = (m?.[3] ?? text).replace(/^[,;:\s]+|[,;:\s]+$/g, '')
  // « oignon, émincé » : la préparation après la virgule va avec la quantité.
  const comma = name.indexOf(',')
  // Après la virgule, une préparation (« émincé », « minced », « cut into… ») va avec la
  // quantité ; sinon la virgule sépare des mots du nom (« boneless, skinless chicken »).
  if (comma > 0 && PREP.test(name.slice(comma + 1).trim())) {
    notes.push(name.slice(comma + 1).trim())
    name = name.slice(0, comma).trim()
  } else if (comma > 0) {
    name = name.replace(/,\s*/g, ' ')
  }
  // « can black beans », « jar of salsa » : le contenant n'est pas le nom de l'article.
  name = name.replace(/^(?:cans?|jars?|packages?|bags?|boxes?|bottles?)\s+(?:of\s+)?/i, '')
  if (!name) return { name: capitalize(text), description: '' }
  const description = [qty, ...notes].filter(Boolean).join(', ')
  return { name: capitalize(name), description }
}

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase('fr') + s.slice(1)
