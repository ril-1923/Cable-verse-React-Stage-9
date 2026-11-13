import { useRef } from 'react'
import { game, score, stars } from '../lib/game'
import { retire } from '../lib/save'
import { useDialog } from '../lib/useDialog'
import { rankOf, topRuns, useLeaderboard } from '../store/useLeaderboard'
import { useGameStore } from '../store/useGameStore'
import { useUi } from '../store/useUi'

const ICON = { bankrupt: '💥', retired: '🏳️', tycoon: '🏆' } as const
const MEDAL = ['🥇', '🥈', '🥉']

const when = (iso: string) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export function Leaderboard() {
  const open = useUi((s) => s.leaderboardOpen)
  const setOpen = useUi((s) => s.setLeaderboardOpen)
  const setShareOpen = useUi((s) => s.setShareOpen)
  const { name, runs, lastId, setName, clear } = useLeaderboard()
  // re-render as the live score changes
  useGameStore((s) => s.score)
  const box = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  useDialog(open, () => setOpen(false), box, closeRef)

  if (!open) return null
  const rows = topRuns(runs, 10)
  const now = score()
  const rank = rankOf(runs, now)

  return (
    <div className="overlay settings-wrap" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div className="settings wide" role="dialog" aria-modal="true" aria-labelledby="board-title" ref={box}>
        <header>
          <h2 id="board-title">🏆 Leaderboard</h2>
          <button ref={closeRef} className="secondary" onClick={() => setOpen(false)} aria-label="Close leaderboard">✕</button>
        </header>
        <p className="muted">Your best runs on this device. A run is recorded when you go bankrupt, become a tycoon, or retire.</p>

        <label>
          Your name
          <input type="text" value={name} maxLength={16} onChange={(e) => setName(e.target.value)} />
        </label>

        {rows.length === 0 ? (
          <p className="empty">No finished runs yet. Play on, or retire your current run to put it on the board.</p>
        ) : (
          <table className="board">
            <thead>
              <tr><th>#</th><th>Name</th><th>Score</th><th>Days</th><th>Riders</th><th>★</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={r.id === lastId ? 'mine' : ''}>
                  <td>{MEDAL[i] ?? i + 1}</td>
                  <td className="nm">{r.name}<small>{when(r.date)}</small></td>
                  <td className="num">{r.score.toLocaleString()}</td>
                  <td className="num">{r.days}</td>
                  <td className="num">{r.pax.toLocaleString()}</td>
                  <td className="num">{r.stars}</td>
                  <td title={r.outcome}>{ICON[r.outcome]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <section className="now">
          <div>
            <strong>This run</strong>
            <span>
              Score {now.toLocaleString()} · Day {game.day} · {stars()}★ · would rank <b>#{rank}</b>
            </span>
          </div>
          <div className="row">
            <button onClick={() => { setOpen(false); setShareOpen(true) }}>📤 Share score</button>
            <button
              className="secondary"
              onClick={() => {
                if (window.confirm('Retire this run, put it on the leaderboard and start a new game?')) retire()
              }}
            >
              Retire and record
            </button>
          </div>
        </section>

        {runs.length > 0 && (
          <button
            className="secondary quiet"
            onClick={() => {
              if (window.confirm('Clear the whole leaderboard?')) clear()
            }}
          >
            Clear leaderboard
          </button>
        )}
      </div>
    </div>
  )
}
