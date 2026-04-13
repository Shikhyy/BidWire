'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Background3DProps {
  variant?: 'particles' | 'neural' | 'vortex' | 'constellation';
  speed?: number;
}

function ParticleField({ count = 200 }) {
  const ref = useRef<THREE.Points>(null);
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4 - 2;
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#dee2ff" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

function NeuralNetwork({ count = 20 }) {
  const ref = useRef<THREE.Group>(null);
  
  const nodes = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 5,
      y: (Math.random() - 0.5) * 4,
      z: -2 + Math.random(),
    }));
  }, [count]);

  useFrame((state) => {
    if (ref.current) ref.current.rotation.z = state.clock.elapsedTime * 0.05;
  });

  return (
    <group ref={ref}>
      {nodes.map((n, i) => (
        <mesh key={i} position={[n.x, n.y, n.z]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#cbc0d3" />
        </mesh>
      ))}
      {nodes.slice(0, 10).map((n, i) => (
        <line key={`line-${i}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([n.x, n.y, n.z, nodes[(i + 5) % count].x, nodes[(i + 5) % count].y, nodes[(i + 5) % count].z])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#dee2ff" opacity={0.15} transparent />
        </line>
      ))}
    </group>
  );
}

function Vortex({ speed = 1 }) {
  const ref = useRef<THREE.Group>(null);
  
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.z += delta * speed * 0.3;
    }
  });

  return (
    <group ref={ref}>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} rotation={[Math.PI / 4, i * 0.5, 0]}>
          <torusGeometry args={[0.8 + i * 0.3, 0.01, 8, 64]} />
          <meshBasicMaterial color="#efd3d7" transparent opacity={0.3 - i * 0.05} />
        </mesh>
      ))}
    </group>
  );
}

function Constellation() {
  const ref = useRef<THREE.Group>(null);
  const colors = ['#efd3d7', '#cbc0d3', '#dee2ff', '#feeafa', '#8e9aaf'];

  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.1;
  });

  const positions = [
    [0, 1.2, 0], [-1.5, -0.5, 0], [1.5, -0.5, 0],
    [-0.8, -1.2, 0], [0.8, -1.2, 0],
  ];

  return (
    <group ref={ref}>
      {positions.map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshBasicMaterial color={colors[i]} />
        </mesh>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2, 0.008, 8, 64]} />
        <meshBasicMaterial color="#dee2ff" opacity={0.2} transparent />
      </mesh>
    </group>
  );
}

export default function Background3D({ variant = 'particles', speed = 1 }: Background3DProps) {
  return (
    <div className="fixed inset-0 -z-10 opacity-40">
      <Canvas camera={{ position: [0, 0, 4], fov: 60 }}>
        {variant === 'particles' && <ParticleField />}
        {variant === 'neural' && <NeuralNetwork />}
        {variant === 'vortex' && <Vortex speed={speed} />}
        {variant === 'constellation' && <Constellation />}
      </Canvas>
    </div>
  );
}