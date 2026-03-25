"use client";

import { Canvas } from "@react-three/fiber";
import { ApartmentGeometry } from "./ApartmentGeometry";
import { FurnitureGroup } from "./FurnitureGroup";
import { Lighting } from "./Lighting";
import { CameraController } from "./CameraController";
import { useStudioStore } from "@/lib/store";

export function ApartmentScene() {
  const { viewMode, selectFurniture } = useStudioStore();

  const handleCanvasClick = () => {
    // Deselect when clicking on empty space (not on furniture)
    // This is handled by stopPropagation in FurnitureItem
  };

  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        camera={{ fov: 50, near: 0.1, far: 100 }}
        onPointerMissed={() => {
          if (viewMode !== "walkthrough") {
            selectFurniture(null);
          }
        }}
      >
        {/* Background color */}
        <color attach="background" args={["#e8e4e0"]} />

        {/* Lighting */}
        <Lighting />

        {/* Apartment structure */}
        <ApartmentGeometry />

        {/* Furniture */}
        <FurnitureGroup />

        {/* Camera controls based on view mode */}
        <CameraController />
      </Canvas>

      {/* Walkthrough overlay instructions */}
      {viewMode === "walkthrough" && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm px-4 py-2 rounded-lg text-sm text-card-foreground shadow-lg">
          <p className="font-medium">Walkthrough Mode</p>
          <p className="text-muted-foreground">
            Click to look around | WASD to move | ESC to exit
          </p>
        </div>
      )}
    </div>
  );
}
