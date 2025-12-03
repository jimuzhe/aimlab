
import React, { useRef, useState, useEffect } from 'react';
import { useThree, useFrame, createPortal } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { Gun } from './Gun';
import { GameState } from '../types';

interface PlayerProps {
  gameState: GameState;
  onShoot: (raycaster: THREE.Raycaster) => void;
}

export const Player: React.FC<PlayerProps> = ({ gameState, onShoot }) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  
  // Movement State
  const [moveForward, setMoveForward] = useState(false);
  const [moveBackward, setMoveBackward] = useState(false);
  const [moveLeft, setMoveLeft] = useState(false);
  const [moveRight, setMoveRight] = useState(false);
  const [isShooting, setIsShooting] = useState(false);
  
  // Physics / Movement Calc
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const speed = 20.0; // Base movement speed
  
  // Keyboard Listeners
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': setMoveForward(true); break;
        case 'ArrowLeft':
        case 'KeyA': setMoveLeft(true); break;
        case 'ArrowDown':
        case 'KeyS': setMoveBackward(true); break;
        case 'ArrowRight':
        case 'KeyD': setMoveRight(true); break;
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': setMoveForward(false); break;
        case 'ArrowLeft':
        case 'KeyA': setMoveLeft(false); break;
        case 'ArrowDown':
        case 'KeyS': setMoveBackward(false); break;
        case 'ArrowRight':
        case 'KeyD': setMoveRight(false); break;
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Mouse Click (Shooting)
  useEffect(() => {
    // Only allow shooting if strictly PLAYING
    if (gameState !== GameState.PLAYING) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;

      setIsShooting(true);
      
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      
      onShoot(raycaster);

      setTimeout(() => setIsShooting(false), 50);
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [gameState, camera, onShoot]);

  // Main Loop
  useFrame((state, delta) => {
    if (gameState !== GameState.PLAYING) return;

    // Apply damping (friction)
    velocity.current.x -= velocity.current.x * 10.0 * delta;
    velocity.current.z -= velocity.current.z * 10.0 * delta;

    // Calculate direction
    direction.current.z = Number(moveForward) - Number(moveBackward);
    direction.current.x = Number(moveRight) - Number(moveLeft);
    direction.current.normalize();

    // Apply acceleration
    if (moveForward || moveBackward) velocity.current.z -= direction.current.z * 200.0 * delta;
    if (moveLeft || moveRight) velocity.current.x -= direction.current.x * 200.0 * delta;

    // Update Controls
    if (controlsRef.current) {
        controlsRef.current.moveRight(-velocity.current.x * delta * speed * 0.005);
        controlsRef.current.moveForward(-velocity.current.z * delta * speed * 0.005);
    }
    
    // Lock Y position (stay on floor) - Raised to 2.0 for better perspective
    camera.position.y = 2.0; 
  });

  // Lock Cursor Management
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      // Try to lock immediately if ref exists
      if (controlsRef.current) {
        controlsRef.current.lock();
      }
    } else {
      // Forcefully exit pointer lock to ensure cursor appears
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    }
  }, [gameState]);

  return (
    <>
      {/* Only render PointerLockControls when playing to strictly prevent auto-locking in menus */}
      {gameState === GameState.PLAYING && (
        <PointerLockControls ref={controlsRef} selector="#root" />
      )}
      
      {createPortal(
        <Gun 
          isShooting={isShooting} 
          isMoving={(moveForward || moveBackward || moveLeft || moveRight) && gameState === GameState.PLAYING} 
        />,
        camera
      )}
    </>
  );
};
