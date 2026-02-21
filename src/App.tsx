import { Canvas } from '@react-three/fiber'
import { Suspense, useState, useCallback } from 'react'
import { Scene } from './components/Scene'
import './index.css'

export type Phase = 'idle' | 'opening' | 'opened' | 'diving' | 'immersed'

function App() {
  const [phase, setPhase] = useState<Phase>('idle')

  const handleClick = useCallback(() => {
    if (phase === 'idle') {
      setPhase('opening')
    } else if (phase === 'opened') {
      setPhase('diving')
    }
  }, [phase])

  const hint =
    phase === 'idle'
      ? 'Click to open'
      : phase === 'opened'
        ? 'Click to dive in'
        : null

  return (
    <>
      <Canvas
        camera={{ position: [0, 2, 6], fov: 50 }}
        gl={{ antialias: true }}
        onClick={handleClick}
        style={{ cursor: phase === 'immersed' ? 'default' : 'pointer' }}
      >
        <Suspense fallback={null}>
          <Scene phase={phase} setPhase={setPhase} />
        </Suspense>
      </Canvas>
      <div className="overlay">
        <p className={`overlay-text ${hint ? 'pulse' : 'hidden'}`}>
          {hint ?? ''}
        </p>
      </div>
    </>
  )
}

export default App
