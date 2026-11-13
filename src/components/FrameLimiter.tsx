import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { env } from '../lib/env'
import { useSettings } from '../store/useSettings'
import { useUi } from '../store/useUi'

/**
 * Takes over the drawing step (a frame subscriber with a positive priority switches off the
 * automatic render). That lets us:
 *  - cap the frame rate at 30 or 60 to save battery, while the game itself keeps running
 *  - freeze the picture while the share dialog is open, so building the image gets the processor
 * Unlimited simply draws on every screen refresh.
 */
export function FrameLimiter() {
  const acc = useRef(0)
  const last = useRef(0)

  useFrame((state, delta) => {
    const cap = useSettings.getState().fpsCap
    const { shareOpen, backdrop } = useUi.getState()
    if (shareOpen && backdrop !== null) return // picture frozen behind the dialog

    acc.current += delta
    if (cap) {
      const interval = 1 / cap
      if (acc.current < interval - 0.002) return
      acc.current -= interval // one frame's worth used; the 2 ms tolerance keeps the average exact
      if (acc.current > interval) acc.current = 0 // after a long stall, don't try to catch up
    } else {
      acc.current = 0
    }

    state.gl.render(state.scene, state.camera)

    // frame rate as the player sees it: time between drawn frames
    const now = performance.now()
    if (last.current) {
      const dt = (now - last.current) / 1000
      if (dt > 0 && dt < 2) env.fps += (1 / dt - env.fps) * 0.05
    }
    last.current = now
  }, 1)

  return null
}
