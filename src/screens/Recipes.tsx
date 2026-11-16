import { useCallback, useMemo, useState } from 'react'
import { useApp } from '../App'
import { api, photoUrl, type Recipe } from '../api'
import { usePolling } from '../usePolling'

export const minutes = (r: Pick<Recipe, 'time' | 'cook_time' | 'prep_time'>) =>
  r.time || (r.cook_time ?? 0) + (r.prep_time ?? 0) || null

const fold = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export default function Recipes() {
  const { hh, notify } = useApp()
  const [recipes, setRecipes] = useState<Recipe[] | null>(null)
  const [q, setQ] = useState('')

  const refresh = useCallback(
    () => api.recipes(hh).then(setRecipes, (e: Error) => notify(e.message)),
    [hh, notify],
  )
  usePolling(refresh, 30000)

  const shown = useMemo(() => {
    const f = fold(q.trim())
    return (recipes ?? [])
      .filter((r) => !f || fold(r.name).includes(f) || r.items?.some((i) => fold(i.name).includes(f)))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }, [recipes, q])

  return (
    <div className="page">
      <div className="page-head">
        <h1>Recettes</h1>
        <div className="head-actions">
          <a className="btn primary" href="#/importer">
            Importer un lien
          </a>
          <a className="btn" href="#/nouvelle">
            Nouvelle
          </a>
        </div>
      </div>
      <input
        className="search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Chercher une recette ou un ingrédient"
        aria-label="Chercher"
      />
      {recipes === null ? (
        <p className="muted">Chargement…</p>
      ) : shown.length === 0 ? (
        <p className="empty">{q ? 'Aucune recette ne correspond.' : 'Aucune recette pour l’instant.'}</p>
      ) : (
        <div className="grid">
          {shown.map((r) => {
            const img = photoUrl(r.photo)
            const m = minutes(r)
            return (
              <a key={r.id} className="recipe-card" href={`#/recette/${r.id}`}>
                <div className="thumb">{img ? <img src={img} alt="" loading="lazy" /> : <span>🍽️</span>}</div>
                <div className="recipe-card-body">
                  <div className="recipe-name">{r.name}</div>
                  <div className="muted small">
                    {[m && `${m} min`, r.yields && `${r.yields} pers.`].filter(Boolean).join(' · ')}
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
