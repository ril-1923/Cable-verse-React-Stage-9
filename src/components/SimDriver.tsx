import { useFrame } from '@react-three/fiber'
import { env } from '../lib/env'
import { effSpeed, gameTick, pushGame } from '../lib/game'
import { pushStats, sim, stepDemand } from '../lib/tickets'
import { useRideStore } from '../store/useRideStore'
import { useReplay } from '../store/useReplay'
import { recordTick } from '../lib/recorder'
import { advanceReplay } from '../lib/replay'
import { game } from '../lib/game'

let statsTimer = 0

/** One place that advances the shared clock, visitor demand and the tycoon rules. */
export function SimDriver() {
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)

    // watching a replay: the recording drives the scene and the live game stands still
    if (useReplay.getState().on) {
      advanceReplay(dt)
      return
    }

    const speed = effSpeed()
    env.phase += dt * speed

    const rs = useRideStore.getState()
    if (!rs.paused) {
      stepDemand(dt) // visitors arrive with the clock, however fast the cabins run
      gameTick(dt, sim.queue.reduce((a, b) => a + b, 0), speed)
      if (rs.autoTime && !game.over) recordTick(dt) // keep a time-lapse of the day
    }
    statsTimer += dt
    if (statsTimer > 0.25) {
      statsTimer = 0
      pushStats()
      pushGame()
    }
  })
  return null
}
