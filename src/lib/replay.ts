import { replayCfg, pushGame } from './game'
import { env } from './env'
import { sim } from './tickets'
import { S } from './recorder'
import { useRideStore } from '../store/useRideStore'
import type { Weather } from '../store/useRideStore'
import { useReplay } from '../store/useReplay'
import type { DayRecording, Sample, Slot } from '../store/useReplay'

/** Plays a recorded day back through the live scene, restoring everything afterwards. */
const WEATHER: Weather[] = ['clear', 'rain', 'snow']

let pos = 0 // seconds into the recording
let uiTimer = 0
let backup: {
  hour: number
  weather: Weather
  paused: boolean
  riding: boolean
  autoTime: boolean
  phase: number
  queue: number[]
} | null = null

const recOf = (slot: Slot): DayRecording | null => useReplay.getState()[slot]

export const hasRecording = (slot: Slot) => !!recOf(slot)
export const replayPos = () => pos

export function startReplay(slot: Slot) {
  const rec = recOf(slot)
  if (!rec || useReplay.getState().on) return
  const rs = useRideStore.getState()
  backup = {
    hour: rs.hour, weather: rs.weather, paused: rs.paused, riding: rs.riding, autoTime: rs.autoTime,
    phase: env.phase, queue: [...sim.queue],
  }
  replayCfg.on = true
  replayCfg.cabins = rec.summary.cabins
  replayCfg.lines = rec.summary.lines
  useRideStore.setState({ riding: false, paused: false })
  pos = 0
  useReplay.setState({ on: true, slot, playing: true, pos: 0, menuOpen: false })
  apply(rec, 0, true)
  pushGame()
}

export function stopReplay() {
  if (!useReplay.getState().on) return
  replayCfg.on = false
  env.replay = null
  if (backup) {
    env.phase = backup.phase
    sim.queue = backup.queue
    useRideStore.setState({
      hour: backup.hour, weather: backup.weather, paused: backup.paused, riding: backup.riding, autoTime: backup.autoTime,
    })
  }
  backup = null
  useReplay.setState({ on: false, playing: false, exporting: false })
  pushGame()
}

export function seek(t: number) {
  const rec = recOf(useReplay.getState().slot)
  if (!rec) return
  pos = Math.max(0, Math.min(rec.summary.duration, t))
  apply(rec, pos, true) // refresh the readout even when paused
  useReplay.setState({ pos })
}

export const togglePlay = () => {
  const s = useReplay.getState()
  if (!s.on) return
  if (!s.playing && pos >= (recOf(s.slot)?.summary.duration ?? 0) - 0.01) seek(0) // replay from the start
  useReplay.setState({ playing: !s.playing })
}

/** Index of the last sample at or before t. */
function find(samples: Sample[], t: number): number {
  let lo = 0
  let hi = samples.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (samples[mid][S.t] <= t) lo = mid
    else hi = mid - 1
  }
  return lo
}

function apply(rec: DayRecording, t: number, force = false) {
  const a = rec.samples
  const i = find(a, t)
  const s0 = a[i]
  const s1 = a[Math.min(i + 1, a.length - 1)]
  const span = s1[S.t] - s0[S.t]
  const f = span > 1e-6 ? Math.min(1, Math.max(0, (t - s0[S.t]) / span)) : 0
  const mix = (k: number) => s0[k] + (s1[k] - s0[k]) * f

  env.phase = mix(S.phase)
  const hour = ((mix(S.hour) % 24) + 24) % 24
  const weather = WEATHER[s0[S.weather]] ?? 'clear'
  const rs = useRideStore.getState()
  if (Math.abs(rs.hour - hour) > 1e-4 || rs.weather !== weather) useRideStore.setState({ hour, weather })
  sim.queue = [s0[S.q0], s0[S.q0 + 1], s0[S.q0 + 2], s0[S.q0 + 3]]
  env.replay = { day: rec.summary.day, dayHours: mix(S.dayHours) }

  uiTimer++
  if (force || uiTimer % 6 === 0) {
    useReplay.setState({
      pos: t,
      live: {
        cash: Math.round(mix(S.cash)), pax: Math.round(mix(S.pax)), hour, weather: s0[S.weather],
        waiting: sim.queue.reduce((x, y) => x + y, 0), day: rec.summary.day,
      },
    })
  }
}

/** Called every frame while a replay is on. dt is real seconds. */
export function advanceReplay(dt: number) {
  const st = useReplay.getState()
  const rec = recOf(st.slot)
  if (!rec) return
  if (st.playing && !useRideStore.getState().paused) {
    pos += dt * st.speed
    if (pos >= rec.summary.duration) {
      pos = rec.summary.duration
      useReplay.setState({ playing: false, pos })
    }
  }
  apply(rec, pos)
}
