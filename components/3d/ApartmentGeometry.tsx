"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { APARTMENT, APARTMENT_COLORS } from "@/lib/apartment-dimensions";

// Wall component
function Wall({
  position,
  size,
  color = APARTMENT_COLORS.walls,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

export function ApartmentGeometry() {
  const { width, depth, height, wallThickness, bathroom, kitchen, entry } = APARTMENT;

  // Floor with grid pattern
  const floorTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    // Base color
    ctx.fillStyle = APARTMENT_COLORS.floor;
    ctx.fillRect(0, 0, 512, 512);

    // Grid lines
    ctx.strokeStyle = "#d0ccc5";
    ctx.lineWidth = 1;
    const gridSize = 512 / 12; // 1m grid

    for (let i = 0; i <= 12; i++) {
      ctx.beginPath();
      ctx.moveTo(i * gridSize, 0);
      ctx.lineTo(i * gridSize, 512);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * gridSize);
      ctx.lineTo(512, i * gridSize);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    return texture;
  }, []);

  return (
    <group>
      {/* Main Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[width / 2, 0, depth / 2]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial map={floorTexture} />
      </mesh>

      {/* === WALLS === */}

      {/* Back wall (z = depth) - full width */}
      <Wall
        position={[width / 2, height / 2, depth - wallThickness / 2]}
        size={[width, height, wallThickness]}
      />

      {/* Front wall (z = 0) - full width */}
      <Wall
        position={[width / 2, height / 2, wallThickness / 2]}
        size={[width, height, wallThickness]}
      />

      {/* Right wall (x = width) */}
      <Wall
        position={[width - wallThickness / 2, height / 2, depth / 2]}
        size={[wallThickness, height, depth]}
      />

      {/* Left wall (x = 0) - with entry opening */}
      {/* Below entry */}
      <Wall
        position={[
          wallThickness / 2,
          height / 2,
          (entry.position.z - entry.width / 2) / 2,
        ]}
        size={[wallThickness, height, entry.position.z - entry.width / 2]}
      />
      {/* Above entry */}
      <Wall
        position={[
          wallThickness / 2,
          height / 2,
          (entry.position.z + entry.width / 2 + depth) / 2,
        ]}
        size={[
          wallThickness,
          height,
          depth - (entry.position.z + entry.width / 2),
        ]}
      />

      {/* === BATHROOM === */}
      {/* Bathroom floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[
          bathroom.width / 2 + wallThickness,
          0.01,
          depth - bathroom.depth / 2 - wallThickness,
        ]}
        receiveShadow
      >
        <planeGeometry args={[bathroom.width, bathroom.depth]} />
        <meshStandardMaterial color={APARTMENT_COLORS.bathroom} />
      </mesh>

      {/* Bathroom walls */}
      {/* Bathroom front wall (facing living area) */}
      <Wall
        position={[
          bathroom.width / 2 + wallThickness,
          height / 2,
          depth - bathroom.depth - wallThickness / 2,
        ]}
        size={[bathroom.width, height, wallThickness]}
        color={APARTMENT_COLORS.bathroomWalls}
      />
      {/* Bathroom right wall (separating from main area) - with door opening */}
      <Wall
        position={[
          bathroom.width + wallThickness + wallThickness / 2,
          height / 2,
          depth - bathroom.depth / 2 - wallThickness / 2,
        ]}
        size={[wallThickness, height, bathroom.depth + wallThickness]}
        color={APARTMENT_COLORS.bathroomWalls}
      />

      {/* === KITCHEN COUNTER === */}
      {/* Kitchen counter */}
      <mesh
        position={[
          bathroom.width + wallThickness + kitchen.width / 2 + 0.3,
          0.9 / 2,
          depth - kitchen.depth / 2 - wallThickness - 0.1,
        ]}
      >
        <boxGeometry args={[kitchen.width, 0.9, kitchen.depth]} />
        <meshStandardMaterial color={APARTMENT_COLORS.kitchen} />
      </mesh>

      {/* Kitchen backsplash */}
      <mesh
        position={[
          bathroom.width + wallThickness + kitchen.width / 2 + 0.3,
          0.9 + 0.3,
          depth - wallThickness - 0.05,
        ]}
      >
        <boxGeometry args={[kitchen.width, 0.6, 0.1]} />
        <meshStandardMaterial color="#c5bfb5" />
      </mesh>

      {/* Ceiling (optional, for enclosed feeling) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[width / 2, height, depth / 2]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#faf9f7" side={THREE.BackSide} />
      </mesh>
    </group>
  );
}
