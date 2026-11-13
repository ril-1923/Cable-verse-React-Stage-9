import { useEffect, useRef } from 'react'
import { SEASONS } from '../lib/seasons'
import { S } from '../lib/recorder'
import { seek, startReplay, stopReplay, togglePlay } from '../lib/replay'
import { canExportVideo, cancelExport, startExport } from '../lib/exportVideo'
import { useDialog } from '../lib/useDialog'
import { useReplay } from '../store/useReplay'
import type { DayRecording, Slot } from '../store/useReplay'
import { CURRENCY } from '../lib/config'

const SPEEDS = [1, 2, 4, 8, 16]
const WEATHER_ICON = ['☀️', '🌧️', '❄️']

const clock = (h: number) => {
  const hh = Math.floor(h) % 24
  const mm = Math.floor((h - Math.floor(h)) * 60) % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}
const money = (v: number) => `${v < 0 ? '-' : ''}${CURRENCY}${Math.abs(v).toLocaleString()}`

function DayCard({ title, rec, slot }: { title: string; rec: DayRecording | null; slot: Slot }) {
  if (!rec) {
    return (
      <div className="daycard empty">
        <strong>{title}</strong>
        <span>Nothing recorded yet. Let the day clock run to the end of a day.</span>
      </div>
    )
  }
  const s = rec.summary
  const season = SEASONS[s.season] ?? SEASONS[0]
  return (
    <div className="daycard">
      <strong>{title}</strong>
      <span>
        Day {s.day} · {season.icon} {season.name} · {s.stars}★
      </span>
      <span>
        Profit <b className={s.profit >= 0 ? 'pos' : 'neg'}>{s.profit >= 0 ? '+' : ''}{money(s.profit)}</b> · {s.pax} riders · {s.events.length} event{s.events.length === 1 ? '' : 's'}
      </span>
      <button onClick={() => startReplay(slot)}>▶ Play time-lapse</button>
    </div>
  )
}

/** Draws the day's cash curve with the playhead and event markers. */
function Timeline({ rec }: { rec: DayRecording }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const pos = useReplay((s) => s.pos)

  useEffect(() => {
    const c = canvas.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const W = c.width
    const H = c.height
    ctx.clearRect(0, 0, W, H)
    const dur = rec.summary.duration || 1
    const cash = rec.samples.map((s) => s[S.cash])
    const lo = Math.min(...cash)
    const hi = Math.max(...cash)
    const span = Math.max(1, hi - lo)
    const x = (t: number) => (t / dur) * W
    const y = (v: number) => H - 8 - ((v - lo) / span) * (H - 22)

    ctx.beginPath()
    rec.samples.forEach((s, i) => (i ? ctx.lineTo(x(s[S.t]), y(s[S.cash])) : ctx.moveTo(x(s[S.t]), y(s[S.cash]))))
    ctx.lineTo(W, H)
    ctx.lineTo(0, H)
    ctx.closePath()
    ctx.fillStyle = 'rgba(54, 209, 196, 0.25)'
    ctx.fill()
    ctx.beginPath()
    rec.samples.forEach((s, i) => (i ? ctx.lineTo(x(s[S.t]), y(s[S.cash])) : ctx.moveTo(x(s[S.t]), y(s[S.cash]))))
    ctx.strokeStyle = '#1f9d92'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = '#e8a317'
    for (const e of rec.summary.events) {
      ctx.fillRect(x(e.t) - 1, 0, 2, H)
      ctx.beginPath()
      ctx.arc(x(e.t), 6, 4, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#c8412f'
    ctx.fillRect(x(pos) - 1.5, 0, 3, H)
  }, [rec, pos])

  const onSeek = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    seek(((e.clientX - r.left) / r.width) * rec.summary.duration)
  }

  return (
    <canvas
      ref={canvas}
      className="timeline"
      width={600}
      height={64}
      role="slider"
      aria-label="Time-lapse position"
      aria-valuemin={0}
      aria-valuemax={Math.round(rec.summary.duration)}
      aria-valuenow={Math.round(pos)}
      tabIndex={0}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        onSeek(e)
      }}
      onPointerMove={(e) => e.buttons === 1 && onSeek(e)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') seek(pos + 5)
        if (e.key === 'ArrowLeft') seek(pos - 5)
      }}
    />
  )
}

