"use client";

import { Canvas } from "@react-three/fiber";
import { ApartmentGeometry } from "./ApartmentGeometry";
import { FurnitureGroup } from "./FurnitureGroup";
import { Lighting } from "./Lighting";
import { CameraController } from "./CameraController";
import { PathReveal } from "./PathReveal";
import { GuidedWalkthrough } from "./GuidedWalkthrough";
import { useStudioStore } from "@/lib/store";

export function ApartmentScene() {
  const { 
    viewMode, 
    selectFurniture, 
    walkthroughWarning, 
    exitGuidedWalkthrough,
    exitWalkthrough,
    movementPaths,
    selectedPathId,
    showPathReveal,
    togglePathReveal,
  } = useStudioStore();

  const currentPath = selectedPathId 
    ? movementPaths.find(p => p.id === selectedPathId)
    : movementPaths[0];

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

        {/* Path visualization for Studio B */}
        <PathReveal />

        {/* Guided walkthrough controller */}
        <GuidedWalkthrough />

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
          <button
            onClick={exitWalkthrough}
            className="mt-2 px-3 py-1 bg-primary text-primary-foreground rounded text-xs font-medium hover:bg-primary/90"
          >
            Back to Design
          </button>
        </div>
      )}

      {/* Guided Walkthrough overlay */}
      {viewMode === "guidedWalkthrough" && (
        <>
          {/* Warning banner */}
          {walkthroughWarning && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-500/90 backdrop-blur-sm px-4 py-2 rounded-lg text-sm text-black shadow-lg animate-pulse">
              {walkthroughWarning}
            </div>
          )}

          {/* Current path info */}
          <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm px-4 py-2 rounded-lg text-sm shadow-lg">
            <p className="font-medium">Guided Walkthrough</p>
            {currentPath && (
              <>
                <p className="text-muted-foreground text-xs mt-1">
                  {currentPath.name}
                </p>
                <p className="text-muted-foreground text-xs mt-2">
                  {currentPath.points.filter(p => p.status === "blocked").length > 0 
                    ? "⚠️ Path has blocked sections"
                    : currentPath.points.filter(p => p.status === "tight").length > 0
                    ? "Path has tight areas"
                    : "Clear path ahead"}
                </p>
              </>
            )}
          </div>

          {/* Exit button */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm px-4 py-2 rounded-lg text-sm shadow-lg">
            <p className="text-muted-foreground text-xs mb-2">
              Following movement paths...
            </p>
            <button
              onClick={exitGuidedWalkthrough}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90"
            >
              Back to Design
            </button>
          </div>
        </>
      )}

      {/* Path Reveal overlay */}
      {viewMode === "pathReveal" && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm px-4 py-3 rounded-lg text-sm shadow-lg">
          <p className="font-medium mb-2">Path Reveal Mode</p>
          <div className="flex gap-4 text-xs text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Clear
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              Tight
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Blocked
            </div>
          </div>
          <button
            onClick={togglePathReveal}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90"
          >
            Back to Design
          </button>
        </div>
      )}
    </div>
  );
}
