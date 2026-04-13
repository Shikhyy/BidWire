'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

function Particles({ count = 500 }) {
  const ref = useRef<any>();
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = 2 + Math.random() * 3;
      pos[i * 3] = r * Math.cos(theta);
      pos[i * 3 + 1] = (Math.random() - 0.5) * 4;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    return pos;
  }, [count]);

  const colors = useMemo(() => {
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      col[i * 3] = 0.87 + Math.random() * 0.13;
      col[i * 3 + 1] = 0.89 + Math.random() * 0.11;
      col[i * 3 + 2] = 1;
    }
    return col;
  }, [count]);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.03;
    }
  });

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
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

export default function BidOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <Particles count={300} />
      </Canvas>
    </div>
  );
}