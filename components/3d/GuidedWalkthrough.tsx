"use client";

import { useRef, useEffect, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStudioStore } from "@/lib/store";
import { APARTMENT } from "@/lib/apartment-dimensions";
import { getFurnitureAABB, aabbOverlap } from "@/lib/collision-detection";

const EYE_HEIGHT = 1.7;
const WALK_SPEED = 1.5;
const LOOK_AHEAD_DISTANCE = 0.8;

export function GuidedWalkthrough() {
  const { 
    viewMode, 
    movementPaths, 
    furniture,
    exitGuidedWalkthrough,
    setWalkthroughWarning,
    currentPathIndex,
  } = useStudioStore();
  
  const { camera } = useThree();
  const progressRef = useRef(0);
  const pathIndexRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const pauseTimeRef = useRef(0);

  // Check for nearby furniture and generate warnings
  const checkForWarnings = useCallback((x: number, z: number): string | null => {
    const checkRadius = 0.8;
    const playerAABB = {
      minX: x - checkRadius,
      maxX: x + checkRadius,
      minZ: z - checkRadius,
      maxZ: z + checkRadius,
    };

    for (const item of furniture) {
      const furnitureAABB = getFurnitureAABB(item);
      
      // Expand for warning detection
      const warningAABB = {
        minX: furnitureAABB.minX - 0.5,
        maxX: furnitureAABB.maxX + 0.5,
        minZ: furnitureAABB.minZ - 0.5,
        maxZ: furnitureAABB.maxZ + 0.5,
      };

      if (aabbOverlap(playerAABB, warningAABB)) {
        // Very close - bump warning
        const tightAABB = {
          minX: furnitureAABB.minX - 0.2,
          maxX: furnitureAABB.maxX + 0.2,
          minZ: furnitureAABB.minZ - 0.2,
          maxZ: furnitureAABB.maxZ + 0.2,
        };
        
        if (aabbOverlap(playerAABB, tightAABB)) {
          return `You might bump into the ${item.type}`;
        }
        return "Path is narrow here";
      }
    }

    return null;
  }, [furniture]);

  // Set initial camera for guided walkthrough
  useEffect(() => {
    if (viewMode !== "guidedWalkthrough") return;
    
    progressRef.current = 0;
    pathIndexRef.current = 0;
    isAnimatingRef.current = true;
    pauseTimeRef.current = 0;

    // Start at the beginning of the first path
    const firstPath = movementPaths[0];
    if (firstPath && firstPath.points.length > 0) {
      const startPoint = firstPath.points[0];
      camera.position.set(startPoint.x, EYE_HEIGHT, startPoint.z);
      
      // Look toward second point
      if (firstPath.points.length > 1) {
        const nextPoint = firstPath.points[1];
        camera.lookAt(nextPoint.x, EYE_HEIGHT, nextPoint.z);
      }
    }
  }, [viewMode, movementPaths, camera]);

  // Animate along paths
  useFrame((_, delta) => {
    if (viewMode !== "guidedWalkthrough" || !isAnimatingRef.current) return;
    if (movementPaths.length === 0) return;

    const currentPath = movementPaths[pathIndexRef.current];
    if (!currentPath || currentPath.points.length < 2) return;

    // Handle pause at end of path
    if (pauseTimeRef.current > 0) {
      pauseTimeRef.current -= delta;
      if (pauseTimeRef.current <= 0) {
        // Move to next path
        pathIndexRef.current++;
        if (pathIndexRef.current >= movementPaths.length) {
          // All paths done, restart
          pathIndexRef.current = 0;
        }
        progressRef.current = 0;
        setWalkthroughWarning(null);
      }
      return;
    }

    // Calculate movement
    const pathLength = currentPath.points.length - 1;
    progressRef.current += delta * WALK_SPEED / pathLength;

    if (progressRef.current >= 1) {
      progressRef.current = 1;
      pauseTimeRef.current = 2; // Pause for 2 seconds at destination
      return;
    }

    // Get current position on path
    const exactIndex = progressRef.current * pathLength;
    const index = Math.floor(exactIndex);
    const nextIndex = Math.min(index + 1, pathLength);
    const localT = exactIndex - index;

    const currentPoint = currentPath.points[index];
    const nextPoint = currentPath.points[nextIndex];

    // Interpolate position
    const x = currentPoint.x + (nextPoint.x - currentPoint.x) * localT;
    const z = currentPoint.z + (nextPoint.z - currentPoint.z) * localT;

    // Smoothly move camera
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, x, delta * 3);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, z, delta * 3);
    camera.position.y = EYE_HEIGHT;

    // Look ahead on the path
    const lookAheadIndex = Math.min(
      Math.floor(exactIndex + LOOK_AHEAD_DISTANCE * pathLength),
      pathLength
    );
    const lookAtPoint = currentPath.points[lookAheadIndex];
    
    const lookAtPos = new THREE.Vector3(lookAtPoint.x, EYE_HEIGHT, lookAtPoint.z);
    const currentLookAt = new THREE.Vector3();
    camera.getWorldDirection(currentLookAt);
    currentLookAt.add(camera.position);
    
    currentLookAt.lerp(lookAtPos, delta * 2);
    camera.lookAt(currentLookAt);

    // Check for warnings
    const warning = checkForWarnings(x, z);
    setWalkthroughWarning(warning);
  });

  // Keyboard handler for exit
  useEffect(() => {
    if (viewMode !== "guidedWalkthrough") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Escape") {
        exitGuidedWalkthrough();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, exitGuidedWalkthrough]);

  return null;
}
