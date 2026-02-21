import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Phase } from '../App'

// Generate points along the Gemini 4-pointed star shape
function geminiStarRadius(theta: number, outerR: number, innerR: number): number {
  const t = Math.pow(Math.cos(2 * theta), 2)
  const sharpness = 3
  return innerR + (outerR - innerR) * Math.pow(t, 1 / sharpness)
}

// Gemini gradient colors based on angle
function getGeminiColor(theta: number): THREE.Color {
  const angle = ((theta % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
  const color = new THREE.Color()

  if (angle < Math.PI * 0.5) {
    color.lerpColors(new THREE.Color(0x3186ff), new THREE.Color(0x00b95c), (angle) / (Math.PI * 0.5))
  } else if (angle < Math.PI) {
    color.lerpColors(new THREE.Color(0x00b95c), new THREE.Color(0xffe432), (angle - Math.PI * 0.5) / (Math.PI * 0.5))
  } else if (angle < Math.PI * 1.5) {
    color.lerpColors(new THREE.Color(0xffe432), new THREE.Color(0xfc413d), (angle - Math.PI) / (Math.PI * 0.5))
  } else {
    color.lerpColors(new THREE.Color(0xfc413d), new THREE.Color(0x3186ff), (angle - Math.PI * 1.5) / (Math.PI * 0.5))
  }
  return color
}

interface GeminiParticlesProps {
  phase: Phase
}

export function GeminiParticles({ phase }: GeminiParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const particleCount = 600
  const floatY = 3 // Float above the box
  const dropTargetY = 0 // Drop into the box center

  const [positions, colors, offsets] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    const cols = new Float32Array(particleCount * 3)
    const offs = new Float32Array(particleCount) // random offset per particle for staggered drop

    for (let i = 0; i < particleCount; i++) {
      const theta = (i / particleCount) * Math.PI * 2
      const r = geminiStarRadius(theta, 1.5, 0.05) * (0.8 + Math.random() * 0.2)

      // Initial position: star shape floating above box
      pos[i * 3] = Math.cos(theta) * r
      pos[i * 3 + 1] = floatY + Math.sin(theta) * r * 0.1 // slight vertical variation
      pos[i * 3 + 2] = Math.sin(theta) * r * 0.3 // flatten Z for front-facing

      const color = getGeminiColor(theta)
      cols[i * 3] = color.r
      cols[i * 3 + 1] = color.g
      cols[i * 3 + 2] = color.b

      // Random delay offset for staggered falling
      offs[i] = Math.random() * 0.4
    }

    return [pos, cols, offs]
  }, [])

  // Store initial star positions for reference
  const starPositions = useMemo(() => {
    const sp = new Float32Array(particleCount * 3)
    sp.set(positions)
    return sp
  }, [positions])

  const dropT = useRef(0)

  useFrame((state, delta) => {
    if (!pointsRef.current) return

    const isVisible = phase !== 'immersed'
    pointsRef.current.visible = isVisible
    if (!isVisible) return

    const posAttr = pointsRef.current.geometry.attributes.position
    const arr = posAttr.array as Float32Array
    const time = state.clock.elapsedTime

    const shouldDrop = phase === 'opening' || phase === 'opened' || phase === 'diving'

    if (shouldDrop) {
      dropT.current = Math.min(dropT.current + delta * 0.8, 1)
    }

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      const starX = starPositions[i3]
      const starY = starPositions[i3 + 1]
      const starZ = starPositions[i3 + 2]

      if (shouldDrop) {
        // Staggered drop per particle
        const particleDropT = Math.max(0, Math.min((dropT.current - offsets[i]) * 2, 1))
        // Gravity-like ease: accelerate as it falls
        const ease = particleDropT * particleDropT

        // Spiral inward as they drop
        const angle = (i / particleCount) * Math.PI * 2 + time * 2 * (1 - ease)
        const shrinkR = (1 - ease * 0.7)
        const baseR = Math.sqrt(starX * starX + starZ * starZ)

        arr[i3] = Math.cos(angle) * baseR * shrinkR
        arr[i3 + 1] = THREE.MathUtils.lerp(starY, dropTargetY + (Math.random() - 0.5) * 0.3, ease)
        arr[i3 + 2] = Math.sin(angle) * baseR * shrinkR * 0.5
      } else {
        // Idle: gentle floating rotation
        const angle = (i / particleCount) * Math.PI * 2 + time * 0.3
        const baseR = Math.sqrt(starX * starX + starZ * starZ)

        arr[i3] = Math.cos(angle) * baseR
        arr[i3 + 1] = starY + Math.sin(time * 1.5 + i * 0.1) * 0.1
        arr[i3 + 2] = Math.sin(angle) * baseR * 0.3
      }
    }

    posAttr.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.95}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
