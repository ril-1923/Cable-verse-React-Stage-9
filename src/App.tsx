import { Scene } from './components/Scene'
import { Hud } from './components/Hud'
import { Minimap } from './components/Minimap'
import { Overlays } from './components/Overlays'
import { SaveDriver } from './components/SaveDriver'
import { Tutorial, tourSeen } from './components/Tutorial'
import { useEffect } from 'react'
import { useRideStore } from './store/useRideStore'
import { Settings } from './components/Settings'
import { PhotoMode } from './components/PhotoMode'
import { FpsBadge } from './components/FpsBadge'
import { Leaderboard } from './components/Leaderboard'
import { ShareScore } from './components/ShareScore'
import { Replay } from './components/Replay'
import { Controls } from './components/Controls'
import { InputActions } from './components/InputActions'
import { useReplay } from './store/useReplay'
import './lib/recorder' // registers the day recorder with the game
import './store/useLeaderboard' // registers the leaderboard with the game
import { usePhotoStore } from './store/usePhotoStore'
import { useSettings } from './store/useSettings'
import { filterCss } from './lib/photo'

export default function App() {
  // first visit: start the tutorial
  useEffect(() => {
    if (!tourSeen()) useRideStore.getState().setTour(0)
  }, [])

  const photo = usePhotoStore((s) => s.on)
  const replaying = useReplay((s) => s.on)
  const filter = usePhotoStore((s) => s.filter)
  const uiScale = useSettings((s) => s.uiScale)

  // interface size: the panels are sized in rem, so scaling the root text size scales them
  useEffect(() => {
    document.documentElement.style.fontSize = `${16 * uiScale}px`
  }, [uiScale])

  return (
    <div
      className={'stage' + (photo ? ' photo' : '') + (replaying ? ' replay' : '')}
      style={{ position: 'relative', height: '100%', ['--photo-filter' as string]: photo ? filterCss(filter) : 'none' }}
    >
      <Scene />
      <Hud />
      <Minimap />
      <Overlays />
      <SaveDriver />
      <Tutorial />
      <Settings />
      <Leaderboard />
      <ShareScore />
      <Replay />
      <Controls />
      <InputActions />
      <PhotoMode />
      <FpsBadge />
    </div>
  )
}
