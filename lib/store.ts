import { create } from "zustand";
import type { Furniture, ViewMode, Scenario, ApartmentState, FurnitureType } from "./types";
import { FURNITURE_CATALOG } from "./furniture-catalog";
import { generateId } from "./utils";
import { validatePlacement } from "./collision-detection";

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

    const { furniture } = get();
    const validation = validatePlacement(newFurniture, furniture);

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
        if (validatePlacement(newFurniture, furniture).valid) {
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
    const { furniture } = get();
    const item = furniture.find((f) => f.id === id);
    if (!item) return;

    const updated: Furniture = {
      ...item,
      position: [x, item.position[1], z],
    };

    const validation = validatePlacement(updated, furniture);
    if (!validation.valid) {
      return; // Don't move if invalid
    }

    set({
      furniture: furniture.map((f) => (f.id === id ? updated : f)),
    });
  },

  rotateFurniture: (id, rotation) => {
    const { furniture } = get();
    const item = furniture.find((f) => f.id === id);
    if (!item) return;

    const updated: Furniture = {
      ...item,
      rotation,
    };

    const validation = validatePlacement(updated, furniture);
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
    set({ viewMode: "3d", isWalkthroughActive: false });
  },
}));
