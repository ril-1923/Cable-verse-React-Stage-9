import { useEffect, useRef } from 'react'
import { QUALITY, QUALITY_ORDER, shadowMapSize } from '../lib/quality'
import type { ShadowChoice } from '../lib/quality'
import { wipeSave } from '../lib/save'
import { useRideStore } from '../store/useRideStore'
import { useSettings } from '../store/useSettings'

export function Settings() {
  const s = useSettings()
  const sound = useRideStore((r) => r.sound)
  const volume = useRideStore((r) => r.volume)
  const setSound = useRideStore((r) => r.setSound)
  const setVolume = useRideStore((r) => r.setVolume)
  const setTour = useRideStore((r) => r.setTour)
  const box = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!s.open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        s.setOpen(false)
        return
      }
      if (e.key !== 'Tab' || !box.current) return
      // keep focus inside the dialog
      const items = box.current.querySelectorAll<HTMLElement>('button, input, [href]')
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.open])

  if (!s.open) return null

  return (
    <div className="overlay settings-wrap" onMouseDown={(e) => e.target === e.currentTarget && s.setOpen(false)}>
      <div className="settings" role="dialog" aria-modal="true" aria-labelledby="settings-title" ref={box}>
        <header>
          <h2 id="settings-title">Settings</h2>
          <button ref={closeRef} className="secondary" onClick={() => s.setOpen(false)} aria-label="Close settings">✕</button>
        </header>

        <section>
          <h3>Graphics quality</h3>
          <div className="presets" role="group" aria-label="Graphics quality">
            {QUALITY_ORDER.map((q) => (
              <button
                key={q}
                className={'secondary' + (s.quality === q ? ' active' : '')}
                aria-pressed={s.quality === q}
                onClick={() => s.setQuality(q)}
              >
                {QUALITY[q].label}
              </button>
            ))}
          </div>
          <p className="muted">{QUALITY[s.quality].blurb}</p>
          <ul className="muted detail">
            <li>Resolution up to {QUALITY[s.quality].dpr}×</li>
            <li>{QUALITY[s.quality].trees} trees</li>
            <li>Rain and snow at {Math.round(QUALITY[s.quality].precip * 100)}%</li>
            <li>Lamp glow {QUALITY[s.quality].halos ? 'on' : 'off'}</li>
          </ul>
          <div className="subgroup">
            <span id="shadow-label">Shadows</span>
            <div className="seg" role="group" aria-labelledby="shadow-label">
              {([['auto', 'Auto'], ['off', 'Off'], ['medium', 'Medium'], ['high', 'High']] as [ShadowChoice, string][]).map(([v, label]) => (
                <button
                  key={v}
                  className={'secondary' + (s.shadows === v ? ' active' : '')}
                  aria-pressed={s.shadows === v}
                  onClick={() => s.setShadows(v)}
                >
                  {label}
                </button>
              ))}
            </div>
            <small className="muted">
              {s.shadows === 'auto' ? `Follows the preset: ${shadowMapSize(s.quality, 'auto') ? shadowMapSize(s.quality, 'auto') + ' px' : 'off'}.` : 'Sun shadows from the mountain, trees, towers and cabins.'}
            </small>
          </div>
          <div className="subgroup">
            <span id="fps-label">Frame rate limit</span>
            <div className="seg" role="group" aria-labelledby="fps-label">
              {([[0, 'Unlimited'], [60, '60'], [30, '30 (saves battery)']] as [0 | 30 | 60, string][]).map(([v, label]) => (
                <button
                  key={v}
                  className={'secondary' + (s.fpsCap === v ? ' active' : '')}
                  aria-pressed={s.fpsCap === v}
                  onClick={() => s.setFpsCap(v)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <label>
            Resolution scale: {Math.round(s.renderScale * 100)}%
            <input type="range" min={0.5} max={1} step={0.05} value={s.renderScale} onChange={(e) => s.setRenderScale(Number(e.target.value))} />
          </label>
          <label className="check">
            <input type="checkbox" checked={s.antialias} onChange={(e) => s.setAntialias(e.target.checked)} />
            Smooth edges (anti-aliasing). Restarts the view.
          </label>
          <label className="check">
            <input type="checkbox" checked={s.autoQuality} onChange={(e) => s.setAutoQuality(e.target.checked)} />
            Lower the quality automatically if the game runs slowly
          </label>
          <label className="check">
            <input type="checkbox" checked={s.showFps} onChange={(e) => s.setShowFps(e.target.checked)} />
            Show frame rate
          </label>
        </section>

        <section>
          <h3>Comfort</h3>
          <label className="check">
            <input type="checkbox" checked={s.reduceFlashing} onChange={(e) => s.setReduceFlashing(e.target.checked)} />
            Soften lightning flashes
          </label>
          <label className="check">
            <input type="checkbox" checked={s.calmCabins} onChange={(e) => s.setCalmCabins(e.target.checked)} />
            Steady cabins (no swaying)
          </label>
          <label>
            Camera speed (keys and sticks): {s.lookSpeed.toFixed(1)}×
            <input type="range" min={0.5} max={2} step={0.1} value={s.lookSpeed} onChange={(e) => s.setLookSpeed(Number(e.target.value))} />
          </label>
          <label className="check">
            <input type="checkbox" checked={s.invertY} onChange={(e) => s.setInvertY(e.target.checked)} />
            Invert vertical look
          </label>
          <label>
            Interface size: {Math.round(s.uiScale * 100)}%
            <input type="range" min={0.8} max={1.4} step={0.1} value={s.uiScale} onChange={(e) => s.setUiScale(Number(e.target.value))} />
          </label>
        </section>

        <section>
          <h3>Sound</h3>
          <button className="secondary" onClick={() => setSound(!sound)} aria-pressed={sound}>
            {sound ? '🔊 Sound on' : '🔇 Sound off'}
          </button>
          <label>
            Volume: {Math.round(volume * 100)}%
            <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
          </label>
        </section>

        <section>
          <h3>Game</h3>
          <div className="row">
            <button
              className="secondary"
              onClick={() => {
                s.setOpen(false)
                setTour(0)
              }}
            >
              Show the tutorial
            </button>
            <button
              className="secondary"
              onClick={() => {
                if (window.confirm('Erase your saved game and start over?')) {
                  wipeSave()
                  s.setOpen(false)
                }
              }}
            >
              Erase save
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
