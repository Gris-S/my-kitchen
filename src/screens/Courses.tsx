import { useCallback, useEffect, useMemo, useState } from 'react'
import { useApp } from '../App'
import { api, type Item } from '../api'
import { parseIngredient } from '../ingredients'
import { usePolling } from '../usePolling'
import { locale, t } from '../i18n'

const OTHER = t('Autres', 'Other')

export default function Courses() {
  const { hh, list, notify } = useApp()
  const [items, setItems] = useState<Item[] | null>(null)
  const [recent, setRecent] = useState<Item[]>([])
  const [text, setText] = useState('')
  const [suggestions, setSuggestions] = useState<Item[]>([])
  const [editing, setEditing] = useState<number | null>(null)
  const [hidden, setHidden] = useState<Set<number>>(new Set())
  const [confirmClear, setConfirmClear] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const [it, rec] = await Promise.all([api.items(list), api.recentItems(list)])
      setItems(it)
      setRecent(rec)
    } catch (e) {
      notify((e as Error).message)
    }
  }, [list, notify])
  usePolling(refresh, 5000)

  useEffect(() => {
    const q = parseIngredient(text).name
    if (q.length < 2) return setSuggestions([])
    const t = setTimeout(() => api.searchItems(hh, q).then((r) => setSuggestions(r.slice(0, 6)), () => {}), 200)
    return () => clearTimeout(t)
  }, [text, hh])

  const add = async (name: string, description = '') => {
    setText('')
    setSuggestions([])
    try {
      await api.addItem(list, name, description)
      await refresh()
    } catch (e) {
      notify((e as Error).message)
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    const p = parseIngredient(text)
    add(p.name, p.description)
  }

  const check = async (item: Item) => {
    setHidden((h) => new Set(h).add(item.id))
    try {
      await api.removeItem(list, item.id)
      await refresh()
    } catch (e) {
      notify((e as Error).message)
    } finally {
      setHidden((h) => {
        const n = new Set(h)
        n.delete(item.id)
        return n
      })
    }
  }

  const clearAll = async () => {
    setConfirmClear(false)
    try {
      await api.removeItems(list, (items ?? []).map((i) => i.id))
      await refresh()
      notify(t('Liste vidée', 'List cleared'), 'ok')
    } catch (e) {
      notify((e as Error).message)
    }
  }

  const saveDescription = async (item: Item, description: string) => {
    setEditing(null)
    if (description === (item.description ?? '')) return
    try {
      await api.setDescription(list, item.id, description)
      await refresh()
    } catch (e) {
      notify((e as Error).message)
    }
  }

  const groups = useMemo(() => {
    const map = new Map<string, Item[]>()
    for (const it of items ?? []) {
      if (hidden.has(it.id)) continue
      const key = it.category?.name ?? OTHER
      map.set(key, [...(map.get(key) ?? []), it])
    }
    return [...map.entries()]
      .sort(([a], [b]) => (a === OTHER ? 1 : b === OTHER ? -1 : a.localeCompare(b, locale)))
      .map(([k, v]) => [k, v.sort((x, y) => x.name.localeCompare(y.name, locale))] as const)
  }, [items, hidden])

  const onList = new Set((items ?? []).map((i) => i.id))
  const quick = recent.filter((r) => !onList.has(r.id)).slice(0, 10)

  return (
    <div className="page">
      <div className="page-head">
        <h1>{t('Courses', 'Shopping')}</h1>
        {!!items?.length &&
          (confirmClear ? (
            <div className="head-actions">
              <button className="btn danger" onClick={clearAll}>
                {t('Tout retirer', 'Remove all')} ({items.length})
              </button>
              <button className="btn" onClick={() => setConfirmClear(false)}>
                {t('Annuler', 'Cancel')}
              </button>
            </div>
          ) : (
            <button className="btn danger-text" onClick={() => setConfirmClear(true)}>
              {t('Tout retirer', 'Remove all')}
            </button>
          ))}
      </div>
      <form className="add-bar" onSubmit={submit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('Ajouter… (ex. 2 kg de pommes)', 'Add… (e.g. 2 kg apples)')}
          enterKeyHint="done"
          aria-label={t('Ajouter un article', 'Add an item')}
        />
        <button className="btn primary" disabled={!text.trim()}>
          {t('Ajouter', 'Add')}
        </button>
      </form>
      {suggestions.length > 0 && (
        <div className="chips">
          {suggestions.map((s) => (
            <button key={s.id} className="chip" onClick={() => add(s.name, parseIngredient(text).description)}>
              {s.name}
            </button>
          ))}
        </div>
      )}

      {items === null ? (
        <p className="muted">{t('Chargement…', 'Loading…')}</p>
      ) : groups.length === 0 ? (
        <p className="empty">{t('La liste est vide.', 'The list is empty.')}</p>
      ) : (
        groups.map(([cat, its]) => (
          <section key={cat} className="card">
            <h2 className="card-title">{cat}</h2>
            {its.map((it) => (
              <div key={it.id} className="row">
                <button className="check" onClick={() => check(it)} aria-label={`${t('Cocher', 'Check off')} ${it.name}`} />
                <div className="row-main" onClick={() => check(it)}>
                  <span>{it.name}</span>
                </div>
                {editing === it.id ? (
                  <input
                    className="qty-input"
                    autoFocus
                    defaultValue={it.description ?? ''}
                    onBlur={(e) => saveDescription(it, e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                    aria-label={`${t('Quantité', 'Quantity')} ${it.name}`}
                  />
                ) : (
                  <button className="qty" onClick={() => setEditing(it.id)}>
                    {it.description || t('＋ qté', '＋ qty')}
                  </button>
                )}
              </div>
            ))}
          </section>
        ))
      )}

      {quick.length > 0 && (
        <>
          <h2 className="section-title">{t('Achetés récemment', 'Recently bought')}</h2>
          <div className="chips">
            {quick.map((r) => (
              <button key={r.id} className="chip" onClick={() => add(r.name, r.description ?? '')}>
                ＋ {r.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
