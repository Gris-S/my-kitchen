import { useEffect, useState } from 'react'
import { useApp } from '../App'
import { api, photoUrl, type Recipe } from '../api'
import { localDayToUtc, todayInput } from '../dates'
import { scaleQuantity } from '../scale'
import { detectLang, translateRecipe } from '../translate'
import { minutes } from './Recipes'
import { lang, plural, t } from '../i18n'

export default function RecipeView({ id }: { id: number }) {
  const { hh, list, notify, go } = useApp()
  const [r, setR] = useState<Recipe | null>(null)
  const [picked, setPicked] = useState<Set<number>>(new Set())
  const [planDate, setPlanDate] = useState(todayInput())
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [foreign, setForeign] = useState(false) // recette dans l'autre langue que l'interface
  const [translating, setTranslating] = useState(false)
  const [people, setPeople] = useState<number | null>(null) // null = comme la recette

  useEffect(() => {
    api.recipe(id).then(
      (rec) => {
        setR(rec)
        setPicked(new Set(rec.items.filter((i) => !i.optional).map((i) => i.id)))
        detectLang(`${rec.name}\n${rec.description ?? ''}`).then((l) => setForeign(!!l && l !== lang))
      },
      (e: Error) => notify(e.message),
    )
  }, [id, notify])

  if (!r) return <div className="page muted">{t('Chargement…', 'Loading…')}</div>

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
      notify(t(`${picked.size} ingrédient(s) ajouté(s) à la liste`, `${picked.size} ingredient(s) added to the list`), 'ok')
    } catch (e) {
      notify((e as Error).message)
    }
  }

  const plan = async () => {
    try {
      await api.plan(hh, r.id, localDayToUtc(planDate))
      notify(t('Ajoutée au planning', 'Added to the planner'), 'ok')
    } catch (e) {
      notify((e as Error).message)
    }
  }

  const translate = async () => {
    setTranslating(true)
    try {
      const done = await translateRecipe({
        name: r.name,
        description: r.description ?? '',
        items: r.items.map((i) => ({ name: i.name, description: i.description ?? '', optional: i.optional ?? false })),
      }, lang)
      setR(await api.updateRecipe(r.id, done))
      setForeign(false)
      notify(t('Recette traduite en français', 'Recipe translated to English'), 'ok')
    } catch (e) {
      notify(`${t('Traduction impossible :', 'Translation failed:')} ${(e as Error).message}`)
    } finally {
      setTranslating(false)
    }
  }

  const remove = async () => {
    try {
      await api.deleteRecipe(r.id)
      notify(t('Recette supprimée', 'Recipe deleted'), 'ok')
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
        ‹ {t('Recettes', 'Recipes')}
      </a>
      {img && <img className="hero" src={img} alt="" />}
      <h1>{r.name}</h1>
      <p className="muted">
        {[m && `${m} min`, r.yields && `${r.yields} ${t('personnes', 'servings')}`].filter(Boolean).join(' · ')}
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
          👩‍🍳 {t('Mode recette', 'Cooking mode')}
        </a>
        {foreign && (
          <button className="btn" onClick={translate} disabled={translating}>
            {translating ? t('Traduction…', 'Translating…') : t('🇫🇷 Traduire en français', '🇬🇧 Translate to English')}
          </button>
        )}
      </div>

      <section className="card">
        <div className="card-title-row">
          <h2 className="card-title">{t('Ingrédients', 'Ingredients')}</h2>
          <div className="stepper" role="group" aria-label={t('Nombre de personnes', 'Servings')}>
            <button className="icon-btn" onClick={() => setPeople(Math.max(1, count - 1))} disabled={count <= 1} aria-label={t('Une personne de moins', 'One serving less')}>
              −
            </button>
            <span className={factor !== 1 ? 'changed' : ''}>{r.yields ? `${count} ${t('pers.', 'serv.')}` : `× ${count}`}</span>
            <button className="icon-btn" onClick={() => setPeople(count + 1)} aria-label={t('Une personne de plus', 'One serving more')}>
              +
            </button>
          </div>
        </div>
        {factor !== 1 && (
          <p className="muted small pad-x">
            {t('Quantités recalculées', 'Quantities adjusted')} ({r.yields ? t(`recette prévue pour ${base}`, `recipe is for ${base}`) : t('recette telle quelle', 'original recipe')}).{' '}
            <button className="link-btn" onClick={() => setPeople(null)}>
              {t('Revenir', 'Reset')}
            </button>
          </p>
        )}
        {r.items.length === 0 && <p className="muted pad">{t('Aucun ingrédient.', 'No ingredients.')}</p>}
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
              {t(`Ajouter ${plural(picked.size, 'ingrédient', 'ingredient')} à la liste`, `Add ${plural(picked.size, 'ingrédient', 'ingredient')} to the list`)}
            </button>
          </div>
        )}
      </section>

      {r.description && (
        <section className="card">
          <h2 className="card-title">{t('Préparation', 'Method')}</h2>
          <div className="steps">{r.description}</div>
        </section>
      )}

      <section className="card">
        <h2 className="card-title">{t('Planifier', 'Plan it')}</h2>
        <div className="inline-form">
          <input type="date" value={planDate} onChange={(e) => setPlanDate(e.target.value)} aria-label={t('Jour', 'Day')} />
          <button className="btn" onClick={plan}>
            {t('Ajouter au planning', 'Add to planner')}
          </button>
        </div>
      </section>

      <div className="actions">
        <a className="btn" href={`#/recette/${r.id}/modifier`}>
          {t('Modifier', 'Edit')}
        </a>
        {confirmDelete ? (
          <>
            <button className="btn danger" onClick={remove}>
              {t('Supprimer vraiment', 'Really delete')}
            </button>
            <button className="btn" onClick={() => setConfirmDelete(false)}>
              {t('Annuler', 'Cancel')}
            </button>
          </>
        ) : (
          <button className="btn danger-text" onClick={() => setConfirmDelete(true)}>
            {t('Supprimer', 'Delete')}
          </button>
        )}
      </div>
    </div>
  )
}
