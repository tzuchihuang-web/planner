"use client";

import { GoalsPanel } from "./GoalsPanel";
import { FurniturePanel } from "./FurniturePanel";
import { ItemDetailsPanel } from "./ItemDetailsPanel";
import { ControlsPanel } from "./ControlsPanel";
import { ViewToggle } from "./ViewToggle";
import { useStudioStore } from "@/lib/store";

export function ToolPanel() {
  const isWalkthroughActive = useStudioStore((state) => state.isWalkthroughActive);

  if (isWalkthroughActive) {
    return (
      <aside className="w-64 bg-card border-r border-border p-4 flex flex-col">
        <h1 className="text-lg font-semibold mb-4">Studio Planner</h1>
        <ControlsPanel />
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-card border-r border-border p-4 flex flex-col gap-5 overflow-y-auto">
      <div>
        <h1 className="text-lg font-semibold mb-3">Studio Planner</h1>
        <ViewToggle />
      </div>

      <div className="border-t border-border pt-4">
        <GoalsPanel />
      </div>

      <div className="border-t border-border pt-4">
        <FurniturePanel />
      </div>

      <div className="border-t border-border pt-4">
        <ItemDetailsPanel />
      </div>

      {/* Help text */}
      <div className="border-t border-border pt-4 text-xs text-muted-foreground space-y-1">
        <p>Click furniture to select, click again to drag</p>
        <p>Delete or Backspace to remove selected</p>
        <p>Ctrl+Z to undo, Ctrl+Shift+Z to redo</p>
      </div>

      <div className="border-t border-border pt-4 mt-auto">
        <ControlsPanel />
      </div>
    </aside>
  );
}
