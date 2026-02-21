import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface StarFieldProps {
  count: number
  radius: number
}

export function StarField({ count, radius }: StarFieldProps) {
  const ref = useRef<THREE.Points>(null)

  const [positions, colors, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const siz = new Float32Array(count)
    const color = new THREE.Color()

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      // Spherical distribution
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = radius * (0.3 + Math.random() * 0.7)

      pos[i3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i3 + 2] = r * Math.cos(phi)

      // Star colors: white, blue-white, yellow
      const colorChoice = Math.random()
      if (colorChoice < 0.6) {
        color.setHSL(0.6, 0.1, 0.8 + Math.random() * 0.2)
      } else if (colorChoice < 0.85) {
        color.setHSL(0.6, 0.5, 0.7 + Math.random() * 0.3)
      } else {
        color.setHSL(0.12, 0.6, 0.7 + Math.random() * 0.3)
      }

      col[i3] = color.r
      col[i3 + 1] = color.g
      col[i3 + 2] = color.b

      siz[i] = 0.5 + Math.random() * 2
    }

    return [pos, col, siz]
  }, [count, radius])

  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.rotation.y += delta * 0.02
    ref.current.rotation.x += delta * 0.005
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
