export interface PhotoFilter { id: string; label: string; css: string }

export const FILTERS: PhotoFilter[] = [
  { id: 'none', label: 'Natural', css: 'none' },
  { id: 'warm', label: 'Warm', css: 'sepia(0.28) saturate(1.25) brightness(1.03)' },
  { id: 'cool', label: 'Cool', css: 'hue-rotate(-14deg) saturate(1.1) brightness(1.02)' },
  { id: 'vivid', label: 'Vivid', css: 'saturate(1.55) contrast(1.08)' },
  { id: 'faded', label: 'Faded', css: 'contrast(0.9) saturate(0.8) sepia(0.15) brightness(1.05)' },
  { id: 'noir', label: 'Noir', css: 'grayscale(1) contrast(1.2)' },
]

export const filterCss = (id: string) => FILTERS.find((f) => f.id === id)?.css ?? 'none'

/**
 * Turn the live WebGL canvas into a PNG, applying the chosen filter and an optional caption.
 * (The filter uses the canvas filter property; browsers without it save the photo unfiltered.)
 */
export function composite(source: HTMLCanvasElement, css: string, caption: string | null): Promise<Blob | null> {
  const out = document.createElement('canvas')
  out.width = source.width
  out.height = source.height
  const ctx = out.getContext('2d')
  if (!ctx) return Promise.resolve(null)
  ctx.filter = css
  ctx.drawImage(source, 0, 0)
  ctx.filter = 'none'
  if (caption) {
    const fs = Math.max(12, Math.round(out.width / 58))
    const pad = fs * 0.8
    ctx.font = `600 ${fs}px system-ui, sans-serif`
    const w = ctx.measureText(caption).width
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
    ctx.fillRect(pad, out.height - pad - fs * 1.7, w + pad * 1.6, fs * 1.7)
    ctx.fillStyle = '#ffffff'
    ctx.fillText(caption, pad * 1.8, out.height - pad - fs * 0.5)
  }
  return new Promise((resolve) => out.toBlob(resolve, 'image/png'))
}
