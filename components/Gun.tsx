import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh } from 'three';

interface GunProps {
  isShooting: boolean;
  isMoving: boolean;
}

export const Gun: React.FC<GunProps> = ({ isShooting, isMoving }) => {
  const groupRef = useRef<Group>(null);
  const barrelRef = useRef<Mesh>(null);
  const recoilAnim = useRef(0);
  const bobAnim = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Recoil Logic
    if (isShooting) {
      recoilAnim.current = 0.2; // Kick back amount
    }

    // Smoothly recover from recoil
    recoilAnim.current = Math.max(0, recoilAnim.current - delta * 2);
    
    // Apply recoil position (kick back Z) and rotation (muzzle climb X)
    groupRef.current.position.z = -0.3 + recoilAnim.current;
    groupRef.current.rotation.x = recoilAnim.current * 0.5;

    // Movement Bobbing (Weapon Sway)
    if (isMoving) {
      bobAnim.current += delta * 10;
      groupRef.current.position.y = -0.4 + Math.sin(bobAnim.current) * 0.02;
      groupRef.current.position.x = 0.2 + Math.cos(bobAnim.current * 0.5) * 0.01;
    } else {
      // Return to idle breath
      bobAnim.current += delta * 2;
      groupRef.current.position.y = -0.4 + Math.sin(bobAnim.current) * 0.005;
      groupRef.current.position.x = 0.2; // Default right-hand side
    }
  });

  return (
    <group ref={groupRef} position={[0.2, -0.4, -0.5]}>
      {/* Gun Body */}
      <mesh position={[0, 0, 0.2]}>
        <boxGeometry args={[0.1, 0.15, 0.6]} />
        <meshStandardMaterial color="#333" roughness={0.5} metalness={0.8} />
      </mesh>

      {/* Grip/Handle (Angled) */}
      <mesh position={[0, -0.1, 0.4]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.08, 0.2, 0.1]} />
        <meshStandardMaterial color="#222" />
      </mesh>

      {/* Barrel */}
      <mesh ref={barrelRef} position={[0, 0.05, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.4, 16]} />
        <meshStandardMaterial color="#111" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Sight */}
      <mesh position={[0, 0.08, 0.4]}>
        <boxGeometry args={[0.02, 0.02, 0.05]} />
        <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={0.5} />
      </mesh>

      {/* Right Arm (Simplified) */}
      <mesh position={[0.1, -0.2, 0.6]} rotation={[-0.2, -0.1, 0]}>
        <cylinderGeometry args={[0.06, 0.07, 0.8]} />
        <meshStandardMaterial color="#d2b48c" /> {/* Skin tone placeholder */}
      </mesh>
    </group>
  );
};
