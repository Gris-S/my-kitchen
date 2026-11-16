import { useEffect, useState } from 'react'
import { useApp } from '../App'
import { api, photoUrl, rescuePhoto, uploadPhoto, type RecipeInput, type ScrapeResult } from '../api'
import { parseIngredient } from '../ingredients'
import { isEnglish, translateRecipe } from '../translate'

type Row = { key: number; name: string; description: string; optional: boolean }
type Draft = Omit<RecipeInput, 'items'> & { items: Row[] }

let nextKey = 1
const row = (name = '', description = '', optional = false): Row => ({ key: nextKey++, name, description, optional })
const empty = (): Draft => ({ name: '', description: '', items: [row()] })

/** Ce que renvoie KitchenOwl après lecture d'une page : on garde le nom de
 *  l'article qu'il a reconnu, sinon on découpe nous-mêmes la ligne. */
export function draftFromScrape(s: ScrapeResult): Draft {
  const r = s.recipe
  return {
    name: r.name ?? '',
    description: r.description ?? '',
    time: r.time ?? undefined,
    cook_time: r.cook_time ?? undefined,
    prep_time: r.prep_time ?? undefined,
    yields: r.yields ?? undefined,
    source: r.source ?? undefined,
    photo: r.photo ?? undefined,
    items: Object.entries(s.items).map(([line, match]) => {
      const p = parseIngredient(line)
      return row(match?.name ?? p.name, p.description, match?.optional ?? false)
    }),
  }
}

const num = (v: string) => (v === '' ? undefined : Math.max(0, Math.round(Number(v)) || 0))

