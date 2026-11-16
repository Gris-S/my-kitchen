// Accès au serveur KitchenOwl. Toutes les requêtes passent par /api, que le
// serveur de MY KITCHEN (nginx, ou Vite en développement) relaie vers
// KitchenOwl en y ajoutant le jeton permanent : aucune connexion ici.

export type Category = { id: number; name: string; ordering: number }
export type Item = {
  id: number
  name: string
  description?: string
  category?: Category | null
  category_id?: number | null
  optional?: boolean
}
export type Recipe = {
  id: number
  name: string
  description: string
  photo: string | null
  time: number | null
  cook_time: number | null
  prep_time: number | null
  yields: number | null
  source: string | null
  items: Item[]
  tags?: { id: number; name: string }[]
}
export type Household = { id: number; name: string; default_shopping_list: { id: number } }
export type Planned = { cooking_date: number; recipe: Recipe; recipe_id: number }
export type ScrapeResult = {
  recipe: Partial<Recipe>
  items: Record<string, Item | null>
}
export type RecipeInput = {
  name: string
  description: string
  time?: number
  cook_time?: number
  prep_time?: number
  yields?: number
  source?: string
  photo?: string
  items: { name: string; description: string; optional: boolean }[]
}

export class ApiError extends Error {}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('Le serveur KitchenOwl ne répond pas. Le NAS est-il allumé ?')
  }
  if (res.status === 401) throw new ApiError('KitchenOwl a refusé le jeton. Vérifie KITCHENOWL_TOKEN sur le NAS.')
  if (!res.ok) {
    const text = (await res.text()).slice(0, 200)
    throw new ApiError(`KitchenOwl a répondu une erreur ${res.status}${text ? ` : ${text}` : ''}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  households: () => call<Household[]>('GET', '/household'),

  items: (list: number) => call<Item[]>('GET', `/shoppinglist/${list}/items`),
  recentItems: (list: number) => call<Item[]>('GET', `/shoppinglist/${list}/recent-items?limit=12`),
  searchItems: (hh: number, q: string) =>
    call<Item[]>('GET', `/household/${hh}/item/search?query=${encodeURIComponent(q)}`),
  addItem: (list: number, name: string, description = '') =>
    call<Item>('POST', `/shoppinglist/${list}/add-item-by-name`, { name, description }),
  setDescription: (list: number, item: number, description: string) =>
    call('POST', `/shoppinglist/${list}/item/${item}`, { description }),
  removeItem: (list: number, item: number) => call('DELETE', `/shoppinglist/${list}/item`, { item_id: item }),
  removeItems: (list: number, items: number[]) =>
    call('DELETE', `/shoppinglist/${list}/items`, { items: items.map((item_id) => ({ item_id })) }),
  addRecipeItems: (list: number, items: Item[]) =>
    call('POST', `/shoppinglist/${list}/recipeitems`, {
      items: items.map((i) => ({ id: i.id, name: i.name, description: i.description ?? '' })),
    }),

  recipes: (hh: number) => call<Recipe[]>('GET', `/household/${hh}/recipe`),
  recipe: (id: number) => call<Recipe>('GET', `/recipe/${id}`),
  createRecipe: (hh: number, r: RecipeInput) => call<Recipe>('POST', `/household/${hh}/recipe`, r),
  updateRecipe: (id: number, r: RecipeInput) => call<Recipe>('POST', `/recipe/${id}`, r),
  deleteRecipe: (id: number) => call('DELETE', `/recipe/${id}`),
  setPhoto: (id: number, photo: string) => call<Recipe>('POST', `/recipe/${id}`, { photo }),
  scrape: (hh: number, url: string) => call<ScrapeResult>('POST', `/household/${hh}/recipe/scrape`, { url }),

  planner: (hh: number) => call<Planned[]>('GET', `/household/${hh}/planner`),
  plan: (hh: number, recipe_id: number, cooking_date: number) =>
    call('POST', `/household/${hh}/planner/recipe`, { recipe_id, cooking_date }),
  unplan: (hh: number, recipe_id: number, cooking_date: number) =>
    call('DELETE', `/household/${hh}/planner/recipe/${recipe_id}`, { cooking_date }),
}

/** Envoie une photo à KitchenOwl ; renvoie le nom de fichier à mettre dans `photo`. */
export async function uploadPhoto(file: File): Promise<string> {
  const body = new FormData()
  body.append('file', file)
  let res: Response
  try {
    res = await fetch('/api/upload', { method: 'POST', body })
  } catch {
    throw new ApiError("La photo n'a pas pu être envoyée : le serveur ne répond pas.")
  }
  const data = res.ok ? ((await res.json()) as { filename?: string }) : null
  if (!data?.filename) throw new ApiError('KitchenOwl a refusé la photo (formats acceptés : JPG, PNG, WebP).')
  return data.filename
}

/** Le site a refusé que KitchenOwl télécharge sa photo : MY KITCHEN la récupère
 *  par son propre serveur (comme un navigateur) puis l'envoie à KitchenOwl.
 *  Renvoie le nom du fichier enregistré, ou null si ce n'est pas possible. */
export async function rescuePhoto(url: string): Promise<string | null> {
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return null
  }
  const ext = /\.(jpe?g|png|webp)$/i.exec(u.pathname)?.[1]
  if (u.protocol !== 'https:' || !ext) return null
  try {
    const res = await fetch(`/photo-externe/${u.hostname}${u.pathname}`)
    const blob = res.ok ? await res.blob() : null
    if (!blob || !blob.type.startsWith('image/')) return null
    return await uploadPhoto(new File([blob], `photo.${ext.toLowerCase()}`, { type: blob.type }))
  } catch {
    return null
  }
}

/** Adresse affichable d'une photo : KitchenOwl garde les siennes dans /api/upload. */
export const photoUrl = (photo: string | null | undefined) =>
  !photo ? null : /^https?:/.test(photo) ? photo : `/api/upload/${encodeURIComponent(photo)}`
