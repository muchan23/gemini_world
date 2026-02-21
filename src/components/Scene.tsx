import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { Phase } from '../App'
import { Box } from './Box'
import { StarField } from './StarField'
import { CosmicWorld } from './CosmicWorld'
import { GeminiParticles } from './GeminiParticles'

interface SceneProps {
  phase: Phase
  setPhase: (phase: Phase) => void
}

export function Scene({ phase, setPhase }: SceneProps) {
  const { camera } = useThree()
  const targetPos = useRef(new THREE.Vector3(0, 2, 6))
  const targetLook = useRef(new THREE.Vector3(0, 0, 0))
  const diveProgress = useRef(0)
  const currentLook = useRef(new THREE.Vector3(0, 0, 0))
  const immersedTime = useRef(0)

  useFrame((_, delta) => {
    if (phase === 'idle') {
      // Default: front view of the box
      targetPos.current.set(0, 2, 6)
      targetLook.current.set(0, 0, 0)
    }

    if (phase === 'opening' || phase === 'opened') {
      // Barely move - just lift up a tiny bit to see lid opening + particles above
      targetPos.current.set(0, 2.8, 5.8)
      targetLook.current.set(0, 0.5, 0)
    }

    if (phase === 'diving') {
      diveProgress.current += delta * 0.4
      const t = Math.min(diveProgress.current, 1)
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

      // Swoop from current position into the box
      targetPos.current.set(
        0,
        THREE.MathUtils.lerp(2.8, 0.3, ease),
        THREE.MathUtils.lerp(5.8, 0, ease)
      )
      targetLook.current.set(
        0,
        THREE.MathUtils.lerp(0.5, 0, ease),
        THREE.MathUtils.lerp(0, -2, ease)
      )

      if (t >= 1) {
        setPhase('immersed')
        diveProgress.current = 0
      }
    }

    if (phase === 'immersed') {
      // Orbit around the cosmic world - use elapsedTime for consistent orbit
      immersedTime.current += delta
      const time = immersedTime.current * 0.3
      targetPos.current.set(
        Math.sin(time) * 4,
        1.5 + Math.sin(time * 0.7) * 1,
        Math.cos(time) * 4
      )
      targetLook.current.set(0, 0, 0)
    }

    // Smooth camera interpolation
    const speed = phase === 'diving' ? 2 : 1.5
    camera.position.lerp(targetPos.current, delta * speed)
    currentLook.current.lerp(targetLook.current, delta * speed)
    camera.lookAt(currentLook.current)
  })

  const showBox = phase !== 'immersed'
  const showWorld = phase !== 'idle'

  return (
    <>
      <color attach="background" args={['#000005']} />
      <ambientLight intensity={0.8} />
      <pointLight position={[5, 5, 5]} intensity={2} />
      <pointLight position={[-3, 2, -3]} intensity={1.2} color="#4488ff" />
      <pointLight position={[0, 3, 0]} intensity={1} color="#ffffff" />
      <pointLight position={[0, -2, 3]} intensity={0.8} color="#6644cc" />

      {/* The 3D Box */}
      {showBox && <Box phase={phase} setPhase={setPhase} />}

      {/* Star field */}
      <StarField
        count={phase === 'immersed' ? 5000 : 800}
        radius={phase === 'immersed' ? 50 : 20}
      />

      {/* Gemini sparkle particles dropping into the box */}
      <GeminiParticles phase={phase} />

      {/* Cosmic world - appears when box opens, expands when immersed */}
      {showWorld && <CosmicWorld phase={phase} />}

      {/* fog removed for brightness */}
    </>
  )
}
