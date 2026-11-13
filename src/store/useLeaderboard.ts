import { create } from 'zustand'
import { GOALS, game, hooks, score, stars } from '../lib/game'
import type { RunOutcome } from '../lib/game'

/**
 * A local leaderboard: your own finished runs, kept in this browser (there is no server).
 * A run is recorded when you go bankrupt, become a tycoon, or retire.
 */
const KEY = 'cableverse-leaderboard-v1'
const KEEP = 30

export interface RunRecord {
  id: number
  name: string
  score: number
  days: number
  cash: number
  pax: number
  stars: number
  goals: number
  skin: string
  date: string
  outcome: RunOutcome
}

interface BoardState {
  name: string
  runs: RunRecord[]
  lastId: number | null // the run you just finished, to highlight it
  setName: (name: string) => void
  clear: () => void
}

function load(): { name: string; runs: RunRecord[] } {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { name: 'Player', runs: [] }
    const d = JSON.parse(raw)
    const runs: RunRecord[] = Array.isArray(d.runs)
      ? d.runs.filter((r: RunRecord) => r && typeof r.score === 'number' && typeof r.name === 'string')
      : []
    return { name: typeof d.name === 'string' && d.name ? d.name.slice(0, 16) : 'Player', runs }
  } catch {
    return { name: 'Player', runs: [] }
  }
}

export const useLeaderboard = create<BoardState>((set) => ({
  ...load(),
  lastId: null,
  setName: (name) => set({ name: name.slice(0, 16) }),
  clear: () => set({ runs: [], lastId: null }),
}))

useLeaderboard.subscribe((s) => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: 1, name: s.name, runs: s.runs }))
  } catch {
    // storage unavailable: the board just won't persist
  }
})

export function topRuns(runs: RunRecord[], n = 10): RunRecord[] {
  return [...runs].sort((a, b) => b.score - a.score || a.id - b.id).slice(0, n)
}

/** Where a score would land on the current board (1 = best). */
export const rankOf = (runs: RunRecord[], value: number) => 1 + runs.filter((r) => r.score > value).length

hooks.runEnded = (outcome) => {
  const s = useLeaderboard.getState()
  const rec: RunRecord = {
    id: Date.now(),
    name: s.name || 'Player',
    score: score(),
    days: Math.max(0, game.day - 1),
    cash: Math.round(game.cash),
    pax: game.totalPax,
    stars: stars(),
    goals: game.goalsDone,
    skin: game.skin,
    date: new Date().toISOString(),
    outcome,
  }
  useLeaderboard.setState({ runs: topRuns([...s.runs, rec], KEEP), lastId: rec.id })
}

export const GOAL_TOTAL = GOALS.length
