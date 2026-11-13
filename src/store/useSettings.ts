import { create } from 'zustand'
import type { Quality, ShadowChoice } from '../lib/quality'

/** Display and accessibility preferences. Stored separately from the game save. */
const KEY = 'cableverse-settings-v1'

interface Persisted {
  quality: Quality
  autoQuality: boolean
  showFps: boolean
  reduceFlashing: boolean
  calmCabins: boolean
  uiScale: number
  shadows: ShadowChoice
  antialias: boolean
  fpsCap: 0 | 30 | 60 // 0 = as fast as the screen allows
  renderScale: number // 0.5..1, multiplies the render resolution
  invertY: boolean // invert vertical camera look (keys and stick)
  lookSpeed: number // 0.5..2, keyboard and stick camera speed
}

interface SettingsState extends Persisted {
  open: boolean // the settings dialog
  setQuality: (q: Quality) => void
  setAutoQuality: (on: boolean) => void
  setShowFps: (on: boolean) => void
  setReduceFlashing: (on: boolean) => void
  setCalmCabins: (on: boolean) => void
  setUiScale: (v: number) => void
  setShadows: (v: ShadowChoice) => void
  setAntialias: (on: boolean) => void
  setFpsCap: (v: 0 | 30 | 60) => void
  setRenderScale: (v: number) => void
  setInvertY: (on: boolean) => void
  setLookSpeed: (v: number) => void
  setOpen: (on: boolean) => void
}

const QUALITIES: Quality[] = ['low', 'medium', 'high', 'ultra']

function defaults(): Persisted {
  const touch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches
  return {
    quality: touch ? 'medium' : 'high',
    autoQuality: true,
    showFps: false,
    reduceFlashing: false,
    calmCabins: false,
    uiScale: 1,
    shadows: 'auto',
    antialias: true,
    fpsCap: 0,
    renderScale: 1,
    invertY: false,
    lookSpeed: 1,
  }
}

function load(): Persisted {
  const d = defaults()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return d
    const s = JSON.parse(raw)
    return {
      quality: QUALITIES.includes(s.quality) ? s.quality : d.quality,
      autoQuality: s.autoQuality !== false,
      showFps: s.showFps === true,
      reduceFlashing: s.reduceFlashing === true,
      calmCabins: s.calmCabins === true,
      uiScale: typeof s.uiScale === 'number' && s.uiScale >= 0.8 && s.uiScale <= 1.4 ? s.uiScale : 1,
      shadows: ['auto', 'off', 'medium', 'high'].includes(s.shadows) ? s.shadows : 'auto',
      antialias: s.antialias !== false,
      fpsCap: s.fpsCap === 30 || s.fpsCap === 60 ? s.fpsCap : 0,
      renderScale: typeof s.renderScale === 'number' && s.renderScale >= 0.5 && s.renderScale <= 1 ? s.renderScale : 1,
      invertY: s.invertY === true,
      lookSpeed: typeof s.lookSpeed === 'number' && s.lookSpeed >= 0.5 && s.lookSpeed <= 2 ? s.lookSpeed : 1,
    }
  } catch {
    return d
  }
}

export const useSettings = create<SettingsState>((set) => ({
  ...load(),
  open: false,
  setQuality: (quality) => set({ quality }),
  setAutoQuality: (autoQuality) => set({ autoQuality }),
  setShowFps: (showFps) => set({ showFps }),
  setReduceFlashing: (reduceFlashing) => set({ reduceFlashing }),
  setCalmCabins: (calmCabins) => set({ calmCabins }),
  setUiScale: (uiScale) => set({ uiScale }),
  setShadows: (shadows) => set({ shadows }),
  setAntialias: (antialias) => set({ antialias }),
  setFpsCap: (fpsCap) => set({ fpsCap }),
  setRenderScale: (renderScale) => set({ renderScale }),
  setInvertY: (invertY) => set({ invertY }),
  setLookSpeed: (lookSpeed) => set({ lookSpeed }),
  setOpen: (open) => set({ open }),
}))

useSettings.subscribe((s) => {
  try {
    const p: Persisted = {
      quality: s.quality, autoQuality: s.autoQuality, showFps: s.showFps,
      reduceFlashing: s.reduceFlashing, calmCabins: s.calmCabins, uiScale: s.uiScale,
      shadows: s.shadows, antialias: s.antialias, fpsCap: s.fpsCap, renderScale: s.renderScale,
      invertY: s.invertY, lookSpeed: s.lookSpeed,
    }
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    // storage unavailable: settings just won't persist
  }
})
