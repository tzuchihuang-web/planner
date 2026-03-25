"use client";

import { useStudioStore } from "@/lib/store";
import { FURNITURE_CATALOG } from "@/lib/furniture-catalog";
import { Trash2, RotateCw } from "lucide-react";

export function ItemDetailsPanel() {
  const { furniture, selectedId, deleteFurniture, rotateFurniture, pushUndo } = useStudioStore();

  const selectedItem = furniture.find((f) => f.id === selectedId);

  if (!selectedItem) {
    return (
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Selected Item
        </h3>
        <p className="text-sm text-muted-foreground italic">
          Click on furniture to select it
        </p>
      </div>
    );
  }

  const template = FURNITURE_CATALOG[selectedItem.type];
  const rotationDegrees = Math.round((selectedItem.rotation * 180) / Math.PI);

  const handleRotate = (degrees: number) => {
    pushUndo();
    const newRotation = selectedItem.rotation + (degrees * Math.PI) / 180;
    rotateFurniture(selectedItem.id, newRotation);
  };

  const handleDelete = () => {
    deleteFurniture(selectedItem.id);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Selected Item
      </h3>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{template.label}</span>
          <div
            className="w-4 h-4 rounded border border-border"
            style={{ backgroundColor: selectedItem.color }}
          />
        </div>

        {/* Position info */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-secondary rounded p-1.5 text-center">
            <span className="text-muted-foreground">X: </span>
            <span className="font-mono">{selectedItem.position[0].toFixed(1)}</span>
          </div>
          <div className="bg-secondary rounded p-1.5 text-center">
            <span className="text-muted-foreground">Y: </span>
            <span className="font-mono">{selectedItem.position[1].toFixed(1)}</span>
          </div>
          <div className="bg-secondary rounded p-1.5 text-center">
            <span className="text-muted-foreground">Z: </span>
            <span className="font-mono">{selectedItem.position[2].toFixed(1)}</span>
          </div>
        </div>

        {/* Rotation controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Rotation:</span>
          <span className="text-xs font-mono flex-1">{rotationDegrees % 360}°</span>
          <button
            onClick={() => handleRotate(-45)}
            className="p-1.5 rounded bg-secondary hover:bg-secondary/70 transition-colors"
            title="Rotate -45°"
          >
            <RotateCw size={14} className="transform -scale-x-100" />
          </button>
          <button
            onClick={() => handleRotate(45)}
            className="p-1.5 rounded bg-secondary hover:bg-secondary/70 transition-colors"
            title="Rotate +45°"
          >
            <RotateCw size={14} />
          </button>
        </div>

        {/* Delete button */}
        <button
          onClick={handleDelete}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-sm font-medium"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </div>
  );
}
