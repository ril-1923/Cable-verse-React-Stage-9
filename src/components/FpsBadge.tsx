import { useEffect, useState } from 'react'
import { env } from '../lib/env'
import { useSettings } from '../store/useSettings'

export function FpsBadge() {
  const show = useSettings((s) => s.showFps)
  const [fps, setFps] = useState(0)
  useEffect(() => {
    if (!show) return
    const id = window.setInterval(() => setFps(Math.round(env.fps)), 500)
    return () => window.clearInterval(id)
  }, [show])
  if (!show) return null
  return <div className="fps" aria-label="Frames per second">{fps} fps</div>
}
