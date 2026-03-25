"use client";

import { useStudioStore } from "@/lib/store";
import { Undo2, RotateCcw, Eye } from "lucide-react";

export function ControlsPanel() {
  const { undo, redo, canUndo, canRedo, resetScene, setViewMode, isWalkthroughActive } =
    useStudioStore();

  if (isWalkthroughActive) {
    return (
      <button
        onClick={() => setViewMode("3d")}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-destructive text-white hover:bg-destructive/90 transition-colors text-sm font-medium"
      >
        Exit Walkthrough
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Controls
      </h3>

      <div className="flex gap-2">
        <button
          onClick={undo}
          disabled={!canUndo()}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-secondary hover:bg-secondary/70 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          <Undo2 size={14} />
          Undo
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-secondary hover:bg-secondary/70 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          <Undo2 size={14} className="transform -scale-x-100" />
          Redo
        </button>
      </div>

      <button
        onClick={resetScene}
        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-secondary hover:bg-secondary/70 transition-colors text-sm"
      >
        <RotateCcw size={14} />
        Reset Scene
      </button>

      <button
        onClick={() => setViewMode("walkthrough")}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
      >
        <Eye size={16} />
        Start Walkthrough
      </button>
    </div>
  );
}
