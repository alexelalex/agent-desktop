import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'

// Must match the key read by the pre-paint script in index.html.
const STORAGE_KEY = 'agent-desktop.theme'
const listeners = new Set<() => void>()
let current: Theme = document.documentElement.classList.contains('dark')
  ? 'dark'
  : 'light'

export function setTheme(next: Theme) {
  current = next
  document.documentElement.classList.toggle('dark', next === 'dark')
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // Storage unavailable (private mode): the choice lives for this tab only.
  }
  listeners.forEach(listener => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, () => current)
}
