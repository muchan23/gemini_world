import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Phase } from '../App'

interface BoxProps {
  phase: Phase
  setPhase: (phase: Phase) => void
}

function BoxFace({
  position,
  rotation,
  color,
  pivotPosition,
  pivotRotation,
}: {
  position: [number, number, number]
  rotation: [number, number, number]
  color: string
  pivotPosition?: [number, number, number]
  pivotRotation?: [number, number, number]
}) {
  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0.3,
        roughness: 0.2,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        transmission: 0.1,
      }),
    [color]
  )

  const geometry = useMemo(() => new THREE.PlaneGeometry(2, 2), [])

  if (pivotPosition) {
    return (
      <group position={pivotPosition} rotation={pivotRotation}>
        <mesh
          position={position}
          rotation={rotation}
          material={material}
          geometry={geometry}
        />
      </group>
    )
  }

  return (
    <mesh
      position={position}
      rotation={rotation}
      material={material}
      geometry={geometry}
    />
  )
}

export function Box({ phase, setPhase }: BoxProps) {
  const groupRef = useRef<THREE.Group>(null)
  const lidRef = useRef<THREE.Group>(null)
  const openAngle = useRef(0)
  const boxEdges = useRef<THREE.LineSegments>(null)

  // Subtle idle rotation
  const idleRotation = useRef(0)

  const edgesGeometry = useMemo(() => {
    const box = new THREE.BoxGeometry(2, 2, 2)
    return new THREE.EdgesGeometry(box)
  }, [])

  useFrame((_, delta) => {
    if (!groupRef.current) return

    // Idle floating animation
    if (phase === 'idle') {
      idleRotation.current += delta * 0.3
      groupRef.current.rotation.y = Math.sin(idleRotation.current) * 0.15
      groupRef.current.position.y = Math.sin(idleRotation.current * 1.5) * 0.1
    }

    // Opening animation
    if (phase === 'opening' && lidRef.current) {
      openAngle.current = Math.min(openAngle.current + delta * 2.5, Math.PI * 0.75)
      lidRef.current.rotation.x = -openAngle.current

      if (openAngle.current >= Math.PI * 0.74) {
        setPhase('opened')
      }
    }

    if (phase === 'opened' && lidRef.current) {
      lidRef.current.rotation.x = -Math.PI * 0.75
      // Fade walls to semi-transparent so the world inside glows through
      groupRef.current.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshPhysicalMaterial) {
          child.material.opacity = Math.max(child.material.opacity - delta * 0.5, 0.3)
        }
        child.traverse((node) => {
          if (node instanceof THREE.Mesh && node.material instanceof THREE.MeshPhysicalMaterial) {
            node.material.opacity = Math.max(node.material.opacity - delta * 0.5, 0.3)
          }
        })
      })
    }

    if (phase === 'diving' && lidRef.current) {
      // Keep lid open
      lidRef.current.rotation.x = -Math.PI * 0.75
      // Fade out box completely
      groupRef.current.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshPhysicalMaterial) {
          child.material.opacity = Math.max(child.material.opacity - delta * 1.5, 0)
        }
        child.traverse((node) => {
          if (node instanceof THREE.Mesh && node.material instanceof THREE.MeshPhysicalMaterial) {
            node.material.opacity = Math.max(node.material.opacity - delta * 1.5, 0)
          }
        })
      })
    }

    // Edge glow
    if (boxEdges.current) {
      const mat = boxEdges.current.material as THREE.LineBasicMaterial
      const pulse = (Math.sin(Date.now() * 0.003) + 1) / 2
      mat.opacity = 0.3 + pulse * 0.4
    }
  })

  const baseColor = '#2a2a4e'

  return (
    <group ref={groupRef}>
      {/* Bottom */}
      <BoxFace position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]} color={baseColor} />
      {/* Front */}
      <BoxFace position={[0, 0, 1]} rotation={[0, 0, 0]} color="#263056" />
      {/* Back */}
      <BoxFace position={[0, 0, -1]} rotation={[0, Math.PI, 0]} color="#263056" />
      {/* Left */}
      <BoxFace position={[-1, 0, 0]} rotation={[0, -Math.PI / 2, 0]} color="#1a4a80" />
      {/* Right */}
      <BoxFace position={[1, 0, 0]} rotation={[0, Math.PI / 2, 0]} color="#1a4a80" />

      {/* Lid - pivots from back edge */}
      <group ref={lidRef} position={[0, 1, -1]}>
        <BoxFace
          position={[0, 0, 1]}
          rotation={[-Math.PI / 2, 0, 0]}
          color="#1a1a2e"
        />
      </group>

      {/* Glowing edges */}
      <lineSegments ref={boxEdges} geometry={edgesGeometry}>
        <lineBasicMaterial color="#66aaff" transparent opacity={0.7} />
      </lineSegments>
    </group>
  )
}
