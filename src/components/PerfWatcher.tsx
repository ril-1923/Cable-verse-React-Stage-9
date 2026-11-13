import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { toast } from '../lib/game'
import { QUALITY, QUALITY_ORDER } from '../lib/quality'
import { useSettings } from '../store/useSettings'

const WINDOW = 8 // seconds to average over
const WARMUP = 10 // seconds to ignore after start or a change
const SLOW_FPS = 22

/** Measures the frame rate and, if auto quality is on, steps the preset down when it stays low. */
export function PerfWatcher() {
  const acc = useRef({ time: 0, frames: 0, since: 0 })

  useFrame((_, delta) => {
    // a hidden tab or a one-off stall is not a real measurement, but a steady slog of slow frames is
    if (document.hidden || delta > 2) return
    const a = acc.current
    a.since += delta
    if (a.since < WARMUP) return
    a.time += delta
    a.frames++
    if (a.time < WINDOW) return

    const fps = a.frames / a.time
    a.time = 0
    a.frames = 0
    const { autoQuality, quality, setQuality } = useSettings.getState()
    const i = QUALITY_ORDER.indexOf(quality)
    if (autoQuality && fps < SLOW_FPS && i > 0) {
      const next = QUALITY_ORDER[i - 1]
      setQuality(next)
      a.since = 0 // give the new setting time to settle before judging again
      toast(`Graphics lowered to ${QUALITY[next].label} to keep things smooth. Change this in Settings.`)
    }
  })
  return null
}
