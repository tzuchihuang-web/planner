"use client";

import { useRef, useEffect, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, PointerLockControls } from "@react-three/drei";
import * as THREE from "three";
import { useStudioStore } from "@/lib/store";
import { APARTMENT } from "@/lib/apartment-dimensions";
import { isPointWalkable, getFurnitureAABB, aabbOverlap } from "@/lib/collision-detection";
import type { AABB } from "@/lib/types";

const MOVE_SPEED = 3;
const EYE_HEIGHT = 1.7;
const PLAYER_RADIUS = 0.25;

export function CameraController() {
  const { viewMode, furniture, exitWalkthrough, selectFurniture } = useStudioStore();
  const { camera } = useThree();

  // Movement state for walkthrough
  const moveState = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());

  // Set up keyboard controls for walkthrough
  useEffect(() => {
    if (viewMode !== "walkthrough") return;

    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyW":
        case "ArrowUp":
          moveState.current.forward = true;
          break;
        case "KeyS":
        case "ArrowDown":
          moveState.current.backward = true;
          break;
        case "KeyA":
        case "ArrowLeft":
          moveState.current.left = true;
          break;
        case "KeyD":
        case "ArrowRight":
          moveState.current.right = true;
          break;
        case "Escape":
          exitWalkthrough();
          break;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyW":
        case "ArrowUp":
          moveState.current.forward = false;
          break;
        case "KeyS":
        case "ArrowDown":
          moveState.current.backward = false;
          break;
        case "KeyA":
        case "ArrowLeft":
          moveState.current.left = false;
          break;
        case "KeyD":
        case "ArrowRight":
          moveState.current.right = false;
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      // Reset movement state
      moveState.current = { forward: false, backward: false, left: false, right: false };
    };
  }, [viewMode, exitWalkthrough]);

  // Check collision with furniture
  const checkFurnitureCollision = useCallback(
    (x: number, z: number): boolean => {
      const playerAABB: AABB = {
        minX: x - PLAYER_RADIUS,
        maxX: x + PLAYER_RADIUS,
        minZ: z - PLAYER_RADIUS,
        maxZ: z + PLAYER_RADIUS,
      };

      for (const item of furniture) {
        const furnitureAABB = getFurnitureAABB(item);
        // Expand furniture AABB slightly for collision
        const expandedAABB: AABB = {
          minX: furnitureAABB.minX - 0.1,
          maxX: furnitureAABB.maxX + 0.1,
          minZ: furnitureAABB.minZ - 0.1,
          maxZ: furnitureAABB.maxZ + 0.1,
        };
        if (aabbOverlap(playerAABB, expandedAABB)) {
          return true;
        }
      }
      return false;
    },
    [furniture]
  );

  // Movement in walkthrough mode
  useFrame((_, delta) => {
    if (viewMode !== "walkthrough") return;

    const { forward, backward, left, right } = moveState.current;

    // Calculate desired movement direction
    direction.current.z = Number(forward) - Number(backward);
    direction.current.x = Number(right) - Number(left);
    direction.current.normalize();

    // Apply movement relative to camera direction
    if (forward || backward || left || right) {
      const cameraDirection = new THREE.Vector3();
      camera.getWorldDirection(cameraDirection);
      cameraDirection.y = 0;
      cameraDirection.normalize();

      const rightDirection = new THREE.Vector3();
      rightDirection.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0));

      velocity.current.set(0, 0, 0);
      velocity.current.addScaledVector(cameraDirection, direction.current.z);
      velocity.current.addScaledVector(rightDirection, direction.current.x);
      velocity.current.normalize();
      velocity.current.multiplyScalar(MOVE_SPEED * delta);

      // Calculate new position
      const newX = camera.position.x + velocity.current.x;
      const newZ = camera.position.z + velocity.current.z;

      // Check collision with walls
      const canMoveX = isPointWalkable(newX, camera.position.z, PLAYER_RADIUS);
      const canMoveZ = isPointWalkable(camera.position.x, newZ, PLAYER_RADIUS);

      // Check collision with furniture
      const hitFurnitureX = checkFurnitureCollision(newX, camera.position.z);
      const hitFurnitureZ = checkFurnitureCollision(camera.position.x, newZ);

      // Apply movement with collision response (slide along walls)
      if (canMoveX && !hitFurnitureX) {
        camera.position.x = newX;
      }
      if (canMoveZ && !hitFurnitureZ) {
        camera.position.z = newZ;
      }

      // Keep eye height constant
      camera.position.y = EYE_HEIGHT;
    }
  });

  // Set initial camera position based on view mode
  useEffect(() => {
    if (viewMode === "topdown") {
      // Angled ~45 degree top-down view for better spatial understanding
      camera.position.set(APARTMENT.width / 2, 14, APARTMENT.depth / 2 + 8);
      camera.lookAt(APARTMENT.width / 2, 0, APARTMENT.depth / 2);
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = 45;
        camera.updateProjectionMatrix();
      }
    } else if (viewMode === "3d") {
      // 45-degree angled view - zoomed out to see full layout
      camera.position.set(APARTMENT.width / 2, 12, APARTMENT.depth + 10);
      camera.lookAt(APARTMENT.width / 2, 0, APARTMENT.depth / 2);
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = 50;
        camera.updateProjectionMatrix();
      }
    } else if (viewMode === "walkthrough") {
      // Start near the entry
      camera.position.set(1.5, EYE_HEIGHT, 1.5);
      camera.lookAt(6, EYE_HEIGHT, 2.5);
    }
    selectFurniture(null);
  }, [viewMode, camera, selectFurniture]);

  // Orbit controls for 3D and top-down view
  if (viewMode === "topdown") {
    return (
      <OrbitControls
        enableRotate={true}
        enablePan={true}
        enableZoom={true}
        minDistance={8}
        maxDistance={25}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.5}
        target={[APARTMENT.width / 2, 0, APARTMENT.depth / 2]}
      />
    );
  }

  if (viewMode === "3d") {
    return (
      <OrbitControls
        enableRotate={true}
        enablePan={true}
        enableZoom={true}
        minDistance={5}
        maxDistance={30}
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 2 - 0.1}
        target={[APARTMENT.width / 2, 0, APARTMENT.depth / 2]}
      />
    );
  }

  // Pointer lock controls for walkthrough
  if (viewMode === "walkthrough") {
    return (
      <PointerLockControls
        onUnlock={() => {
          // Optional: exit walkthrough when pointer lock is released
        }}
      />
    );
  }

  return null;
}
