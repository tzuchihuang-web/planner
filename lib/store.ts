import { create } from "zustand";
import type { Furniture, ViewMode, Scenario, ApartmentState, FurnitureType, MovementPath, PathPoint, PathStatus } from "./types";
import { FURNITURE_CATALOG } from "./furniture-catalog";
import { generateId } from "./utils";
import { validatePlacement, getFurnitureAABB, aabbOverlap } from "./collision-detection";
import { APARTMENT, RESTRICTED_ZONES } from "./apartment-dimensions";

interface StudioStore {
  // Current scenario
  scenario: Scenario;
  setScenario: (scenario: Scenario) => void;

  // View mode
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Furniture
  furniture: Furniture[];
  selectedId: string | null;
  selectFurniture: (id: string | null) => void;
  addFurniture: (type: FurnitureType, x?: number, z?: number) => void;
  updateFurniture: (id: string, updates: Partial<Furniture>) => void;
  deleteFurniture: (id: string) => void;
  moveFurniture: (id: string, x: number, z: number) => void;
  rotateFurniture: (id: string, rotation: number) => void;

  // Undo/Redo
  undoStack: ApartmentState[];
  redoStack: ApartmentState[];
  pushUndo: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Reset
  resetScene: () => void;

  // Walkthrough
  isWalkthroughActive: boolean;
  startWalkthrough: () => void;
  exitWalkthrough: () => void;

  // Path Reveal
  showPathReveal: boolean;
  movementPaths: MovementPath[];
  calculatePaths: () => void;
  togglePathReveal: () => void;

  // Guided Walkthrough
  guidedWalkthroughActive: boolean;
  currentPathIndex: number;
  walkthroughWarning: string | null;
  startGuidedWalkthrough: () => void;
  exitGuidedWalkthrough: () => void;
  setWalkthroughWarning: (warning: string | null) => void;
}

const DEFAULT_SPAWN_X = 6;
const DEFAULT_SPAWN_Z = 2.5;

