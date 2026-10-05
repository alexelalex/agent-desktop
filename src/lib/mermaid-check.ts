import { mermaid } from '@streamdown/mermaid'

// ui_render_artifact asks the window whether diagrams render: mermaid ships in this bundle only.

declare global {
  interface Window {
    checkMermaid?: (sources: string[]) => Promise<(string | null)[]>
  }
}

let checks = 0

// The plugin exposes render alone; with error rendering suppressed, a bad diagram throws.
window.checkMermaid = async sources => {
  const instance = mermaid.getMermaid()
  const errors: (string | null)[] = []
  for (const source of sources) {
    try {
      await instance.render(`mermaid-check-${++checks}`, source)
      errors.push(null)
    } catch (error) {
      errors.push(
        String((error as Error)?.message ?? error)
          .split('\n')
          .slice(0, 4)
          .join(' '),
      )
    }
  }
  return errors
}
