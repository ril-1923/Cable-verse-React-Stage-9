import { useEffect } from 'react'
import { BTN, readPad } from '../lib/gamepad'
import { FILTERS } from '../lib/photo'
import { modalOpen, nudgeCapacity, nudgePrice, nudgeSpeed, pressEscape, setWeather, toggleFullscreen, togglePause, toggleRide, toggleSound } from '../lib/actions'
import { cancelExport } from '../lib/exportVideo'
import { seek, stopReplay, togglePlay, replayPos } from '../lib/replay'
import { toast } from '../lib/game'
import { useInput } from '../store/useInput'
import { usePhotoStore } from '../store/usePhotoStore'
import { useReplay } from '../store/useReplay'
import { useRideStore } from '../store/useRideStore'
import { useSettings } from '../store/useSettings'
import { useUi } from '../store/useUi'

const SPEEDS = [1, 2, 4, 8, 16]
const REPEAT = new Set<number>([BTN.UP, BTN.DOWN, BTN.LEFT, BTN.RIGHT, BTN.LB, BTN.RB])

const focusables = (root: Element) =>
  Array.from(root.querySelectorAll<HTMLElement>('button:not([disabled]), input, [href], [role="slider"]')).filter((e) => e.offsetParent !== null)

function stepRange(el: HTMLInputElement, dir: 1 | -1) {
  const step = Number(el.step) || 1
  const next = Math.min(Number(el.max), Math.max(Number(el.min), Number(el.value) + dir * step))
  // React listens for the native input event, so set the value the way the browser would
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  setter?.call(el, String(next))
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

function moveFocus(dir: 1 | -1) {
  const dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]')
  const root = dialogs[dialogs.length - 1]
  if (!root) return
  const items = focusables(root)
  if (!items.length) return
  const at = items.indexOf(document.activeElement as HTMLElement)
  const next = at < 0 ? (dir > 0 ? 0 : items.length - 1) : (at + dir + items.length) % items.length
  items[next].focus()
}

function modalButton(i: number) {
  const el = document.activeElement as HTMLElement | null
  const isRange = el instanceof HTMLInputElement && el.type === 'range'
  if (i === BTN.LEFT && isRange) return stepRange(el, -1)
  if (i === BTN.RIGHT && isRange) return stepRange(el, 1)
  if (i === BTN.UP || i === BTN.LEFT) return moveFocus(-1)
  if (i === BTN.DOWN || i === BTN.RIGHT) return moveFocus(1)
  if (i === BTN.A) {
    if (!el || el === document.body) moveFocus(1)
    else el.click()
  } else if (i === BTN.B) pressEscape()
}

function cycleSpeed(dir: 1 | -1) {
  const rp = useReplay.getState()
  const at = SPEEDS.indexOf(rp.speed)
  useReplay.setState({ speed: SPEEDS[Math.min(SPEEDS.length - 1, Math.max(0, (at < 0 ? 2 : at) + dir))] })
}

function onButton(i: number) {
  if (modalOpen()) return modalButton(i)

  const rp = useReplay.getState()
  const ph = usePhotoStore.getState()
  const rs = useRideStore.getState()

  // an event card is waiting: A and X choose its first and second option
  const eventButtons = document.querySelectorAll<HTMLButtonElement>('.event button')
  if (eventButtons.length && !rp.on && !ph.on) {
    if (i === BTN.A) return eventButtons[0].click()
    if (i === BTN.X && eventButtons[1]) return eventButtons[1].click()
  }

  if (rp.on) {
    if (i === BTN.A) togglePlay()
    else if (i === BTN.B) {
      cancelExport()
      stopReplay()
    } else if (i === BTN.LEFT) seek(replayPos() - 5)
    else if (i === BTN.RIGHT) seek(replayPos() + 5)
    else if (i === BTN.UP || i === BTN.RB) cycleSpeed(1)
    else if (i === BTN.DOWN || i === BTN.LB) cycleSpeed(-1)
    else if (i === BTN.Y) useReplay.setState({ cam: rp.cam === 'orbit' ? 'free' : 'orbit' })
    else if (i === BTN.R3) useInput.getState().resetCamera()
    return
  }

  if (ph.on) {
    if (i === BTN.A) ph.takePhoto()
    else if (i === BTN.B || i === BTN.Y) ph.setOn(false)
    else if (i === BTN.UP) ph.setFov(Math.max(20, ph.fov - 5))
    else if (i === BTN.DOWN) ph.setFov(Math.min(90, ph.fov + 5))
    else if (i === BTN.LEFT) rs.setHour(((rs.hour - 0.25 + 24) % 24))
    else if (i === BTN.RIGHT) rs.setHour((rs.hour + 0.25) % 24)
    else if (i === BTN.X) ph.setGrid(!ph.grid)
    else if (i === BTN.LB || i === BTN.RB) {
      const at = FILTERS.findIndex((f) => f.id === ph.filter)
      ph.setFilter(FILTERS[(at + (i === BTN.RB ? 1 : -1) + FILTERS.length) % FILTERS.length].id)
    } else if (i === BTN.R3) useInput.getState().resetCamera()
    return
  }

  switch (i) {
    case BTN.A: return toggleRide()
    case BTN.B: return rs.riding ? toggleRide() : undefined
    case BTN.X: return togglePause()
    case BTN.Y: return ph.setOn(true)
    case BTN.START: return useSettings.getState().setOpen(true)
    case BTN.BACK: return useUi.getState().setLeaderboardOpen(true)
    case BTN.LB: return nudgePrice(-1)
    case BTN.RB: return nudgePrice(1)
    case BTN.UP: return nudgeSpeed(0.1)
    case BTN.DOWN: return nudgeSpeed(-0.1)
    case BTN.LEFT: return nudgeCapacity(-1)
    case BTN.RIGHT: return nudgeCapacity(1)
    case BTN.L3: return useInput.getState().setHelpOpen(true)
    case BTN.R3: return useInput.getState().resetCamera()
  }
}

