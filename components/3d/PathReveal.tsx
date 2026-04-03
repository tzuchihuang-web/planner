"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStudioStore } from "@/lib/store";
import type { MovementPath, PathStatus } from "@/lib/types";

// Get color based on path status
function getStatusColor(status: PathStatus): string {
  switch (status) {
    case "clear":
      return "#22c55e"; // green
    case "tight":
      return "#eab308"; // yellow
    case "blocked":
      return "#ef4444"; // red
    default:
      return "#22c55e";
  }
}

// Single animated path line
function PathLine({ path }: { path: MovementPath }) {
  const lineRef = useRef<THREE.Line>(null);
  const dotRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(0);

  // Create geometry and colors for the path
  const { geometry, colors } = useMemo(() => {
    const points = path.points.map(p => new THREE.Vector3(p.x, 0.05, p.z));
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    // Create color array based on status
    const colors: number[] = [];
    path.points.forEach(point => {
      const color = new THREE.Color(getStatusColor(point.status));
      colors.push(color.r, color.g, color.b);
    });
    
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    return { geometry, colors };
  }, [path]);

  // Animate the dot along the path
  useFrame((_, delta) => {
    if (dotRef.current && path.points.length > 1) {
      progressRef.current += delta * 0.3;
      if (progressRef.current > 1) progressRef.current = 0;
      
      const index = Math.floor(progressRef.current * (path.points.length - 1));
      const nextIndex = Math.min(index + 1, path.points.length - 1);
      const localT = (progressRef.current * (path.points.length - 1)) % 1;
      
      const currentPoint = path.points[index];
      const nextPoint = path.points[nextIndex];
      
      const x = currentPoint.x + (nextPoint.x - currentPoint.x) * localT;
      const z = currentPoint.z + (nextPoint.z - currentPoint.z) * localT;
      
      dotRef.current.position.set(x, 0.15, z);
      
      // Update dot color based on current position status
      const material = dotRef.current.material as THREE.MeshBasicMaterial;
      material.color.set(getStatusColor(currentPoint.status));
    }
  });

  return (
    <group>
      {/* Path line */}
      <line ref={lineRef}>
        <bufferGeometry attach="geometry" {...geometry} />
        <lineBasicMaterial 
          vertexColors 
          linewidth={3}
          transparent
          opacity={0.8}
        />
      </line>

      {/* Glow effect - wider transparent line underneath */}
      <line>
        <bufferGeometry attach="geometry" {...geometry} />
        <lineBasicMaterial 
          vertexColors 
          linewidth={8}
          transparent
          opacity={0.3}
        />
      </line>

      {/* Animated walking dot */}
      <mesh ref={dotRef} position={[path.points[0]?.x || 0, 0.15, path.points[0]?.z || 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Start marker */}
      {path.points[0] && (
        <mesh position={[path.points[0].x, 0.1, path.points[0].z]}>
          <cylinderGeometry args={[0.15, 0.15, 0.02, 16]} />
          <meshBasicMaterial color={getStatusColor(path.points[0].status)} />
        </mesh>
      )}

      {/* End marker */}
      {path.points[path.points.length - 1] && (
        <mesh position={[path.points[path.points.length - 1].x, 0.1, path.points[path.points.length - 1].z]}>
          <cylinderGeometry args={[0.15, 0.15, 0.02, 16]} />
          <meshBasicMaterial color={getStatusColor(path.points[path.points.length - 1].status)} />
        </mesh>
      )}
    </group>
  );
}

export function PathReveal() {
  const { showPathReveal, movementPaths, viewMode } = useStudioStore();

  // Show paths in pathReveal mode or guidedWalkthrough mode
  if (!showPathReveal && viewMode !== "pathReveal" && viewMode !== "guidedWalkthrough") {
    return null;
  }

  return (
    <group>
      {movementPaths.map(path => (
        <PathLine key={path.id} path={path} />
      ))}
    </group>
  );
}
