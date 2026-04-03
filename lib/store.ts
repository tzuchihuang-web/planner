import { create } from "zustand";
import type { Furniture, ViewMode, Scenario, ApartmentState, FurnitureType, MovementPath, PathPoint, PathStatus } from "./types";
import { FURNITURE_CATALOG } from "./furniture-catalog";
import { generateId } from "./utils";
import { validatePlacement, getFurnitureAABB, aabbOverlap } from "./collision-detection";
import { APARTMENT, RESTRICTED_ZONES } from "./apartment-dimensions";
import { findPath, smoothPath, getFurnitureEdgePosition } from "./pathfinding";

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
  selectedPathId: string | null;
  currentPathIndex: number;
  walkthroughWarning: string | null;
  startGuidedWalkthrough: (pathId?: string) => void;
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

    // Bathroom entrance position (just outside bathroom door)
    // Bathroom is in top-left corner, door faces into main living area
    const bathroomX = APARTMENT.bathroom.width + APARTMENT.wallThickness + 0.3; // Just outside bathroom
    const bathroomZ = APARTMENT.depth - APARTMENT.bathroom.depth - 0.3; // Near bathroom entrance

    // Helper to analyze path and get status
    const analyzePathStatus = (pathPoints: Array<{ x: number; z: number }>): PathPoint[] => {
      const result: PathPoint[] = [];
      const clearanceThreshold = 0.5;
      const tightThreshold = 0.7;

      for (const point of pathPoints) {
        const checkRadius = 0.4;
        const pointAABB = {
          minX: point.x - checkRadius,
          maxX: point.x + checkRadius,
          minZ: point.z - checkRadius,
          maxZ: point.z + checkRadius,
        };

        let status: PathStatus = "clear";

        // Check kitchen
        if (aabbOverlap(pointAABB, RESTRICTED_ZONES.kitchen)) {
          status = "blocked";
        } else {
          // Check furniture clearance
          for (const item of furniture) {
            const furnitureAABB = getFurnitureAABB(item);
            
            // Calculate minimum distance to furniture
            const dx = Math.max(furnitureAABB.minX - point.x, point.x - furnitureAABB.maxX, 0);
            const dz = Math.max(furnitureAABB.minZ - point.z, point.z - furnitureAABB.maxZ, 0);
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance < 0.1) {
              status = "blocked";
              break;
            } else if (distance < tightThreshold) {
              if (status !== "blocked") status = "tight";
            }
          }
        }

        result.push({ x: point.x, z: point.z, status });
      }

      return result;
    };

    // Path 1: Bed to Bathroom (night path)
    if (bed) {
      // Get edge of bed facing toward bathroom
      const bedEdge = getFurnitureEdgePosition(bed, bathroomX, bathroomZ);
      
      const pathPoints = findPath(bedEdge.x, bedEdge.z, bathroomX, bathroomZ, furniture);
      if (pathPoints.length > 0) {
        const smoothedPath = smoothPath(pathPoints);
        paths.push({
          id: "bed-bathroom",
          name: "Bed → Bathroom (Night)",
          points: analyzePathStatus(smoothedPath),
          color: "#22c55e", // green base
        });
      }
    }

    // Path 2: Desk to Shelf (daily movement)
    if (desk && bookshelf) {
      // Get edge of desk facing toward bookshelf
      const shelfX = bookshelf.position[0];
      const shelfZ = bookshelf.position[2];
      const deskEdge = getFurnitureEdgePosition(desk, shelfX, shelfZ);
      
      // Get edge of bookshelf facing toward desk
      const shelfEdge = getFurnitureEdgePosition(bookshelf, deskEdge.x, deskEdge.z);
      
      const pathPoints = findPath(deskEdge.x, deskEdge.z, shelfEdge.x, shelfEdge.z, furniture);
      if (pathPoints.length > 0) {
        const smoothedPath = smoothPath(pathPoints);
        paths.push({
          id: "desk-shelf",
          name: "Desk ↔ Shelf (Day)",
          points: analyzePathStatus(smoothedPath),
          color: "#3b82f6", // blue base
        });
      }
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
  selectedPathId: null,
  currentPathIndex: 0,
  walkthroughWarning: null,

  startGuidedWalkthrough: (pathId) => {
    get().calculatePaths();
    const paths = get().movementPaths;
    const selectedPath = pathId 
      ? paths.find(p => p.id === pathId)
      : paths[0];
    
    const pathIndex = selectedPath ? paths.indexOf(selectedPath) : 0;
    
    set({ 
      viewMode: "guidedWalkthrough", 
      guidedWalkthroughActive: true, 
      selectedPathId: selectedPath?.id || null,
      currentPathIndex: pathIndex,
      selectedId: null,
      walkthroughWarning: null,
    });
  },

  exitGuidedWalkthrough: () => {
    set({ 
      viewMode: "3d", 
      guidedWalkthroughActive: false,
      selectedPathId: null,
      walkthroughWarning: null,
    });
  },

  setWalkthroughWarning: (warning) => {
    set({ walkthroughWarning: warning });
  },
}));
