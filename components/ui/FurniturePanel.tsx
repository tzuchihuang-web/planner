"use client";

import { useStudioStore } from "@/lib/store";
import { FURNITURE_CATALOG, FURNITURE_TYPES } from "@/lib/furniture-catalog";
import {
  Bed,
  Monitor,
  Armchair,
  Library,
  Sofa,
  Square,
  Archive,
  type LucideIcon,
} from "lucide-react";
import type { FurnitureType } from "@/lib/types";

const FURNITURE_ICONS: Record<FurnitureType, LucideIcon> = {
  bed: Bed,
  desk: Monitor,
  chair: Armchair,
  bookshelf: Library,
  sofa: Sofa,
  "coffee-table": Square,
  storage: Archive,
};

export function FurniturePanel() {
  const addFurniture = useStudioStore((state) => state.addFurniture);

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Add Furniture
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {FURNITURE_TYPES.map((type) => {
          const template = FURNITURE_CATALOG[type];
          const Icon = FURNITURE_ICONS[type];

          return (
            <button
              key={type}
              onClick={() => addFurniture(type)}
              className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg bg-secondary hover:bg-secondary/70 transition-colors text-secondary-foreground"
            >
              <Icon size={20} />
              <span className="text-xs font-medium">{template.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