export function Replay() {
  const st = useReplay()
  const box = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  useDialog(st.menuOpen, () => st.setMenuOpen(false), box, closeRef)

  // keyboard while a replay is on
  useEffect(() => {
    if (!st.on) return
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement
      if (el instanceof HTMLInputElement || el instanceof HTMLButtonElement) return
      if (e.key === 'Escape') {
        cancelExport()
        stopReplay()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [st.on])

  const rec = st.on ? st[st.slot] : null

  if (st.menuOpen && !st.on) {
    return (
      <div className="overlay settings-wrap" onMouseDown={(e) => e.target === e.currentTarget && st.setMenuOpen(false)}>
        <div className="settings wide" role="dialog" aria-modal="true" aria-labelledby="replay-title" ref={box}>
          <header>
            <h2 id="replay-title">🎞 Replay a day</h2>
            <button ref={closeRef} className="secondary" onClick={() => st.setMenuOpen(false)} aria-label="Close">✕</button>
          </header>
          <p className="muted">
            Every day the clock runs is recorded. Watch your most profitable day, or the last one, as a time-lapse. Your game is paused and untouched while you watch.
          </p>
          <DayCard title="🏅 Best day" rec={st.best} slot="best" />
          <DayCard title="🕘 Last day" rec={st.last} slot="last" />
        </div>
      </div>
    )
  }

  if (!st.on || !rec) return null
  const s = rec.summary
  const season = SEASONS[s.season] ?? SEASONS[0]
  const ev = s.events.find((e) => st.pos >= e.t && st.pos < e.t + 4)
  const pct = Math.round((st.pos / Math.max(1, s.duration)) * 100)

  return (
    <div className="replaybar" role="region" aria-label="Time-lapse controls">
      <div className="rb-head">
        <strong>
          {st.slot === 'best' ? '🏅 Best day' : '🕘 Last day'} · Day {s.day} · {season.icon} {season.name}
        </strong>
        <span className="muted">
          Profit {s.profit >= 0 ? '+' : ''}{money(s.profit)}
        </span>
      </div>

      {ev && <p className="rb-event" role="status">★ {ev.title}</p>}
      <Timeline rec={rec} />

      <div className="rb-live" aria-live="off">
        <span>{WEATHER_ICON[st.live.weather] ?? ''} {clock(st.live.hour)}</span>
        <span>{money(st.live.cash)}</span>
        <span>{st.live.pax} riders</span>
        <span>{st.live.waiting} waiting</span>
      </div>

      <div className="rb-controls">
        <button onClick={togglePlay} aria-label={st.playing ? 'Pause' : 'Play'}>{st.playing ? '⏸' : '▶'}</button>
        <button className="secondary" onClick={() => seek(0)} aria-label="Back to the start">⏮</button>
        <div className="seg" role="group" aria-label="Time-lapse speed">
          {SPEEDS.map((v) => (
            <button
              key={v}
              className={'secondary' + (st.speed === v ? ' active' : '')}
              aria-pressed={st.speed === v}
              onClick={() => useReplay.setState({ speed: v })}
            >
              {v}×
            </button>
          ))}
        </div>
        <button className="secondary" onClick={() => useReplay.setState({ cam: st.cam === 'orbit' ? 'free' : 'orbit' })}>
          Camera: {st.cam === 'orbit' ? 'orbiting' : 'free'}
        </button>
        {canExportVideo() && (
          <button
            className="secondary"
            onClick={() => (st.exporting ? cancelExport() : startExport(`cableverse-day-${s.day}.webm`))}
          >
            {st.exporting ? `Recording ${pct}% (cancel)` : '🎬 Save video'}
          </button>
        )}
        <button
          className="secondary"
          onClick={() => {
            cancelExport()
            stopReplay()
          }}
        >
          Exit
        </button>
      </div>
      <p className="muted rb-hint">Space plays or pauses. Click the timeline to jump. Esc to leave.</p>
    </div>
  )
}
