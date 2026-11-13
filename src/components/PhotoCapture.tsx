import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { audio } from '../lib/audio'
import { rumble } from '../lib/haptics'
import { game } from '../lib/game'
import { composite, filterCss } from '../lib/photo'
import { SEASONS, seasonIndex, seasonPos } from '../lib/seasons'
import { DEFAULT_FOV, usePhotoStore } from '../store/usePhotoStore'
import { useRideStore } from '../store/useRideStore'

const clock = (h: number) => {
  const hh = Math.floor(h) % 24
  const mm = Math.round((h - Math.floor(h)) * 60) % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

/** Applies the photo field of view and turns capture requests into PNG files. */
export function PhotoCapture() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const handled = useRef(usePhotoStore.getState().captureN)
  const shotId = useRef(0)
  const fov = usePhotoStore((s) => s.fov)
  const on = usePhotoStore((s) => s.on)

  useEffect(() => {
    camera.fov = on ? fov : DEFAULT_FOV
    camera.updateProjectionMatrix()
  }, [camera, fov, on])

  useFrame((state) => {
    const ph = usePhotoStore.getState()
    if (ph.captureN === handled.current) return
    handled.current = ph.captureN
    if (!ph.on) return

    // render once more right now so the canvas holds the current picture, then snapshot it
    state.gl.render(state.scene, state.camera)
    const season = SEASONS[seasonIndex(seasonPos(game.day, game.dayHours))]
    const caption = ph.caption
      ? `Cableverse 3D · ${season.icon} ${season.name} · Day ${game.day} · ${clock(useRideStore.getState().hour)}`
      : null
    const id = ++shotId.current
    audio.shutter() // click right away; saving the PNG can take a moment
    rumble(60, 0.2, 0.6)
    usePhotoStore.getState().startSaving()
    void composite(state.gl.domElement, filterCss(ph.filter), caption).then((blob) => {
      if (!blob) {
        usePhotoStore.getState().failSaving()
        return
      }
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
      usePhotoStore.getState().addShot({ id, url: URL.createObjectURL(blob), name: `cableverse-${stamp}-${id}.png` })
    })
  })

  return null
}
