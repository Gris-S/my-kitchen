import { useEffect, useRef, useState } from 'react'
import { useApp } from '../App'
import { api, type Recipe } from '../api'
import { scaleQuantity } from '../scale'
import { splitSteps } from '../steps'
import { t } from '../i18n'

/** Mode recette : plein écran, une étape à la fois, gros texte, on avance d'un
 *  geste (bouton, glisser, flèches du clavier). Étape 0 = les ingrédients. */
export default function CookMode({ id, factor = 1 }: { id: number; factor?: number }) {
  const { notify, go } = useApp()
  const [r, setR] = useState<Recipe | null>(null)
  const [i, setI] = useState(0)
  const [done, setDone] = useState<Set<number>>(new Set())
  const [showIngredients, setShowIngredients] = useState(false)
  const touchX = useRef<number | null>(null)

  useEffect(() => {
    api.recipe(id).then(setR, (e: Error) => notify(e.message))
  }, [id, notify])

  // Garder l'écran allumé. Le navigateur ne le permet qu'en HTTPS : en HTTP la
  // demande échoue sans bruit et le réglage de mise en veille du téléphone s'applique.
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null
    const take = () =>
      (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<typeof lock> } }).wakeLock
        ?.request('screen')
        .then((l) => (lock = l))
        .catch(() => {})
    take()
    const onVisible = () => document.visibilityState === 'visible' && take()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      lock?.release().catch(() => {})
    }
  }, [])

  const { intro, steps } = r ? splitSteps(r.description ?? '') : { intro: '', steps: [] }
  const total = steps.length + 1
  const next = () => setI((n) => Math.min(n + 1, total))
  const prev = () => setI((n) => Math.max(n - 1, 0))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') next()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'Escape') go(`#/recette/${id}`)
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  })

  if (!r) return <div className="cook center muted">{t('Chargement…', 'Loading…')}</div>

  const toggle = (itemId: number) =>
    setDone((d) => {
      const n = new Set(d)
      if (n.has(itemId)) n.delete(itemId)
      else n.add(itemId)
      return n
    })

  const ingredients = (
    <div className="cook-ingredients">
      {r.items.map((it) => (
        <label key={it.id} className={`cook-ing ${done.has(it.id) ? 'done' : ''}`}>
          <input type="checkbox" checked={done.has(it.id)} onChange={() => toggle(it.id)} />
          <span>{it.name}</span>
          <span className="muted">{scaleQuantity(it.description ?? '', factor)}</span>
        </label>
      ))}
    </div>
  )

  return (
    <div
      className="cook"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        touchX.current = null
        if (dx < -60) next()
        else if (dx > 60) prev()
      }}
    >
      <header className="cook-head">
        <a className="icon-btn" href={`#/recette/${id}`} aria-label={t('Quitter le mode recette', 'Leave cooking mode')}>
          ✕
        </a>
        <div className="cook-title">{r.name}</div>
        {i > 0 && (
          <button className="btn small-btn" onClick={() => setShowIngredients((s) => !s)}>
            {t('Ingrédients', 'Ingredients')}
          </button>
        )}
      </header>
      <div className="cook-progress" aria-hidden>
        <div style={{ width: `${(Math.min(i, steps.length) / Math.max(steps.length, 1)) * 100}%` }} />
      </div>

      <main className="cook-body" aria-live="polite">
        {i === 0 ? (
          <>
            <div className="cook-label">{t('Avant de commencer', 'Before you start')}</div>
            {intro && <p className="cook-intro">{intro}</p>}
            {r.items.length ? ingredients : <p className="muted">{t('Aucun ingrédient noté.', 'No ingredients listed.')}</p>}
          </>
        ) : i <= steps.length ? (
          <>
            <div className="cook-label">
              {t(`Étape ${i} sur ${steps.length}`, `Step ${i} of ${steps.length}`)}
            </div>
            {steps[i - 1].title && <h2 className="cook-step-title">{steps[i - 1].title}</h2>}
            <p className="cook-step">{steps[i - 1].text}</p>
          </>
        ) : (
          <div className="cook-end">
            <div className="cook-emoji">🍽️</div>
            <p className="cook-step">{t('Bon appétit !', 'Enjoy your meal!')}</p>
          </div>
        )}
        {steps.length === 0 && i === 0 && (
          <p className="muted">{t('Cette recette n’a pas encore d’étapes : ajoute-les dans « Modifier ».', 'This recipe has no steps yet: add them with “Edit”.')}</p>
        )}
      </main>

      {showIngredients && i > 0 && (
        <div className="cook-sheet" onClick={() => setShowIngredients(false)}>
          <div className="cook-sheet-inner" onClick={(e) => e.stopPropagation()}>
            <div className="cook-label">{t('Ingrédients', 'Ingredients')}</div>
            {ingredients}
          </div>
        </div>
      )}

      <footer className="cook-foot">
        <button className="btn cook-nav" onClick={prev} disabled={i === 0}>
          ‹ {t('Précédent', 'Previous')}
        </button>
        {i <= steps.length ? (
          <button className="btn primary cook-nav" onClick={next} disabled={steps.length === 0}>
            {i === 0 ? t('Commencer', 'Start') : i === steps.length ? t('Terminer', 'Finish') : `${t('Suivant', 'Next')} ›`}
          </button>
        ) : (
          <a className="btn primary cook-nav" href={`#/recette/${id}`}>
            {t('Fermer', 'Close')}
          </a>
        )}
      </footer>
    </div>
  )
}
