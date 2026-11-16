// Traduction anglais → français par LibreTranslate (traducteur hors ligne qui
// tourne sur le NAS, sans IA externe), joint par /traduction sur le même serveur.
// Les mesures américaines sont converties au passage (voir units.ts).

import { convertUnits } from './units'

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/traduction/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Le traducteur a répondu ${res.status}`)
  return res.json() as Promise<T>
}

/** Vrai si le texte est en anglais. En cas de doute ou de traducteur absent : faux. */
export async function isEnglish(text: string): Promise<boolean> {
  const sample = text.slice(0, 600).trim()
  if (sample.length < 12) return false
  try {
    const [best] = await post<{ language: string; confidence: number }[]>('detect', { q: sample })
    return best?.language === 'en' && best.confidence >= 50
  } catch {
    return false
  }
}

async function translateMany(lines: string[]): Promise<string[]> {
  const idx = lines.map((l, i) => (l.trim() ? i : -1)).filter((i) => i >= 0)
  if (!idx.length) return lines
  const { translatedText } = await post<{ translatedText: string[] }>('translate', {
    q: idx.map((i) => lines[i]),
    source: 'en',
    target: 'fr',
    format: 'text',
  })
  const out = [...lines]
  idx.forEach((i, k) => (out[i] = translatedText[k] ?? lines[i]))
  return out
}

// Dans une phrase, les cuillères restent en toutes lettres anglaises pour que le
// traducteur les rende (« tablespoon » → « cuillère à soupe ») ; le reste est
// converti en métrique avant, les nombres traversent la traduction sans dommage.
const spellSpoons = (s: string) =>
  s.replace(/\btbsps?\b\.?/gi, 'tablespoons').replace(/\btsps?\b\.?/gi, 'teaspoons')

// « § » coupe le motif de convertUnits devant les cuillères, puis disparaît.
const keepSpoons = (s: string) =>
  convertUnits(spellSpoons(s).replace(/(tablespoons?|teaspoons?)/gi, '§$1')).replace(/§/g, '')

// Ingrédients que le traducteur rend mal (« kidney beans » → « graines de rein »).
// shortcut: liste tenue à la main ; on y ajoute un nom quand une traduction déçoit.
const GLOSSARY: Record<string, string> = {
  'kidney beans': 'Haricots rouges',
  'black beans': 'Haricots noirs',
  'pinto beans': 'Haricots pinto',
  'green beans': 'Haricots verts',
  'ground beef': 'Bœuf haché',
  'ground turkey': 'Dinde hachée',
  'ground pork': 'Porc haché',
  'chili powder': 'Piment en poudre',
  'tomato paste': 'Concentré de tomate',
  'diced tomatoes': 'Tomates en dés',
  'brown sugar': 'Cassonade',
  'powdered sugar': 'Sucre glace',
  'confectioners sugar': 'Sucre glace',
  'all-purpose flour': 'Farine',
  'flour': 'Farine',
  'baking soda': 'Bicarbonate de soude',
  'baking powder': 'Levure chimique',
  'heavy cream': 'Crème liquide entière',
  'heavy whipping cream': 'Crème liquide entière',
  'sour cream': 'Crème aigre',
  'cream cheese': 'Fromage frais',
  'green onions': 'Oignons nouveaux',
  'scallions': 'Oignons nouveaux',
  'yellow onion': 'Oignon jaune',
  'cilantro': 'Coriandre fraîche',
  'bell pepper': 'Poivron',
  'red bell pepper': 'Poivron rouge',
  'zucchini': 'Courgette',
  'eggplant': 'Aubergine',
  'shrimp': 'Crevettes',
  'chicken broth': 'Bouillon de volaille',
  'chicken stock': 'Bouillon de volaille',
  'beef broth': 'Bouillon de bœuf',
  'vegetable broth': 'Bouillon de légumes',
  'garlic powder': 'Ail en poudre',
  'onion powder': 'Oignon en poudre',
  'cayenne powder': 'Piment de Cayenne',
  'cayenne pepper': 'Piment de Cayenne',
  'black pepper': 'Poivre noir',
  'kosher salt': 'Gros sel',
  'unsalted butter': 'Beurre doux',
  'cornstarch': 'Fécule de maïs',
  'vanilla extract': 'Extrait de vanille',
}

export type TranslatableRow = { name: string; description: string }
export type TranslatableRecipe<R extends TranslatableRow> = { name: string; description: string; items: R[] }

/** Traduit nom, étapes et ingrédients d'une recette anglaise. Les quantités sont
 *  converties (« 1 lb. » → « 450 g », « 2 Tbsp » → « 2 c. à soupe »), pas traduites. */
export async function translateRecipe<R extends TranslatableRow, T extends TranslatableRecipe<R>>(r: T): Promise<T> {
  const steps = r.description.split('\n').map((l) => keepSpoons(l))
  const qty: string[] = []
  const notes: string[] = []
  for (const it of r.items) {
    const comma = it.description.indexOf(', ')
    qty.push(convertUnits(comma < 0 ? it.description : it.description.slice(0, comma)))
    notes.push(comma < 0 ? '' : it.description.slice(comma + 2))
  }
  const known = r.items.map((i) => GLOSSARY[i.name.trim().toLowerCase()])
  const all = await translateMany([r.name, ...r.items.map((i, k) => (known[k] ? '' : i.name)), ...notes, ...steps])
  const n = r.items.length
  const names = all.slice(1, 1 + n)
  const trNotes = all.slice(1 + n, 1 + 2 * n)
  return {
    ...r,
    name: all[0],
    description: all.slice(1 + 2 * n).join('\n'),
    items: r.items.map((it, k) => ({
      ...it,
      name: known[k] ?? capitalize(names[k]),
      description: [qty[k], trNotes[k]].filter(Boolean).join(', '),
    })),
  }
}

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase('fr') + s.slice(1)
