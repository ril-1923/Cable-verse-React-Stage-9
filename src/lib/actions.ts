import { CURRENCY, MAX_PAX } from './config'
import { toast } from './game'
import { useRideStore } from '../store/useRideStore'
import type { Weather } from '../store/useRideStore'
import { useTicketStore } from '../store/useTicketStore'

/** Things you can do from the keyboard or a controller, in one place. */
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

export const modalOpen = () => document.querySelector('[role="dialog"][aria-modal="true"]') !== null

export function nudgePrice(delta: number) {
  const s = useTicketStore.getState()
  const v = clamp(s.price + delta, 0, 20)
  if (v === s.price) return
  s.setPrice(v)
  toast(`Ticket price ${CURRENCY}${v}`)
}

export function nudgeCapacity(delta: number) {
  const s = useTicketStore.getState()
  const v = clamp(s.capacity + delta, 1, MAX_PAX)
  if (v === s.capacity) return
  s.setCapacity(v)
  toast(`Cabin capacity ${v} ${v === 1 ? 'seat' : 'seats'}`)
}

export function nudgeSpeed(delta: number) {
  const s = useRideStore.getState()
  const v = Math.round(clamp(s.speed + delta, 0, 2.5) * 10) / 10
  if (v !== s.speed) s.setSpeed(v)
}

export const togglePause = () => {
  const s = useRideStore.getState()
  s.setPaused(!s.paused)
}

export const toggleRide = () => useRideStore.getState().toggleRide()
export const setWeather = (w: Weather) => useRideStore.getState().setWeather(w)

export const toggleSound = () => {
  const s = useRideStore.getState()
  s.setSound(!s.sound)
}

export function toggleFullscreen() {
  try {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen()
  } catch {
    // not available here
  }
}

/** Send Escape to whatever is on top (dialogs, photo mode, the tutorial...). */
export const pressEscape = () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
