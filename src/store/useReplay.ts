import { create } from 'zustand'

/** One recorded sample of a day. See lib/recorder.ts for the field order. */
export type Sample = number[]

export interface DayEvent { t: number; title: string }

export interface DaySummary {
  day: number
  season: number
  profit: number
  revenue: number
  costs: number
  pax: number
  stars: number
  cabins: number
  lines: number
  skin: string
  duration: number // seconds of recording
  events: DayEvent[]
}

export interface DayRecording { summary: DaySummary; samples: Sample[] }

export type Slot = 'best' | 'last'

interface LiveView { cash: number; pax: number; hour: number; weather: number; waiting: number; day: number }

interface ReplayState {
  best: DayRecording | null
  last: DayRecording | null
  menuOpen: boolean // the "pick a day" dialog
  on: boolean // a replay is running in the scene
  slot: Slot
  playing: boolean
  speed: number
  pos: number // seconds into the recording (the UI copy, updated ~10 times a second)
  cam: 'orbit' | 'free'
  exporting: boolean
  live: LiveView
  setMenuOpen: (on: boolean) => void
}

const KEY = 'cableverse-days-v1'

function load(): { best: DayRecording | null; last: DayRecording | null } {
  const ok = (r: unknown): r is DayRecording => {
    const x = r as DayRecording | null
    return !!x && Array.isArray(x.samples) && x.samples.length > 5 && Array.isArray(x.samples[0]) && typeof x.summary?.profit === 'number'
  }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { best: null, last: null }
    const d = JSON.parse(raw)
    return { best: ok(d.best) ? d.best : null, last: ok(d.last) ? d.last : null }
  } catch {
    return { best: null, last: null }
  }
}

export const useReplay = create<ReplayState>((set) => ({
  ...load(),
  menuOpen: false,
  on: false,
  slot: 'best',
  playing: false,
  speed: 6,
  pos: 0,
  cam: 'orbit',
  exporting: false,
  live: { cash: 0, pax: 0, hour: 0, weather: 0, waiting: 0, day: 1 },
  setMenuOpen: (menuOpen) => set({ menuOpen }),
}))

let lastSaved = ''
useReplay.subscribe((s) => {
  try {
    const out = JSON.stringify({ v: 1, best: s.best, last: s.last })
    if (out !== lastSaved) {
      lastSaved = out
      localStorage.setItem(KEY, out)
    }
  } catch {
    // too big or storage unavailable: recordings just won't persist
  }
})