export const useStudioStore = create<StudioStore>((set, get) => ({
  // Scenario
  scenario: "A",
  setScenario: (scenario) => {
    get().pushUndo();
    set({ scenario, furniture: [], selectedId: null });
  },

  // View mode
  viewMode: "3d",
  setViewMode: (viewMode) => {
    if (viewMode === "walkthrough") {
      get().startWalkthrough();
    } else {
      set({ viewMode, isWalkthroughActive: false });
    }
  },

  // Furniture
  furniture: [],
  selectedId: null,

  selectFurniture: (id) => set({ selectedId: id }),

  addFurniture: (type, x = DEFAULT_SPAWN_X, z = DEFAULT_SPAWN_Z) => {
    const template = FURNITURE_CATALOG[type];
    const newFurniture: Furniture = {
      id: generateId(),
      type,
      position: [x, template.dimensions.height / 2, z],
      rotation: 0,
      dimensions: { ...template.dimensions },
      color: template.color,
    };

    const { furniture, scenario } = get();
    const validation = validatePlacement(newFurniture, furniture, scenario);

    // If default position is invalid, try to find a valid spot
    if (!validation.valid) {
      // Try different positions
      const positions = [
        [6, 2.5],
        [8, 2.5],
        [10, 2.5],
        [6, 1.5],
        [8, 1.5],
        [10, 1.5],
        [4, 2],
        [4, 1],
      ];
      let placed = false;
      for (const [px, pz] of positions) {
        newFurniture.position = [px, template.dimensions.height / 2, pz];
        if (validatePlacement(newFurniture, furniture, scenario).valid) {
          placed = true;
          break;
        }
      }
      if (!placed) {
        console.warn("Could not find valid position for furniture");
        return;
      }
    }

    get().pushUndo();
    set({ furniture: [...furniture, newFurniture], selectedId: newFurniture.id });
  },

  updateFurniture: (id, updates) => {
    const { furniture } = get();
    set({
      furniture: furniture.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    });
  },

  deleteFurniture: (id) => {
    get().pushUndo();
    const { furniture, selectedId } = get();
    set({
      furniture: furniture.filter((f) => f.id !== id),
      selectedId: selectedId === id ? null : selectedId,
    });
  },

  moveFurniture: (id, x, z) => {
    const { furniture, scenario } = get();
    const item = furniture.find((f) => f.id === id);
    if (!item) return;

    const updated: Furniture = {
      ...item,
      position: [x, item.position[1], z],
    };

    const validation = validatePlacement(updated, furniture, scenario);
    if (!validation.valid) {
      return; // Don't move if invalid
    }

    set({
      furniture: furniture.map((f) => (f.id === id ? updated : f)),
    });
  },

  rotateFurniture: (id, rotation) => {
    const { furniture, scenario } = get();
    const item = furniture.find((f) => f.id === id);
    if (!item) return;

    const updated: Furniture = {
      ...item,
      rotation,
    };

    const validation = validatePlacement(updated, furniture, scenario);
    if (!validation.valid) {
      return;
    }

    set({
      furniture: furniture.map((f) => (f.id === id ? updated : f)),
    });
  },

  // Undo/Redo
  undoStack: [],
  redoStack: [],

  pushUndo: () => {
    const { furniture, undoStack } = get();
    set({
      undoStack: [...undoStack.slice(-19), { furniture: [...furniture] }],
      redoStack: [],
    });
  },

  undo: () => {
    const { undoStack, furniture, redoStack } = get();
    if (undoStack.length === 0) return;

    const previous = undoStack[undoStack.length - 1];
    set({
      furniture: previous.furniture,
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, { furniture: [...furniture] }],
      selectedId: null,
    });
  },

  redo: () => {
    const { redoStack, furniture, undoStack } = get();
    if (redoStack.length === 0) return;

    const next = redoStack[redoStack.length - 1];
    set({
      furniture: next.furniture,
      redoStack: redoStack.slice(0, -1),
      undoStack: [...undoStack, { furniture: [...furniture] }],
      selectedId: null,
    });
  },

  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,

  // Reset
  resetScene: () => {
    get().pushUndo();
    set({ furniture: [], selectedId: null });
  },

  // Walkthrough
  isWalkthroughActive: false,

  startWalkthrough: () => {
    set({ viewMode: "walkthrough", isWalkthroughActive: true, selectedId: null });
  },

  exitWalkthrough: () => {
    set({ viewMode: "3d", isWalkthroughActive: false, guidedWalkthroughActive: false });
  },

  // Path Reveal
  showPathReveal: false,
  movementPaths: [],

  calculatePaths: () => {
    const { furniture, scenario } = get();
    const paths: MovementPath[] = [];

    // Only calculate for Studio B
    if (scenario !== "B") {
      set({ movementPaths: [] });
      return;
    }

    // Find furniture positions
    const bed = furniture.find(f => f.type === "bed");
    const desk = furniture.find(f => f.type === "desk");
    const bookshelf = furniture.find(f => f.type === "bookshelf");

    // Bathroom position (center of bathroom)
    const bathroomX = APARTMENT.bathroom.width / 2 + APARTMENT.wallThickness;
    const bathroomZ = APARTMENT.depth - APARTMENT.bathroom.depth / 2 - APARTMENT.wallThickness;

    // Helper to check path status at a point
    const getPathStatus = (x: number, z: number): PathStatus => {
      const checkRadius = 0.4;
      const tightRadius = 0.6;

      // Check if blocked by restricted zones
      const pointAABB = {
        minX: x - checkRadius,
        maxX: x + checkRadius,
        minZ: z - checkRadius,
        maxZ: z + checkRadius,
      };

      if (aabbOverlap(pointAABB, RESTRICTED_ZONES.kitchen)) {
        return "blocked";
      }

      // Check furniture collision
      for (const item of furniture) {
        const furnitureAABB = getFurnitureAABB(item);
        
        // Check blocked (very close)
        if (aabbOverlap(pointAABB, furnitureAABB)) {
          return "blocked";
        }

        // Check tight (nearby)
        const tightAABB = {
          minX: x - tightRadius,
          maxX: x + tightRadius,
          minZ: z - tightRadius,
          maxZ: z + tightRadius,
        };
        if (aabbOverlap(tightAABB, furnitureAABB)) {
          return "tight";
        }
      }

      return "clear";
    };

    // Generate path points between two locations
    const generatePathPoints = (
      startX: number,
      startZ: number,
      endX: number,
      endZ: number,
      numPoints: number = 20
    ): PathPoint[] => {
      const points: PathPoint[] = [];
      for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const x = startX + (endX - startX) * t;
        const z = startZ + (endZ - startZ) * t;
        points.push({ x, z, status: getPathStatus(x, z) });
      }
      return points;
    };

    // Path 1: Bed to Bathroom (night path)
    if (bed) {
      const bedX = bed.position[0];
      const bedZ = bed.position[2];
      paths.push({
        id: "bed-bathroom",
        name: "Bed to Bathroom (Night)",
        points: generatePathPoints(bedX, bedZ, bathroomX, bathroomZ),
        color: "#22c55e", // green base
      });
    }

    // Path 2: Desk to Shelf (daily movement)
    if (desk && bookshelf) {
      const deskX = desk.position[0];
      const deskZ = desk.position[2];
      const shelfX = bookshelf.position[0];
      const shelfZ = bookshelf.position[2];
      paths.push({
        id: "desk-shelf",
        name: "Desk to Shelf (Daily)",
        points: generatePathPoints(deskX, deskZ, shelfX, shelfZ),
        color: "#3b82f6", // blue base
      });
    }

    set({ movementPaths: paths });
  },

  togglePathReveal: () => {
    const { showPathReveal } = get();
    if (!showPathReveal) {
      get().calculatePaths();
    }
    set({ showPathReveal: !showPathReveal, viewMode: showPathReveal ? "3d" : "pathReveal" });
  },

  // Guided Walkthrough
  guidedWalkthroughActive: false,
  currentPathIndex: 0,
  walkthroughWarning: null,

  startGuidedWalkthrough: () => {
    get().calculatePaths();
    set({ 
      viewMode: "guidedWalkthrough", 
      guidedWalkthroughActive: true, 
      currentPathIndex: 0,
      selectedId: null,
      walkthroughWarning: null,
    });
  },

  exitGuidedWalkthrough: () => {
    set({ 
      viewMode: "3d", 
      guidedWalkthroughActive: false, 
      walkthroughWarning: null,
    });
  },

  setWalkthroughWarning: (warning) => {
    set({ walkthroughWarning: warning });
  },
}));
