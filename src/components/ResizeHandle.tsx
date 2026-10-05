import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const STEP = 16

/** Drags the width of its parent, which must be `relative`, from the parent's `edge`. */
export function ResizeHandle(props: {
  label: string
  edge: 'left' | 'right'
  width: number
  min: number
  max: number
  onResize: (width: number) => void
}) {
  const { label, edge, width, min, max, onResize } = props
  const sign = edge === 'right' ? 1 : -1
  const clamp = (next: number) => Math.min(Math.max(next, min), Math.max(min, max))
  const start = useRef<{ x: number; width: number }>(undefined)
  const [dragging, setDragging] = useState(false)
  const end = () => {
    start.current = undefined
    setDragging(false)
  }

  // Keeps the cursor and stops text selection while the pointer is off the handle.
  useEffect(() => {
    if (!dragging) return
    document.documentElement.classList.add('resizing')
    return () => document.documentElement.classList.remove('resizing')
  }, [dragging])

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={Math.round(width)}
      aria-valuemin={min}
      aria-valuemax={Math.max(min, max)}
      tabIndex={0}
      data-dragging={dragging || undefined}
      className={cn(
        'absolute inset-y-0 z-10 w-2 cursor-col-resize touch-none outline-none',
        'before:absolute before:inset-y-0 before:left-1/2 before:w-0.5 before:-translate-x-1/2 before:transition-colors',
        'hover:before:bg-ring/50 focus-visible:before:bg-ring data-dragging:before:bg-ring',
        edge === 'right' ? '-right-1' : '-left-1',
      )}
      onPointerDown={event => {
        if (event.button !== 0) return
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        start.current = { x: event.clientX, width }
        setDragging(true)
      }}
      onPointerMove={event => {
        if (!start.current) return
        onResize(clamp(start.current.width + sign * (event.clientX - start.current.x)))
      }}
      onPointerUp={end}
      onLostPointerCapture={end}
      onKeyDown={event => {
        const step =
          event.key === 'ArrowRight' ? STEP : event.key === 'ArrowLeft' ? -STEP : 0
        if (!step) return
        event.preventDefault()
        onResize(clamp(width + sign * step))
      }}
    />
  )
}
