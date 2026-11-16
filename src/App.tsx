import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, type Household } from './api'
import CookMode from './screens/CookMode'
import Courses from './screens/Courses'
import Fridge from './screens/Fridge'
import Planning from './screens/Planning'
import RecipeEditor from './screens/RecipeEditor'
import RecipeView from './screens/RecipeView'
import Recipes from './screens/Recipes'
import { t, setLang, lang } from './i18n'

type Ctx = {
  hh: number
  list: number
  notify: (msg: string, kind?: 'error' | 'ok') => void
  go: (hash: string) => void
}
const AppCtx = createContext<Ctx>(null!)
export const useApp = () => useContext(AppCtx)

const useHash = () => {
  const [hash, setHash] = useState(location.hash || '#/courses')
  useEffect(() => {
    const on = () => setHash(location.hash || '#/courses')
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])
  return hash
}

const TABS = [
  { hash: '#/courses', label: t('Courses', 'Shopping'), icon: '🛒' },
  { hash: '#/recettes', label: t('Recettes', 'Recipes'), icon: '📖' },
  { hash: '#/frigo', label: t('Frigo', 'Fridge'), icon: '🧊' },
  { hash: '#/planning', label: t('Planning', 'Planner'), icon: '📅' },
]

export default function App() {
  const hash = useHash()
  const [household, setHousehold] = useState<Household | null>(null)
  const [fatal, setFatal] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; kind: 'error' | 'ok' } | null>(null)

  const load = useCallback(() => {
    setFatal(null)
    api
      .households()
      .then((hs) => {
        if (!hs.length) return setFatal(t("Aucun foyer n'existe dans KitchenOwl.", 'There is no household in KitchenOwl yet.'))
        // Foyer choisi sur cet appareil (mk-household), sinon le premier.
        let wanted = NaN
        try {
          wanted = Number(localStorage.getItem('mk-household'))
        } catch {
          // stockage indisponible
        }
        setHousehold(hs.find((h) => h.id === wanted) ?? hs[0])
      })
      .catch((e: Error) => setFatal(e.message))
  }, [])
  useEffect(load, [load])

  const notify = useCallback((msg: string, kind: 'error' | 'ok' = 'error') => {
    setToast({ msg, kind })
    setTimeout(() => setToast((cur) => (cur?.msg === msg ? null : cur)), kind === 'error' ? 6000 : 2500)
  }, [])
  const go = useCallback((h: string) => {
    location.hash = h
  }, [])

  if (fatal)
    return (
      <div className="center">
        <p className="error-text">{fatal}</p>
        <button className="btn primary" onClick={load}>
          {t('Réessayer', 'Try again')}
        </button>
      </div>
    )
  if (!household) return <div className="center muted">{t('Chargement…', 'Loading…')}</div>

  const [path, query = ''] = hash.split('?')
  const [, section, id, action] = path.split('/')
  const params = new URLSearchParams(query)
  let screen
  if (section === 'recettes') screen = <Recipes />
  else if (section === 'planning') screen = <Planning />
  else if (section === 'frigo') screen = <Fridge />
  else if (section === 'nouvelle') screen = <RecipeEditor key="new" />
  else if (section === 'importer') screen = <RecipeEditor key="import" importMode />
  else if (section === 'recette' && action === 'modifier') screen = <RecipeEditor key={id} recipeId={+id} />
  else if (section === 'recette' && action === 'cuisine') screen = <CookMode key={id} id={+id} factor={Number(params.get('x')) || 1} />
  else if (section === 'recette') screen = <RecipeView key={id} id={+id} />
  else screen = <Courses />

  const activeTab = section === 'recette' || section === 'nouvelle' || section === 'importer' ? 'recettes' : section

  return (
    <AppCtx.Provider value={{ hh: household.id, list: household.default_shopping_list.id, notify, go }}>
      <div className={`shell ${action === 'cuisine' ? 'fullscreen' : ''}`}>
        <nav className="tabs">
          <div className="brand">MY KITCHEN</div>
          {TABS.map((t) => (
            <a key={t.hash} href={t.hash} className={`tab ${'#/' + activeTab === t.hash ? 'active' : ''}`}>
              <span className="tab-icon" aria-hidden>
                {t.icon}
              </span>
              {t.label}
            </a>
          ))}
          <button
            className="lang-switch"
            onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
            aria-label={t('Passer en anglais', 'Switch to French')}
            title={t('Passer en anglais', 'Switch to French')}
          >
            {lang === 'fr' ? 'EN' : 'FR'}
          </button>
        </nav>
        <main className="content">{screen}</main>
        {toast && (
          <div className={`toast ${toast.kind}`} role="status" onClick={() => setToast(null)}>
            {toast.msg}
          </div>
        )}
      </div>
    </AppCtx.Provider>
  )
}
