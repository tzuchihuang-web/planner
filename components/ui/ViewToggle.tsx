"use client";

import { useStudioStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ViewToggle() {
  const { viewMode, setViewMode, isWalkthroughActive } = useStudioStore();

  if (isWalkthroughActive) return null;

  return (
    <div className="flex gap-1 p-1 bg-secondary rounded-lg">
      <button
        onClick={() => setViewMode("topdown")}
        className={cn(
          "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
          viewMode === "topdown"
            ? "bg-card text-card-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Top-Down
      </button>
      <button
        onClick={() => setViewMode("3d")}
        className={cn(
          "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
          viewMode === "3d"
            ? "bg-card text-card-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        3D View
      </button>
    </div>
  );
}
