'use client';

import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

function Vortex({ speed = 1 }: { speed?: number }) {
  const ref = useRef<THREE.Group>(null);
  const [active, setActive] = useState(true);

  useFrame((state, delta) => {
    if (ref.current && active) {
      ref.current.rotation.z += delta * speed * 0.5;
      ref.current.rotation.x += delta * speed * 0.2;
    }
  });

  const rings = 5;
  const segments = 32;

  return (
    <group ref={ref} rotation={[Math.PI / 4, 0, 0]}>
      {Array.from({ length: rings }).map((_, i) => {
        const radius = 0.5 + i * 0.3;
        const points: number[] = [];
        
        for (let j = 0; j <= segments; j++) {
          const theta = (j / segments) * Math.PI * 2;
          const variance = Math.sin(theta * 3 + i) * 0.05;
          points.push(
            (radius + variance) * Math.cos(theta),
            (radius + variance) * Math.sin(theta),
            i * 0.1
          );
        }

        return (
          <line key={i}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={points.length / 3}
                array={new Float32Array(points)}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color="#efd3d7"
              opacity={0.5 - i * 0.08}
              transparent
            />
          </line>
        );
      })}
    </group>
  );
}

export default function CountdownVortex({ speed = 1 }: { speed?: number }) {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10">
      <Canvas camera={{ position: [0, 0, 3], fov: 60 }}>
        <Vortex speed={speed} />
      </Canvas>
    </div>
  );
}