// Découpe la préparation d'une recette en étapes pour le mode recette.
// Une recette importée commence par un paragraphe de présentation (« Recette
// Quiche lorraine… Notée 4.7/5 »), séparé des étapes par une ligne vide : il
// devient l'introduction. Chaque ligne restante est une étape.

export type Step = { title?: string; text: string }

// Intertitre (« Faire revenir les aromatiques ») : court, sans ponctuation finale,
// suivi d'une vraie étape. Il devient le titre de cette étape.
const isHeading = (l: string) => l.length <= 45 && !/[.!?:;)]$/.test(l)

export function splitSteps(description: string): { intro: string; steps: Step[] } {
  const text = description.replace(/\r/g, '').trim()
  const paragraphs = text.split(/\n\s*\n/)
  const intro = paragraphs.length > 1 ? paragraphs[0].trim() : ''
  const body = paragraphs.length > 1 ? paragraphs.slice(1).join('\n') : text
  const lines = body
    .split('\n')
    .map((l) => l.replace(/^\s*(?:\d+[.)]|[-•*]|étape\s*\d+\s*:?|step\s*\d+\s*:?)\s*/i, '').trim())
    .filter(Boolean)
  const steps: Step[] = []
  let title: string | undefined
  lines.forEach((l, k) => {
    if (isHeading(l) && k < lines.length - 1 && !isHeading(lines[k + 1])) title = l
    else {
      steps.push(title ? { title, text: l } : { text: l })
      title = undefined
    }
  })
  return { intro, steps }
}
