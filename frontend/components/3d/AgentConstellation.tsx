'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

const AGENT_COLORS = ['#efd3d7', '#cbc0d3', '#dee2ff', '#feeafa', '#8e9aaf'];

function Constellation() {
  const ref = useRef<THREE.Group>(null);
  
  const agents = [
    { x: 0, y: 1.5, z: 0 },
    { x: -1.3, y: -0.5, z: 0.5 },
    { x: 1.3, y: -0.5, z: 0.5 },
    { x: -0.7, y: -1, z: -1 },
    { x: 0.7, y: -1, z: -1 },
  ];

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <group ref={ref}>
      {agents.map((pos, i) => (
        <group key={i} position={[pos.x, pos.y, pos.z]}>
          <mesh>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshBasicMaterial color={AGENT_COLORS[i]} />
          </mesh>
          <mesh scale={[1.2, 1.2, 1.2]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshBasicMaterial color={AGENT_COLORS[i]} transparent opacity={0.3} />
          </mesh>
        </group>
      ))}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[2, 0.01, 8, 64]} />
        <meshBasicMaterial color="#dee2ff" opacity={0.3} transparent />
      </mesh>
    </group>
  );
}

export default function AgentConstellation() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10">
      <Canvas camera={{ position: [0, 0, 4], fov: 60 }}>
        <Constellation />
      </Canvas>
    </div>
  );
}