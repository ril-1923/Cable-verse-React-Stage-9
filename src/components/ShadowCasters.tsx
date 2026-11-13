import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'

/**
 * Marks solid meshes as shadow casters and receivers, including ones added later (new cabin
 * skins, the second line). See-through, sky and glow meshes are left out.
 */
export function ShadowCasters() {
  const scene = useThree((s) => s.scene)
  const done = useMemo(() => new WeakSet<object>(), [])

  useEffect(() => {
    const apply = () => {
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        if (!m.isMesh || done.has(m)) return
        done.add(m)
        const mat = Array.isArray(m.material) ? m.material[0] : m.material
        if (!mat || mat.transparent || mat.side === THREE.BackSide || mat.blending === THREE.AdditiveBlending) return
        m.castShadow = true
        m.receiveShadow = true
      })
    }
    apply()
    const id = window.setInterval(apply, 500)
    return () => window.clearInterval(id)
  }, [scene, done])

  return null
}
