import { useEffect } from 'react'
import type { RefObject } from 'react'

/** Escape closes, Tab stays inside the dialog, and focus starts on the given element. */
export function useDialog(open: boolean, onClose: () => void, box: RefObject<HTMLElement | null>, first: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return
    first.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !box.current) return
      const items = box.current.querySelectorAll<HTMLElement>('button:not([disabled]), input, [href]')
      if (!items.length) return
      const a = items[0]
      const z = items[items.length - 1]
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault()
        z.focus()
      } else if (!e.shiftKey && document.activeElement === z) {
        e.preventDefault()
        a.focus()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
}
