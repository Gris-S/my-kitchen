import { useEffect, useState } from 'react'
import { useApp } from '../App'
import { api, photoUrl, type Recipe } from '../api'
import { localDayToUtc, todayInput } from '../dates'
import { scaleQuantity } from '../scale'
import { isEnglish, translateRecipe } from '../translate'
import { minutes } from './Recipes'

export default function RecipeView({ id }: { id: number }) {
  const { hh, list, notify, go } = useApp()
  const [r, setR] = useState<Recipe | null>(null)
  const [picked, setPicked] = useState<Set<number>>(new Set())
  const [planDate, setPlanDate] = useState(todayInput())
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [english, setEnglish] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [people, setPeople] = useState<number | null>(null) // null = comme la recette

  useEffect(() => {
    api.recipe(id).then(
      (rec) => {
        setR(rec)
        setPicked(new Set(rec.items.filter((i) => !i.optional).map((i) => i.id)))
        isEnglish(`${rec.name}\n${rec.description ?? ''}`).then(setEnglish)
      },
      (e: Error) => notify(e.message),
    )
  }, [id, notify])

  if (!r) return <div className="page muted">Chargement…</div>

  const toggle = (itemId: number) =>
    setPicked((p) => {
      const n = new Set(p)
      if (n.has(itemId)) n.delete(itemId)
      else n.add(itemId)
      return n
    })

  // Recette sans nombre de personnes : on multiplie (× 2, × 3…) au lieu de compter des personnes.
  const base = r.yields || 1
  const count = people ?? base
  const factor = count / base
  const qty = (d?: string) => scaleQuantity(d ?? '', factor)

  const addToList = async () => {
    try {
      await api.addRecipeItems(
        list,
        r.items.filter((i) => picked.has(i.id)).map((i) => ({ ...i, description: qty(i.description) })),
      )
      notify(`${picked.size} ingrédient(s) ajouté(s) à la liste`, 'ok')
    } catch (e) {
      notify((e as Error).message)
    }
  }

  const plan = async () => {
    try {
      await api.plan(hh, r.id, localDayToUtc(planDate))
      notify('Ajoutée au planning', 'ok')
    } catch (e) {
      notify((e as Error).message)
    }
  }

  const translate = async () => {
    setTranslating(true)
    try {
      const fr = await translateRecipe({
        name: r.name,
        description: r.description ?? '',
        items: r.items.map((i) => ({ name: i.name, description: i.description ?? '', optional: i.optional ?? false })),
      })
      setR(await api.updateRecipe(r.id, fr))
      setEnglish(false)
      notify('Recette traduite en français', 'ok')
    } catch (e) {
      notify(`Traduction impossible : ${(e as Error).message}`)
    } finally {
      setTranslating(false)
    }
  }

  const remove = async () => {
    try {
      await api.deleteRecipe(r.id)
      notify('Recette supprimée', 'ok')
      go('#/recettes')
    } catch (e) {
      notify((e as Error).message)
    }
  }

  const img = photoUrl(r.photo)
  const m = minutes(r)
  let host: string | null = null
  try {
    host = r.source && /^https?:\/\//.test(r.source) ? new URL(r.source).hostname.replace(/^www\./, '') : null
  } catch {
    host = null
  }

  return (
    <div className="page">
      <a className="back" href="#/recettes">
        ‹ Recettes
      </a>
      {img && <img className="hero" src={img} alt="" />}
      <h1>{r.name}</h1>
      <p className="muted">
        {[m && `${m} min`, r.yields && `${r.yields} personnes`].filter(Boolean).join(' · ')}
        {host && (
          <>
            {' · '}
            <a href={r.source!} target="_blank" rel="noreferrer noopener">
              {host}
            </a>
          </>
        )}
      </p>

      <div className="actions">
        <a className="btn primary" href={`#/recette/${r.id}/cuisine${factor !== 1 ? `?x=${factor}` : ''}`}>
          👩‍🍳 Mode recette
        </a>
        {english && (
          <button className="btn" onClick={translate} disabled={translating}>
            {translating ? 'Traduction…' : '🇫🇷 Traduire en français'}
          </button>
        )}
      </div>

      <section className="card">
        <div className="card-title-row">
          <h2 className="card-title">Ingrédients</h2>
          <div className="stepper" role="group" aria-label="Nombre de personnes">
            <button className="icon-btn" onClick={() => setPeople(Math.max(1, count - 1))} disabled={count <= 1} aria-label="Une personne de moins">
              −
            </button>
            <span className={factor !== 1 ? 'changed' : ''}>{r.yields ? `${count} pers.` : `× ${count}`}</span>
            <button className="icon-btn" onClick={() => setPeople(count + 1)} aria-label="Une personne de plus">
              +
            </button>
          </div>
        </div>
        {factor !== 1 && (
          <p className="muted small pad-x">
            Quantités recalculées (recette prévue {r.yields ? `pour ${base}` : 'telle quelle'}).{' '}
            <button className="link-btn" onClick={() => setPeople(null)}>
              Revenir
            </button>
          </p>
        )}
        {r.items.length === 0 && <p className="muted pad">Aucun ingrédient.</p>}
        {r.items.map((i) => (
          <label key={i.id} className="row">
            <input type="checkbox" checked={picked.has(i.id)} onChange={() => toggle(i.id)} />
            <span className="row-main">{i.name}</span>
            <span className={`muted small ${factor !== 1 ? 'changed' : ''}`}>{qty(i.description)}</span>
          </label>
        ))}
        {r.items.length > 0 && (
          <div className="card-foot">
            <button className="btn primary wide" disabled={!picked.size} onClick={addToList}>
              Ajouter {picked.size} ingrédient{picked.size > 1 ? 's' : ''} à la liste
            </button>
          </div>
        )}
      </section>

      {r.description && (
        <section className="card">
          <h2 className="card-title">Préparation</h2>
          <div className="steps">{r.description}</div>
        </section>
      )}

      <section className="card">
        <h2 className="card-title">Planifier</h2>
        <div className="inline-form">
          <input type="date" value={planDate} onChange={(e) => setPlanDate(e.target.value)} aria-label="Jour" />
          <button className="btn" onClick={plan}>
            Ajouter au planning
          </button>
        </div>
      </section>

      <div className="actions">
        <a className="btn" href={`#/recette/${r.id}/modifier`}>
          Modifier
        </a>
        {confirmDelete ? (
          <>
            <button className="btn danger" onClick={remove}>
              Supprimer vraiment
            </button>
            <button className="btn" onClick={() => setConfirmDelete(false)}>
              Annuler
            </button>
          </>
        ) : (
          <button className="btn danger-text" onClick={() => setConfirmDelete(true)}>
            Supprimer
          </button>
        )}
      </div>
    </div>
  )
}
