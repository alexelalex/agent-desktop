import { useCallback, useLayoutEffect, useState, useSyncExternalStore, type RefObject } from 'react'

const PREFIX = 'agent-desktop.width.'

function stored(key: string, fallback: number) {
  try {
    const value = Number(localStorage.getItem(PREFIX + key))
    return value > 0 ? value : fallback
  } catch {
    return fallback
  }
}

/** A width the user drags, kept across launches. */
export function useStoredWidth(key: string, fallback: number) {
  const [width, setWidth] = useState(() => stored(key, fallback))
  const save = (next: number) => {
    setWidth(next)
    try {
      localStorage.setItem(PREFIX + key, String(Math.round(next)))
    } catch {
      // Storage unavailable (private mode): the width lives for this window only.
    }
  }
  return [width, save] as const
}

/** The element's width, measured before paint and on every resize. */
export function useElementWidth(ref: RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState<number>()
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    setWidth(element.getBoundingClientRect().width)
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])
  return width
}

/** Below Tailwind's `sm`: the session list and a session take turns at the full width. */
export const XS = '(max-width: 639.98px)'

/** Whether the media query matches, kept current. */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (change: () => void) => {
      const list = matchMedia(query)
      list.addEventListener('change', change)
      return () => list.removeEventListener('change', change)
    },
    [query],
  )
  return useSyncExternalStore(subscribe, () => matchMedia(query).matches)
}
