"use client";

import { useRef, useState, useEffect } from "react";
import { useThree, ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { Furniture } from "@/lib/types";
import { useStudioStore } from "@/lib/store";
import { clampToValidArea, validatePlacement } from "@/lib/collision-detection";

interface FurnitureItemProps {
  furniture: Furniture;
}

export function FurnitureItem({ furniture }: FurnitureItemProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dragStartRef = useRef<{ x: number; z: number } | null>(null);
  const initialPosRef = useRef<[number, number]>([0, 0]);

  const { camera, gl, raycaster } = useThree();
  const {
    selectedId,
    selectFurniture,
    moveFurniture,
    pushUndo,
    furniture: allFurniture,
    viewMode,
    scenario,
  } = useStudioStore();

  const isSelected = selectedId === furniture.id;
  const { position, rotation, dimensions, color } = furniture;

  // Floor plane for raycasting during drag
  const floorPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      raycaster.setFromCamera(mouse, camera);
      const intersection = new THREE.Vector3();
      raycaster.ray.intersectPlane(floorPlane.current, intersection);

      if (intersection && dragStartRef.current) {
        const deltaX = intersection.x - dragStartRef.current.x;
        const deltaZ = intersection.z - dragStartRef.current.z;

        const newX = initialPosRef.current[0] + deltaX;
        const newZ = initialPosRef.current[1] + deltaZ;

        // Clamp to valid area
        const [clampedX, clampedZ] = clampToValidArea(
          newX,
          newZ,
          dimensions.width,
          dimensions.depth
        );

        // Check if valid placement
        const testFurniture: Furniture = {
          ...furniture,
          position: [clampedX, position[1], clampedZ],
        };

        if (validatePlacement(testFurniture, allFurniture, scenario).valid) {
          moveFurniture(furniture.id, clampedX, clampedZ);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isDragging,
    camera,
    gl,
    raycaster,
    furniture,
    dimensions,
    position,
    moveFurniture,
    allFurniture,
    scenario,
  ]);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (viewMode === "walkthrough") return;
    e.stopPropagation();

    if (!isSelected) {
      selectFurniture(furniture.id);
      return;
    }

    // Start dragging if already selected
    pushUndo();
    setIsDragging(true);

    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    raycaster.setFromCamera(mouse, camera);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(floorPlane.current, intersection);

    dragStartRef.current = { x: intersection.x, z: intersection.z };
    initialPosRef.current = [position[0], position[2]];
  };

  // Calculate visual color based on state
  let displayColor = color;
  if (isSelected) {
    displayColor = "#4a90d9"; // Blue for selected
  } else if (isHovered) {
    displayColor = new THREE.Color(color).lerp(new THREE.Color("#ffffff"), 0.2).getHexString();
    displayColor = `#${displayColor}`;
  }

  return (
    <group position={[position[0], position[1], position[2]]} rotation={[0, rotation, 0]}>
      <mesh
        ref={meshRef}
        onPointerDown={handlePointerDown}
        onPointerOver={(e) => {
          if (viewMode !== "walkthrough") {
            e.stopPropagation();
            setIsHovered(true);
            gl.domElement.style.cursor = isSelected ? "grab" : "pointer";
          }
        }}
        onPointerOut={() => {
          setIsHovered(false);
          gl.domElement.style.cursor = "auto";
        }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[dimensions.width, dimensions.height, dimensions.depth]} />
        <meshStandardMaterial
          color={displayColor}
          transparent={isSelected}
          opacity={isSelected ? 0.9 : 1}
        />
      </mesh>

      {/* Selection outline */}
      {isSelected && (
        <mesh scale={[1.02, 1.02, 1.02]}>
          <boxGeometry args={[dimensions.width, dimensions.height, dimensions.depth]} />
          <meshBasicMaterial color="#2563eb" wireframe />
        </mesh>
      )}
    </group>
  );
}
