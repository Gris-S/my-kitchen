import { useCallback, useMemo, useState } from 'react'
import { useApp } from '../App'
import { api, photoUrl, type Recipe } from '../api'
import { usePolling } from '../usePolling'
import { locale, t } from '../i18n'

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
      .sort((a, b) => a.name.localeCompare(b.name, locale))
  }, [recipes, q])

  return (
    <div className="page">
      <div className="page-head">
        <h1>{t('Recettes', 'Recipes')}</h1>
        <div className="head-actions">
          <a className="btn primary" href="#/importer">
            {t('Importer un lien', 'Import a link')}
          </a>
          <a className="btn" href="#/nouvelle">
            {t('Nouvelle', 'New')}
          </a>
        </div>
      </div>
      <input
        className="search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('Chercher une recette ou un ingrédient', 'Search a recipe or an ingredient')}
        aria-label={t('Chercher', 'Search')}
      />
      {recipes === null ? (
        <p className="muted">{t('Chargement…', 'Loading…')}</p>
      ) : shown.length === 0 ? (
        <p className="empty">{q ? t('Aucune recette ne correspond.', 'No recipe matches.') : t('Aucune recette pour l’instant.', 'No recipes yet.')}</p>
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
                    {[m && `${m} min`, r.yields && `${r.yields} ${t('pers.', 'serv.')}`].filter(Boolean).join(' · ')}
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
