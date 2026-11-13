import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { modalOpen } from '../lib/actions'
import { readPad } from '../lib/gamepad'
import { useInput } from '../store/useInput'
import { useRideStore } from '../store/useRideStore'
import { useSettings } from '../store/useSettings'

interface Orbit { target: THREE.Vector3; update: () => void }

const spherical = new THREE.Spherical()
const offset = new THREE.Vector3()
const move = new THREE.Vector3()
const fwd = new THREE.Vector3()

/**
 * Moves the camera from the keyboard and the controller sticks:
 *   arrows / right stick: orbit and tilt    W A S D / left stick: pan
 *   E and Q or the triggers: zoom in and out
 * While riding in a cabin the same controls turn your head instead.
 */
export function InputDriver() {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as unknown as Orbit | null
  const keys = useRef(new Set<string>())
  const resetN = useInput((s) => s.cameraReset)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const el = document.activeElement as HTMLElement | null
      // sliders and text fields keep their own arrow keys
      if (el && (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || (el instanceof HTMLInputElement && el.type !== 'checkbox' && el.type !== 'button'))) return
      if (el?.getAttribute('role') === 'slider') return
      if (modalOpen()) return
      const k = e.key.toLowerCase()
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'q', 'e', 'pageup', 'pagedown'].includes(k)) {
        keys.current.add(k)
        if (k.startsWith('arrow') && (!el || el === document.body || el.tagName === 'CANVAS')) e.preventDefault()
      }
    }
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase())
    const clear = () => keys.current.clear()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clear)
    }
  }, [])

  // C / R3: back to the overview
  useEffect(() => {
    if (!resetN || !controls || useRideStore.getState().riding) return
    camera.position.set(-10, 40, 75)
    controls.target.set(0, 14, 0)
    controls.update()
  }, [resetN, camera, controls])

  useFrame((_, delta) => {
    if (!controls) return
    const dt = Math.min(delta, 0.1)
    const k = keys.current
    const pad = readPad()
    const { lookSpeed, invertY } = useSettings.getState()
    const riding = useRideStore.getState().riding

    const kyaw = (k.has('arrowright') ? 1 : 0) - (k.has('arrowleft') ? 1 : 0)
    const kpitch = (k.has('arrowdown') ? 1 : 0) - (k.has('arrowup') ? 1 : 0)
    const yaw = kyaw + (pad?.rx ?? 0)
    const pitch = (kpitch + (pad?.ry ?? 0)) * (invertY ? -1 : 1)
    const panX = (k.has('d') ? 1 : 0) - (k.has('a') ? 1 : 0) + (pad?.lx ?? 0)
    const panZ = (k.has('s') ? 1 : 0) - (k.has('w') ? 1 : 0) + (pad?.ly ?? 0)
    const zoom = (k.has('e') || k.has('pageup') ? 1 : 0) - (k.has('q') || k.has('pagedown') ? 1 : 0) + (pad?.zoom ?? 0)

    if (!yaw && !pitch && !panX && !panZ && !zoom) return

    // orbit and tilt around the target; in a cabin the target is your head, so turn the other way
    const turn = riding ? -1 : 1
    offset.copy(camera.position).sub(controls.target)
    spherical.setFromVector3(offset)
    spherical.theta += yaw * turn * 1.6 * lookSpeed * dt
    spherical.phi += pitch * turn * 1.2 * lookSpeed * dt
    spherical.phi = Math.min(Math.PI - 0.06, Math.max(0.06, spherical.phi))
    if (!riding) spherical.radius = Math.min(300, Math.max(4, spherical.radius * Math.exp(-zoom * 1.3 * dt)))

    // pan across the ground, relative to where the camera faces
    if (!riding && (panX || panZ)) {
      fwd.set(-offset.x, 0, -offset.z).normalize()
      const speed = Math.min(60, Math.max(5, spherical.radius * 0.8)) * dt * lookSpeed
      move.set(-fwd.z * panX - fwd.x * panZ, 0, fwd.x * panX - fwd.z * panZ).multiplyScalar(speed)
      controls.target.add(move)
      camera.position.add(move)
    }

    offset.setFromSpherical(spherical)
    camera.position.copy(controls.target).add(offset)
    controls.update()
  })

  return null
}
