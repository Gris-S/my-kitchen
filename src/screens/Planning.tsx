import { useCallback, useState } from 'react'
import { useApp } from '../App'
import { api, photoUrl, type Planned, type Recipe } from '../api'
import { dayLabel, localDayToUtc, toInput, utcToInput } from '../dates'
import { usePolling } from '../usePolling'
import { locale, t } from '../i18n'

const nextDays = (n: number) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return toInput(d)
  })

export default function Planning() {
  const { hh, notify } = useApp()
  const [planned, setPlanned] = useState<Planned[] | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [adding, setAdding] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [p, r] = await Promise.all([api.planner(hh), api.recipes(hh)])
      setPlanned(p)
      setRecipes(r.sort((a, b) => a.name.localeCompare(b.name, locale)))
    } catch (e) {
      notify((e as Error).message)
    }
  }, [hh, notify])
  usePolling(refresh, 15000)

  const add = async (day: string, recipeId: number) => {
    setAdding(null)
    try {
      await api.plan(hh, recipeId, localDayToUtc(day))
      await refresh()
    } catch (e) {
      notify((e as Error).message)
    }
  }

  const remove = async (p: Planned) => {
    try {
      await api.unplan(hh, p.recipe_id, p.cooking_date)
      await refresh()
    } catch (e) {
      notify((e as Error).message)
    }
  }

  const days = nextDays(7)
  const later = (planned ?? []).filter((p) => !days.includes(utcToInput(p.cooking_date)))

  return (
    <div className="page">
      <h1>{t('Planning', 'Planner')}</h1>
      {planned === null && <p className="muted">{t('Chargement…', 'Loading…')}</p>}
      {planned &&
        days.map((day) => {
          const meals = planned.filter((p) => utcToInput(p.cooking_date) === day)
          return (
            <section key={day} className="card">
              <h2 className="card-title">{dayLabel(day)}</h2>
              {meals.map((p) => (
                <div key={`${p.recipe_id}-${p.cooking_date}`} className="row">
                  <a className="row-main meal" href={`#/recette/${p.recipe_id}`}>
                    {photoUrl(p.recipe.photo) && <img src={photoUrl(p.recipe.photo)!} alt="" />}
                    <span>{p.recipe.name}</span>
                  </a>
                  <button className="icon-btn" onClick={() => remove(p)} aria-label={`${t('Retirer', 'Remove')} ${p.recipe.name}`}>
                    ✕
                  </button>
                </div>
              ))}
              <div className="card-foot">
                {adding === day ? (
                  <select
                    autoFocus
                    defaultValue=""
                    onChange={(e) => e.target.value && add(day, +e.target.value)}
                    onBlur={() => setAdding(null)}
                    aria-label={t('Choisir une recette', 'Choose a recipe')}
                  >
                    <option value="" disabled>
                      {t('Choisir une recette…', 'Choose a recipe…')}
                    </option>
                    {recipes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <button className="btn" onClick={() => setAdding(day)} disabled={!recipes.length}>
                    ＋ {t('Repas', 'Meal')}
                  </button>
                )}
              </div>
            </section>
          )
        })}
      {later.length > 0 && (
        <section className="card">
          <h2 className="card-title">{t('Autres jours', 'Other days')}</h2>
          {later.map((p) => (
            <div key={`${p.recipe_id}-${p.cooking_date}`} className="row">
              <a className="row-main" href={`#/recette/${p.recipe_id}`}>
                {p.recipe.name}
              </a>
              <span className="muted small">{p.cooking_date ? dayLabel(utcToInput(p.cooking_date)) : ''}</span>
              <button className="icon-btn" onClick={() => remove(p)} aria-label={`${t('Retirer', 'Remove')} ${p.recipe.name}`}>
                ✕
              </button>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
