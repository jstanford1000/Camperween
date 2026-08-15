import type { ReactNode } from "react"

/**
 * Renders **text** wrapped in double asterisks as <strong>, for content
 * pulled from the YAML files where site owners want to bold a phrase
 * without touching code.
 */
export function renderBoldText(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}
