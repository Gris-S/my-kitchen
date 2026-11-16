import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../App'
import { api, photoUrl, type Recipe } from '../api'
import { ingredientEmoji } from '../emoji'
import { buildTiles, norm, rankRecipes } from '../fridge'
import { plural, t } from '../i18n'

/** Frigo en tuiles : une tuile par ingrédient de tes recettes, de A à Z. Tu
 *  touches ce que tu as, les recettes se classent de la plus complète à la moins
 *  complète. Rien n'est gardé d'une visite à l'autre (choix de l'utilisateur). */
export default function Fridge() {
  const { hh, list, notify } = useApp()
  const [recipes, setRecipes] = useState<Recipe[] | null>(null)
  const [picked, setPicked] = useState<Map<string, string>>(new Map()) // clé → nom affiché
  const [filter, setFilter] = useState('')

  useEffect(() => {
    api.recipes(hh).then(setRecipes, (e: Error) => notify(e.message))
  }, [hh, notify])

  const tiles = useMemo(() => buildTiles(recipes ?? []), [recipes])
  const shown = useMemo(() => {
    const f = norm(filter.trim())
    return f ? tiles.filter((t) => t.key.includes(f) || norm(t.name).includes(f)) : tiles
  }, [tiles, filter])

  const matches = useMemo(() => rankRecipes(recipes ?? [], [...picked.values()]).slice(0, 12), [recipes, picked])

  const toggle = (key: string, name: string) =>
    setPicked((p) => {
      const n = new Map(p)
      if (n.has(key)) n.delete(key)
      else n.set(key, name)
      return n
    })

  const addMissing = async (missing: string[]) => {
    try {
      for (const name of missing) await api.addItem(list, name)
      notify(t(`${plural(missing.length, 'ingrédient', 'ingredient')} ajouté${missing.length > 1 ? 's' : ''} à la liste`, `${plural(missing.length, 'ingrédient', 'ingredient')} added to the list`), 'ok')
    } catch (e) {
      notify((e as Error).message)
    }
  }

  return (
    <div className="page">
      <h1>{t('Frigo', 'Fridge')}</h1>
      <p className="muted">{t('Touche ce que tu as : les recettes qui collent le mieux apparaissent en dessous. Sel, poivre, eau et huile sont comptés comme toujours là.', 'Tap what you have: the best matching recipes show up below. Salt, pepper, water and oil are assumed.')}</p>

      <input
        className="search"
        type="search"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder={t('Chercher un ingrédient', 'Search an ingredient')}
        aria-label={t('Chercher un ingrédient', 'Search an ingredient')}
      />

      {picked.size > 0 && (
        <div className="fridge-bar">
          <span>
            {t(`${picked.size} sélectionné${picked.size > 1 ? 's' : ''}`, `${picked.size} selected`)}
          </span>
          {matches.length > 0 && (
            <button className="btn primary small-btn" onClick={() => document.getElementById('frigo-resultats')?.scrollIntoView({ behavior: 'smooth' })}>
              {t('Voir', 'See')} {plural(matches.length, 'recette', 'recipe')}
            </button>
          )}
          <button className="link-btn" onClick={() => setPicked(new Map())}>
            {t('Tout désélectionner', 'Clear selection')}
          </button>
        </div>
      )}

      {recipes === null ? (
        <p className="muted">{t('Chargement…', 'Loading…')}</p>
      ) : tiles.length === 0 ? (
        <p className="empty">{t('Aucun ingrédient : ajoute d’abord des recettes.', 'No ingredients: add some recipes first.')}</p>
      ) : shown.length === 0 ? (
        <p className="empty">{t('Aucun ingrédient ne correspond à', 'No ingredient matches')} « {filter} ».</p>
      ) : (
        <div className="tile-grid">
          {shown.map((t) => (
            <button
              key={t.key}
              className={`tile ${picked.has(t.key) ? 'picked' : ''}`}
              aria-pressed={picked.has(t.key)}
              onClick={() => toggle(t.key, t.name)}
            >
              <span className="tile-emoji" aria-hidden>
                {ingredientEmoji(t.name)}
              </span>
              <span className="tile-name">{t.name}</span>
              {picked.has(t.key) && (
                <span className="tile-check" aria-hidden>
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {picked.size > 0 && (
        <>
          <h2 className="section-title" id="frigo-resultats">
            {t('Recettes possibles', 'Possible recipes')}
          </h2>
          {matches.length === 0 ? (
            <p className="empty">{t('Aucune recette n’utilise ces ingrédients.', 'No recipe uses these ingredients.')}</p>
          ) : (
            matches.map((m) => {
              const img = photoUrl(m.recipe.photo)
              const pct = Math.round(m.score * 100)
              return (
                <section key={m.recipe.id} className="card fridge-match">
                  <a className="fridge-head" href={`#/recette/${m.recipe.id}`}>
                    <div className="fridge-thumb">{img ? <img src={img} alt="" loading="lazy" /> : <span>🍽️</span>}</div>
                    <div className="fridge-info">
                      <div className="recipe-name">{m.recipe.name}</div>
                      <div className={`fridge-score ${pct === 100 ? 'full' : ''}`}>
                        {pct === 100
                          ? t('Tu as tout !', 'You have everything!')
                          : t(`Tu as ${m.have.length} ingrédient${m.have.length > 1 ? 's' : ''} sur ${m.have.length + m.missing.length}`, `You have ${m.have.length} of ${m.have.length + m.missing.length} ingredients`)}
                      </div>
                      <div className="meter" aria-hidden>
                        <div style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </a>
                  {m.missing.length > 0 && (
                    <div className="fridge-missing">
                      <span className="muted small">{t('Il manque :', 'Missing:')} {m.missing.join(', ')}</span>
                      <button className="btn small-btn" onClick={() => addMissing(m.missing)}>
                        {t('Ajouter aux courses', 'Add to shopping list')}
                      </button>
                    </div>
                  )}
                </section>
              )
            })
          )}
        </>
      )}
    </div>
  )
}
