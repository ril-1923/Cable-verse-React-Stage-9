import { useEffect, useRef, useState } from 'react'
import { FILTERS } from '../lib/photo'
import { DEFAULT_FOV, usePhotoStore } from '../store/usePhotoStore'
import { useRideStore } from '../store/useRideStore'
import type { Weather } from '../store/useRideStore'
import { useSettings } from '../store/useSettings'
import { useGameStore } from '../store/useGameStore'
import { useUi } from '../store/useUi'

const WEATHER: { id: Weather; label: string }[] = [
  { id: 'clear', label: '☀️' },
  { id: 'rain', label: '🌧️' },
  { id: 'snow', label: '❄️' },
]

const clock = (h: number) => {
  const hh = Math.floor(h) % 24
  const mm = Math.round((h - Math.floor(h)) * 60) % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

/**
 * Photo mode pauses the game on entry and restores whatever you had on exit, hides the
 * interface, and gives you a toolbar for framing, light, weather and filters.
 */
export function PhotoMode() {
  const ph = usePhotoStore()
  const hour = useRideStore((s) => Math.round(s.hour * 4) / 4)
  const weather = useRideStore((s) => s.weather)
  const setHour = useRideStore((s) => s.setHour)
  const setWeather = useRideStore((s) => s.setWeather)
  const reduceFlashing = useSettings((s) => s.reduceFlashing)
  const wasPaused = useRef(false)
  const shootRef = useRef<HTMLButtonElement>(null)
  const [compact, setCompact] = useState(false)

  // auto-pause: remember the old state, pause, and put it back on the way out
  useEffect(() => {
    if (!ph.on) return
    wasPaused.current = useRideStore.getState().paused
    useRideStore.getState().setPaused(true)
    shootRef.current?.focus()
    return () => useRideStore.getState().setPaused(wasPaused.current)
  }, [ph.on])

  // keyboard: P toggles photo mode, Esc leaves, Enter takes a photo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement
      const typing = el instanceof HTMLInputElement && el.type !== 'range' && el.type !== 'checkbox'
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return
      if (useSettings.getState().open) return
      if (useUi.getState().leaderboardOpen || useUi.getState().shareOpen) return
      const p = usePhotoStore.getState()
      if (e.key === 'p' || e.key === 'P') {
        if (!p.on && (useRideStore.getState().tour !== null || useGameStore.getState().over)) return
        p.setOn(!p.on)
      } else if (e.key === 'Escape' && p.on) {
        p.setOn(false)
      } else if (e.key === 'Enter' && p.on && (el === document.body || el === null)) {
        p.takePhoto()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!ph.on) return null

  // a slim bar so the whole picture is visible while you frame it
  if (compact) {
    return (
      <>
        {ph.grid && (
          <div className="thirds" aria-hidden="true">
            <i /><i /><i /><i />
          </div>
        )}
        {ph.flash > 0 && !reduceFlashing && <div className="shutter-flash" key={ph.flash} aria-hidden="true" />}
        <div className="photobar compact" role="toolbar" aria-label="Photo mode">
          <button className="shoot" onClick={ph.takePhoto}>📷 Take photo</button>
          <button className="secondary" onClick={() => setCompact(false)}>Show controls</button>
          <button className="secondary" onClick={() => ph.setOn(false)}>Exit</button>
          {ph.pending > 0 && <span className="muted" role="status">Saving…</span>}
        </div>
      </>
    )
  }

  return (
    <>
      {ph.grid && (
        <div className="thirds" aria-hidden="true">
          <i /><i /><i /><i />
        </div>
      )}
      {ph.flash > 0 && !reduceFlashing && <div className="shutter-flash" key={ph.flash} aria-hidden="true" />}

      <div className="photobar" role="toolbar" aria-label="Photo mode">
        <div className="photo-main">
          <button ref={shootRef} className="shoot" onClick={ph.takePhoto}>
            📷 Take photo
          </button>
          <button className="secondary" onClick={() => setCompact(true)}>Hide controls</button>
          <button className="secondary" onClick={() => ph.setOn(false)}>Exit</button>
        </div>

        <div className="photo-grid">
          <label>
            Zoom: field of view {ph.fov}°
            <input type="range" min={20} max={90} step={1} value={ph.fov} onChange={(e) => ph.setFov(Number(e.target.value))} />
          </label>
          <label>
            Time of day: {clock(hour)}
            <input type="range" min={0} max={24} step={0.25} value={hour} onChange={(e) => setHour(Number(e.target.value))} />
          </label>
        </div>

        <div className="photo-row" role="group" aria-label="Weather">
          <span>Weather</span>
          {WEATHER.map((w) => (
            <button
              key={w.id}
              className={'secondary' + (weather === w.id ? ' active' : '')}
              aria-pressed={weather === w.id}
              aria-label={w.id}
              onClick={() => setWeather(w.id)}
            >
              {w.label}
            </button>
          ))}
          <button className="secondary" onClick={() => ph.setFov(DEFAULT_FOV)}>Reset zoom</button>
        </div>

        <div className="photo-row" role="group" aria-label="Filter">
          <span>Filter</span>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={'secondary' + (ph.filter === f.id ? ' active' : '')}
              aria-pressed={ph.filter === f.id}
              onClick={() => ph.setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="photo-row">
          <label className="check">
            <input type="checkbox" checked={ph.grid} onChange={(e) => ph.setGrid(e.target.checked)} />
            Rule-of-thirds grid
          </label>
          <label className="check">
            <input type="checkbox" checked={ph.caption} onChange={(e) => ph.setCaption(e.target.checked)} />
            Add a caption
          </label>
        </div>

        {ph.pending > 0 && <p className="muted" role="status">Saving photo…</p>}
        {ph.shots.length > 0 && (
          <ul className="gallery" aria-label="Photos you took">
            {ph.shots.map((s) => (
              <li key={s.id}>
                <a href={s.url} download={s.name} title={`Download ${s.name}`}>
                  <img src={s.url} alt={`Photo ${s.id}`} />
                  <span>Save</span>
                </a>
              </li>
            ))}
          </ul>
        )}
        <p className="muted">Game paused. Drag to orbit, scroll to zoom, right-drag to move. P or Esc to leave.</p>
      </div>
    </>
  )
}
