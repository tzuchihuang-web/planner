import type { FurnitureTemplate, FurnitureType } from "./types";

export const FURNITURE_CATALOG: Record<FurnitureType, FurnitureTemplate> = {
  bed: {
    type: "bed",
    label: "Bed",
    dimensions: { width: 1.6, height: 0.5, depth: 2.0 },
    color: "#c9c2b8", // Warm gray/beige
  },
  desk: {
    type: "desk",
    label: "Desk",
    dimensions: { width: 1.2, height: 0.75, depth: 0.6 },
    color: "#a08060", // Medium wood
  },
  chair: {
    type: "chair",
    label: "Chair",
    dimensions: { width: 0.5, height: 0.85, depth: 0.5 },
    color: "#6b6b6b", // Dark gray
  },
  bookshelf: {
    type: "bookshelf",
    label: "Bookshelf",
    dimensions: { width: 0.8, height: 1.8, depth: 0.35 },
    color: "#8b7355", // Brown wood
  },
  sofa: {
    type: "sofa",
    label: "Sofa",
    dimensions: { width: 2.0, height: 0.75, depth: 0.9 },
    color: "#7a8b8c", // Slate blue-gray
  },
  "coffee-table": {
    type: "coffee-table",
    label: "Coffee Table",
    dimensions: { width: 1.0, height: 0.45, depth: 0.6 },
    color: "#5c4a3a", // Dark wood
  },
  storage: {
    type: "storage",
    label: "Storage",
    dimensions: { width: 1.0, height: 1.4, depth: 0.5 },
    color: "#d5cdc4", // Light wood
  },
};

export const FURNITURE_TYPES = Object.keys(FURNITURE_CATALOG) as FurnitureType[];
