import { game, hooks } from './game'
import { env } from './env'
import { sim } from './tickets'
import { useRideStore } from '../store/useRideStore'
import { useReplay } from '../store/useReplay'
import type { DayEvent, DayRecording, DaySummary, Sample } from '../store/useReplay'

/**
 * Records each game day as a light-weight series of samples so it can be replayed later as a
 * time-lapse. Only the best day (by profit) and the last day are kept.
 *
 * Sample layout: [t, hourUnwrapped, phase, weather, cash, pax, q0, q1, q2, q3, halted, dayHours]
 */
export const S = { t: 0, hour: 1, phase: 2, weather: 3, cash: 4, pax: 5, q0: 6, halted: 10, dayHours: 11 } as const

const INTERVAL = 0.4 // seconds between samples
const r = (v: number, d = 2) => Math.round(v * 10 ** d) / 10 ** d

const cur = {
  samples: [] as Sample[],
  events: [] as DayEvent[],
  t: 0,
  acc: INTERVAL,
  lastHour: -1,
  hourU: 0,
}

function reset() {
  cur.samples = []
  cur.events = []
  cur.t = 0
  cur.acc = INTERVAL
  cur.lastHour = -1
  cur.hourU = 0
}

const weatherCode = (w: string) => (w === 'rain' ? 1 : w === 'snow' ? 2 : 0)

/** Call every frame while the day clock is running. dt is real seconds. */
export function recordTick(dt: number) {
  cur.t += dt
  cur.acc += dt
  if (cur.acc < INTERVAL) return
  cur.acc = 0

  const rs = useRideStore.getState()
  if (cur.lastHour < 0) cur.hourU = rs.hour
  else {
    let d = rs.hour - cur.lastHour
    if (d < -12) d += 24 // the clock wrapped past midnight
    cur.hourU += Math.max(0, d)
  }
  cur.lastHour = rs.hour

  const q = sim.queue
  cur.samples.push([
    r(cur.t, 2), r(cur.hourU, 3), r(env.phase, 2), weatherCode(rs.weather), Math.round(game.cash), game.todaySold,
    q[0] ?? 0, q[1] ?? 0, q[2] ?? 0, q[3] ?? 0, game.haltLeft > 0 ? 1 : 0, r(game.dayHours, 3),
  ])
}

hooks.eventStarted = (title) => {
  cur.events.push({ t: r(cur.t, 1), title })
}

hooks.dayEnded = (s) => {
  // a recording needs enough samples to be worth watching (a few seconds of real play)
  if (cur.samples.length >= 20) {
    const summary: DaySummary = { ...s, duration: cur.samples[cur.samples.length - 1][S.t], events: cur.events }
    const rec: DayRecording = { summary, samples: cur.samples }
    const st = useReplay.getState()
    const better = !st.best || summary.profit >= st.best.summary.profit
    useReplay.setState({ last: rec, ...(better ? { best: rec } : {}) })
  }
  reset()
}

/** A new game starts a new best-day history. */
export function clearRecordings() {
  reset()
  useReplay.setState({ best: null, last: null })
}