export default function RecipeEditor({ recipeId, importMode }: { recipeId?: number; importMode?: boolean }) {
  const { hh, notify, go } = useApp()
  const [draft, setDraft] = useState<Draft | null>(importMode ? null : recipeId ? null : empty())
  const [url, setUrl] = useState('')
  const [reading, setReading] = useState(false)
  const [readError, setReadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [original, setOriginal] = useState<Draft | null>(null) // version anglaise, si traduite
  const [translated, setTranslated] = useState<Draft | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!recipeId) return
    api.recipe(recipeId).then(
      (r) =>
        setDraft({
          name: r.name,
          description: r.description ?? '',
          time: r.time ?? undefined,
          cook_time: r.cook_time ?? undefined,
          prep_time: r.prep_time ?? undefined,
          yields: r.yields ?? undefined,
          source: r.source ?? undefined,
          photo: r.photo ?? undefined,
          items: r.items.map((i) => row(i.name, i.description ?? '', i.optional ?? false)),
        }),
      (e: Error) => notify(e.message),
    )
  }, [recipeId, notify])

  const read = async (e: React.FormEvent) => {
    e.preventDefault()
    setReading(true)
    setReadError(null)
    setOriginal(null)
    setTranslated(null)
    try {
      const d = draftFromScrape(await api.scrape(hh, url.trim()))
      setDraft(d)
      // Recette en anglais : traduite et convertie en mesures françaises d'office.
      if (await isEnglish(`${d.name}\n${d.description}`)) {
        try {
          const fr = await translateRecipe(d)
          setOriginal(d)
          setTranslated(fr)
          setDraft(fr)
        } catch {
          notify("Recette en anglais, mais le traducteur ne répond pas : elle reste en anglais.")
        }
      }
    } catch (err) {
      const msg = (err as Error).message
      setReadError(
        /Unsupported website|400/.test(msg)
          ? "KitchenOwl n'a pas trouvé de recette sur cette page. Vérifie le lien, ou saisis la recette à la main."
          : msg,
      )
    } finally {
      setReading(false)
    }
  }

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    try {
      const name = await uploadPhoto(file)
      set({ photo: name })
    } catch (e) {
      notify((e as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const set = (patch: Partial<Draft>) => setDraft((d) => d && { ...d, ...patch })
  const setRow = (key: number, patch: Partial<Row>) =>
    setDraft((d) => d && { ...d, items: d.items.map((r) => (r.key === key ? { ...r, ...patch } : r)) })

  const save = async () => {
    if (!draft) return
    if (!draft.name.trim()) return notify('Donne un nom à la recette.')
    const items = draft.items
      .filter((r) => r.name.trim())
      .map(({ name, description, optional }) => ({ name: name.trim(), description: description.trim(), optional }))
    // Deux lignes du même article : KitchenOwl n'en garde qu'une, on réunit les quantités.
    const merged = new Map<string, (typeof items)[number]>()
    for (const it of items) {
      const k = it.name.toLowerCase()
      const prev = merged.get(k)
      merged.set(k, prev ? { ...prev, description: [prev.description, it.description].filter(Boolean).join(' + ') } : it)
    }
    const body: RecipeInput = { ...draft, name: draft.name.trim(), items: [...merged.values()] }
    setSaving(true)
    try {
      const saved = recipeId ? await api.updateRecipe(recipeId, body) : await api.createRecipe(hh, body)
      let photoLost = false
      if (body.photo && /^https?:/.test(body.photo) && !saved.photo) {
        const name = await rescuePhoto(body.photo)
        if (name) await api.setPhoto(saved.id, name)
        else photoLost = true
      }
      if (photoLost)
        notify("Recette enregistrée, mais le site n'a pas laissé récupérer sa photo. Ajoute-la avec « Modifier ».")
      else notify('Recette enregistrée', 'ok')
      go(`#/recette/${saved.id}`)
    } catch (e) {
      notify((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const title = recipeId ? 'Modifier la recette' : importMode ? 'Importer une recette' : 'Nouvelle recette'
  const img = photoUrl(draft?.photo)

  return (
    <div className="page">
      <a className="back" href={recipeId ? `#/recette/${recipeId}` : '#/recettes'}>
        ‹ Retour
      </a>
      <h1>{title}</h1>

      {importMode && (
        <form className="card pad" onSubmit={read}>
          <label className="field">
            <span>Lien de la recette (Marmiton, 750g, blog…)</span>
            <input
              type="url"
              inputMode="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.marmiton.org/recettes/…"
            />
          </label>
          <button className="btn primary wide" disabled={reading || !url.trim()}>
            {reading ? 'Lecture de la page…' : draft ? 'Relire la page' : 'Lire la recette'}
          </button>
          {readError && <p className="error-text">{readError}</p>}
        </form>
      )}

      {draft && (
        <>
          {original && translated && (
            <div className="card pad notice">
              {draft === original ? 'Version originale (anglais).' : 'Traduite de l’anglais, mesures converties.'}{' '}
              <button className="link-btn" onClick={() => setDraft(draft === original ? translated : original)}>
                {draft === original ? 'Revoir en français' : 'Voir l’original'}
              </button>
            </div>
          )}
          <section className="card pad">
            <div className="photo-edit">
              <div className="photo-box">{img ? <img src={img} alt="" /> : <span>🍽️</span>}</div>
              <div className="photo-actions">
                <label className="btn">
                  {uploading ? 'Envoi…' : img ? 'Changer la photo' : 'Ajouter une photo'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    disabled={uploading}
                    onChange={(e) => pickPhoto(e.target.files?.[0])}
                  />
                </label>
                {img && (
                  <button className="btn danger-text" onClick={() => set({ photo: '' })}>
                    Retirer
                  </button>
                )}
                <input
                  type="url"
                  placeholder="…ou coller l’adresse d’une image"
                  aria-label="Adresse d’une image"
                  onKeyDown={(e) => {
                    const v = (e.target as HTMLInputElement).value.trim()
                    if (e.key === 'Enter' && /^https?:\/\//.test(v)) {
                      e.preventDefault()
                      set({ photo: v })
                    }
                  }}
                  onBlur={(e) => /^https?:\/\//.test(e.target.value.trim()) && set({ photo: e.target.value.trim() })}
                />
              </div>
            </div>
          </section>
          <div className="card pad">
            <label className="field">
              <span>Nom</span>
              <input value={draft.name} onChange={(e) => set({ name: e.target.value })} />
            </label>
            <div className="field-row">
              <label className="field">
                <span>Préparation (min)</span>
                <input inputMode="numeric" value={draft.prep_time ?? ''} onChange={(e) => set({ prep_time: num(e.target.value) })} />
              </label>
              <label className="field">
                <span>Cuisson (min)</span>
                <input inputMode="numeric" value={draft.cook_time ?? ''} onChange={(e) => set({ cook_time: num(e.target.value) })} />
              </label>
              <label className="field">
                <span>Personnes</span>
                <input inputMode="numeric" value={draft.yields ?? ''} onChange={(e) => set({ yields: num(e.target.value) })} />
              </label>
            </div>
          </div>

          <section className="card">
            <h2 className="card-title">Ingrédients</h2>
            {draft.items.map((r) => (
              <div key={r.key} className="row edit-row">
                <input
                  className="grow"
                  value={r.name}
                  placeholder="Ingrédient"
                  onChange={(e) => setRow(r.key, { name: e.target.value })}
                  aria-label="Ingrédient"
                />
                <input
                  className="qty-field"
                  value={r.description}
                  placeholder="Quantité"
                  onChange={(e) => setRow(r.key, { description: e.target.value })}
                  aria-label="Quantité"
                />
                <button
                  className="icon-btn"
                  onClick={() => set({ items: draft.items.filter((x) => x.key !== r.key) })}
                  aria-label={`Retirer ${r.name}`}
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="card-foot">
              <button className="btn" onClick={() => set({ items: [...draft.items, row()] })}>
                ＋ Ingrédient
              </button>
            </div>
          </section>

          <section className="card pad">
            <label className="field">
              <span>Préparation</span>
              <textarea rows={10} value={draft.description} onChange={(e) => set({ description: e.target.value })} />
            </label>
          </section>

          <div className="actions sticky">
            <button className="btn primary wide" disabled={saving} onClick={save}>
              {saving ? 'Enregistrement…' : 'Enregistrer la recette'}
            </button>
          </div>
        </>
      )}
      {!draft && recipeId && <p className="muted">Chargement…</p>}
    </div>
  )
}
