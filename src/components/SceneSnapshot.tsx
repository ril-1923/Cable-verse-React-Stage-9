import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CARD_H, CARD_W } from '../lib/scorecard'
import { useUi } from '../store/useUi'

/** On request, copies what the camera sees (cropped to the score card's shape) for use as a backdrop. */
export function SceneSnapshot() {
  const handled = useRef(useUi.getState().snapN)

  useFrame((state) => {
    const ui = useUi.getState()
    if (ui.snapN === handled.current) return
    handled.current = ui.snapN

    state.gl.render(state.scene, state.camera) // make sure the canvas holds the current picture
    const src = state.gl.domElement
    const out = document.createElement('canvas')
    out.width = CARD_W
    out.height = CARD_H
    const ctx = out.getContext('2d')
    if (!ctx) return
    // crop the middle of the view so it fills the card without stretching
    const want = CARD_W / CARD_H
    let sw = src.width
    let sh = src.height
    let sx = 0
    let sy = 0
    if (sw / sh > want) {
      sw = sh * want
      sx = (src.width - sw) / 2
    } else {
      sh = sw / want
      sy = (src.height - sh) / 2
    }
    ctx.drawImage(src, sx, sy, sw, sh, 0, 0, CARD_W, CARD_H)
    ui.setBackdrop(out)
  })

  return null
}
