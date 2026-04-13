'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Mesh({ count = 50 }) {
  const ref = useRef<THREE.Group>(null);
  
  const nodes = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 6,
      y: (Math.random() - 0.5) * 4,
      z: (Math.random() - 0.5) * 2,
    }));
  }, [count]);

  const connections = useMemo(() => {
    const conns: [number, number][] = [];
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const dist = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
        if (dist < 1.5 && Math.random() > 0.7) {
          conns.push([i, j]);
        }
      }
    }
    return conns;
  }, [count, nodes]);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <group ref={ref}>
      {nodes.map((node, i) => (
        <mesh key={i} position={[node.x, node.y, node.z]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color="#cbc0d3" />
        </mesh>
      ))}
      {connections.map(([i, j], idx) => (
        <line key={idx}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([
                nodes[i].x, nodes[i].y, nodes[i].z,
                nodes[j].x, nodes[j].y, nodes[j].z,
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#dee2ff" opacity={0.2} transparent />
        </line>
      ))}
    </group>
  );
}

export default function NeuralMesh() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10">
      <Canvas camera={{ position: [0, 0, 4], fov: 60 }}>
        <Mesh count={40} />
      </Canvas>
    </div>
  );
}