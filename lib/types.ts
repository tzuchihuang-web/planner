import type { Vector3Tuple } from "three";

export type FurnitureType =
  | "bed"
  | "desk"
  | "chair"
  | "bookshelf"
  | "sofa"
  | "coffee-table"
  | "storage";

export interface FurnitureTemplate {
  type: FurnitureType;
  label: string;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  color: string;
}

export interface Furniture {
  id: string;
  type: FurnitureType;
  position: Vector3Tuple;
  rotation: number; // Y-axis rotation in radians
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  color: string;
}

export type ViewMode = "topdown" | "3d" | "walkthrough" | "pathReveal" | "guidedWalkthrough";

export type Scenario = "A" | "B";

export type PathStatus = "clear" | "tight" | "blocked";

export interface PathPoint {
  x: number;
  z: number;
  status: PathStatus;
}

export interface MovementPath {
  id: string;
  name: string;
  points: PathPoint[];
  color: string;
}

export interface ScenarioConfig {
  id: Scenario;
  label: string;
  goals: string[];
}

export interface ApartmentState {
  furniture: Furniture[];
}

export interface AABB {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}