/** Keyboard shortcuts and controller buttons. (Camera movement lives in InputDriver.) */
export function InputActions() {
  // ---- keyboard ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // the Escape we send for the controller's B button is not the player using the keyboard
      if (e.isTrusted) useInput.getState().setLast('keyboard')
      if (e.metaKey || e.ctrlKey || e.altKey || e.key === 'Escape') return
      const el = document.activeElement as HTMLElement | null
      const typing =
        !!el &&
        (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable ||
          (el instanceof HTMLInputElement && !['range', 'checkbox', 'radio', 'button'].includes(el.type)))
      if (typing || modalOpen()) return

      const key = e.key.toLowerCase()
      const rp = useReplay.getState()
      const ph = usePhotoStore.getState()
      const onBody = !el || el === document.body || el.tagName === 'CANVAS'
      const busy = rp.on || ph.on // photo mode and replays have their own controls

      if (key === ' ' && onBody) {
        e.preventDefault()
        if (rp.on) togglePlay()
        else if (!ph.on) togglePause()
        return
      }
      if (key === 'h' || key === '?') return useInput.getState().setHelpOpen(true)
      if (key === 'f') return toggleFullscreen()
      if (key === 'm') return toggleSound()
      if (key === 'c') return useInput.getState().resetCamera()
      if (key === '1' || key === '2' || key === '3') {
        if (rp.on) return
        return setWeather(key === '1' ? 'clear' : key === '2' ? 'rain' : 'snow')
      }
      if (busy) return

      if (key === 'r') return toggleRide()
      if (key === 'v') return useReplay.getState().setMenuOpen(true)
      if (key === 'l') return useUi.getState().setLeaderboardOpen(true)
      if (key === 'o') return useSettings.getState().setOpen(true)
      if (key === '-' || key === '_') return nudgePrice(-1)
      if (key === '=' || key === '+') return nudgePrice(1)
      if (key === '[') return nudgeCapacity(-1)
      if (key === ']') return nudgeCapacity(1)
      if (key === ',' || key === '<') return nudgeSpeed(-0.1)
      if (key === '.' || key === '>') return nudgeSpeed(0.1)
    }
    window.addEventListener('keydown', onKey)
    const onPointer = () => useInput.getState().setLast('pointer')
    window.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [])

  // ---- controller ----
  useEffect(() => {
    let raf = 0
    let prev: boolean[] = []
    const nextFire: Record<number, number> = {}
    let seenPad = false

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      const ui = useInput.getState()
      const pad = readPad()
      if (!pad) {
        if (ui.pad) ui.setPad(false)
        seenPad = false
        prev = []
        return
      }
      if (!ui.pad) ui.setPad(true)
      if (!seenPad) {
        seenPad = true
        toast('🎮 Controller connected. Press H or L3 for the controls.')
      }
      pad.pressed.forEach((down, i) => {
        const was = prev[i]
        let fire = false
        if (down && !was) {
          fire = true
          nextFire[i] = now + 450
        } else if (down && was && REPEAT.has(i) && now >= nextFire[i]) {
          fire = true
          nextFire[i] = now + 130
        }
        if (fire) {
          ui.setLast('gamepad')
          onButton(i)
        }
      })
      if (Math.abs(pad.lx) + Math.abs(pad.ly) + Math.abs(pad.rx) + Math.abs(pad.ry) > 0.3) ui.setLast('gamepad')
      prev = pad.pressed
    }
    raf = requestAnimationFrame(loop)
    const onDisconnect = () => toast('🎮 Controller disconnected')
    window.addEventListener('gamepaddisconnected', onDisconnect)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('gamepaddisconnected', onDisconnect)
    }
  }, [])

  return null
}
