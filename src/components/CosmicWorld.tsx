import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Phase } from '../App'

interface CosmicWorldProps {
  phase: Phase
}

function Nebula({ position, color, scale }: {
  position: [number, number, number]
  color: string
  scale: number
}) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.rotation.z += delta * 0.1
    ref.current.rotation.x += delta * 0.05
  })

  return (
    <mesh ref={ref} position={position} scale={scale}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.35}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}

function FloatingRing({ radius, color, speed, tilt }: {
  radius: number
  color: string
  speed: number
  tilt: [number, number, number]
}) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.rotation.z += delta * speed
  })

  return (
    <mesh ref={ref} rotation={tilt}>
      <torusGeometry args={[radius, 0.02, 8, 64]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}

function ParticleStream({ count = 200, color = '#4488ff' }) {
  const ref = useRef<THREE.Points>(null)

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const angle = (i / count) * Math.PI * 8
      const r = 0.3 + (i / count) * 2
      pos[i3] = Math.cos(angle) * r
      pos[i3 + 1] = (Math.random() - 0.5) * 3
      pos[i3 + 2] = Math.sin(angle) * r
    }
    return pos
  }, [count])

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.y = state.clock.elapsedTime * 0.15
    const posAttr = ref.current.geometry.attributes.position
    const arr = posAttr.array as Float32Array
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += 0.01
      if (arr[i * 3 + 1] > 2) arr[i * 3 + 1] = -2
    }
    posAttr.needsUpdate = true
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
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color={color}
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}

function Planet({ position, radius, color, ringColor }: {
  position: [number, number, number]
  radius: number
  color: string
  ringColor?: string
}) {
  const ref = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.rotation.y += delta * 0.2
  })

  return (
    <group ref={ref} position={position}>
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
          roughness={0.7}
        />
      </mesh>
      {ringColor && (
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[radius * 1.6, 0.03, 8, 64]} />
          <meshBasicMaterial
            color={ringColor}
            transparent
            opacity={0.5}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
      {/* Atmosphere glow */}
      <mesh scale={1.15}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.1}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

export function CosmicWorld({ phase }: CosmicWorldProps) {
  const groupRef = useRef<THREE.Group>(null)
  const scaleRef = useRef(phase === 'immersed' ? 1 : 0.01)

  useFrame((_, delta) => {
    if (!groupRef.current) return

    // Scale: tiny in box -> full size when immersed
    const targetScale = phase === 'immersed' ? 1.5 : phase === 'diving' ? 0.6 : 0.2
    const lerpSpeed = phase === 'immersed' ? 2.5 : phase === 'diving' ? 2 : 2
    scaleRef.current += (targetScale - scaleRef.current) * delta * lerpSpeed
    groupRef.current.scale.setScalar(scaleRef.current)

    // Gentle rotation
    groupRef.current.rotation.y += delta * 0.03
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Central bright star */}
      <mesh>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Glow around central star */}
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial
          color="#aaccff"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={4} color="#aaccff" distance={25} />

      {/* Nebulae - kept within ~3 unit radius */}
      <Nebula position={[1.5, 0.8, -0.8]} color="#4400aa" scale={1.8} />
      <Nebula position={[-1, -0.3, 1]} color="#0044aa" scale={1.5} />
      <Nebula position={[0, 1.5, 0]} color="#aa0066" scale={1.4} />
      <Nebula position={[-1.5, 0, -1.5]} color="#006688" scale={2} />

      {/* Floating rings */}
      <FloatingRing radius={1.5} color="#4488ff" speed={0.3} tilt={[0.3, 0, 0]} />
      <FloatingRing radius={2.2} color="#8844ff" speed={-0.2} tilt={[0.8, 0.5, 0]} />
      <FloatingRing radius={3} color="#44aaff" speed={0.15} tilt={[1.2, 0.2, 0.3]} />

      {/* Particle streams */}
      <ParticleStream count={300} color="#4488ff" />
      <ParticleStream count={200} color="#aa44ff" />

      {/* Planets */}
      <Planet position={[2, 0.4, -1.5]} radius={0.25} color="#4466aa" ringColor="#6688cc" />
      <Planet position={[-1.8, -0.2, 1.5]} radius={0.15} color="#aa4444" />
      <Planet position={[0.8, -0.8, 2]} radius={0.35} color="#44aa66" ringColor="#66ccaa" />
    </group>
  )
}
