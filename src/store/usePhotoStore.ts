import { create } from 'zustand'

export interface Shot { id: number; url: string; name: string }

interface PhotoState {
  on: boolean
  fov: number
  filter: string
  grid: boolean
  caption: boolean
  shots: Shot[]
  flash: number // counter, bumps on every capture
  captureN: number // counter, bump to request a photo
  pending: number // photos still being saved
  setOn: (on: boolean) => void
  setFov: (v: number) => void
  setFilter: (id: string) => void
  setGrid: (on: boolean) => void
  setCaption: (on: boolean) => void
  addShot: (s: Shot) => void
  takePhoto: () => void
  startSaving: () => void
  failSaving: () => void
}

export const DEFAULT_FOV = 55

export const usePhotoStore = create<PhotoState>((set) => ({
  on: false,
  fov: DEFAULT_FOV,
  filter: 'none',
  grid: false,
  caption: true,
  shots: [],
  flash: 0,
  captureN: 0,
  pending: 0,
  setOn: (on) => set({ on }),
  setFov: (fov) => set({ fov }),
  setFilter: (filter) => set({ filter }),
  setGrid: (grid) => set({ grid }),
  setCaption: (caption) => set({ caption }),
  addShot: (shot) =>
    set((s) => {
      const shots = [shot, ...s.shots]
      for (const old of shots.slice(6)) URL.revokeObjectURL(old.url) // keep the last six
      return { shots: shots.slice(0, 6), flash: s.flash + 1, pending: Math.max(0, s.pending - 1) }
    }),
  takePhoto: () => set((s) => ({ captureN: s.captureN + 1 })),
  startSaving: () => set((s) => ({ pending: s.pending + 1 })),
  failSaving: () => set((s) => ({ pending: Math.max(0, s.pending - 1) })),
}))
