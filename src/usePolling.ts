import { useEffect } from 'react'

/** Lance `fn` tout de suite, puis toutes les `ms` tant que la page est visible,
 *  et dès qu'on revient sur l'onglet : la liste suit ce que les autres modifient. */
export function usePolling(fn: () => void, ms: number) {
  useEffect(() => {
    fn()
    const id = setInterval(() => document.visibilityState === 'visible' && fn(), ms)
    const onVisible = () => document.visibilityState === 'visible' && fn()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [fn, ms])
}
