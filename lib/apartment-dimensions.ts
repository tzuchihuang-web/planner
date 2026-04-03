// Apartment dimensions in meters
// Long rectangular studio: ~12m x 5m
// Both studios have similar overall size but different spatial constraints

import type { Scenario } from "./types";

// Base apartment structure (same size for both)
export const APARTMENT = {
  // Overall dimensions
  width: 12, // X-axis (long side)
  depth: 5, // Z-axis (short side)
  height: 2.8, // Wall height
  wallThickness: 0.12,

  // Entry (on the left short wall)
  entry: {
    width: 0.9,
    position: { x: 0, z: 1.5 }, // Offset from corner
  },

  // Bathroom (near entry, enclosed room)
  bathroom: {
    width: 2.2,
    depth: 2.0,
    position: { x: 0.06, z: 2.94 }, // Top-left corner (inner position)
  },

  // Kitchen (along top wall, open to living)
  kitchen: {
    width: 3.0,
    depth: 0.7, // Counter depth
    position: { x: 2.5, z: 4.24 }, // Along top wall, starting after bathroom
  },

  // Floor level
  floorY: 0,
};

// Colors for apartment elements
export const APARTMENT_COLORS = {
  floor: "#e8e4de", // Warm light wood
  walls: "#f5f3f0", // Off-white walls
  bathroom: "#d4e5ed", // Light blue tile hint
  kitchen: "#e8e0d5", // Warm kitchen tone
  bathroomWalls: "#e0e8eb",
  accent: "#8b7355", // Wood accent
};

// Obstacle type
type Obstacle = { x: number; z: number; width: number; depth: number; isWallMounted: boolean };

// Studio A: Open layout with fewer constraints
export const STUDIO_A_CONFIG = {
  // Wider walking areas
  walkwayMinWidth: 0.8,
  
  // No additional obstacles
  obstacles: [] as Obstacle[],
  
  // Bathroom is easily accessible
  bathroomAccess: "easy" as const,
};

// Studio B: More constrained layout requiring guidance
export const STUDIO_B_CONFIG = {
  // Narrower walking areas (same room size, but furniture placement matters more)
  walkwayMinWidth: 0.5,
  
  // Additional spatial constraints (pillars, fixed elements)
  // Each obstacle has x, z (center position), width, depth, and isWallMounted flag
  obstacles: [
    // Column/pillar near living area - full height
    { x: 5, z: 2.5, width: 0.35, depth: 0.35, isWallMounted: false },
    // Storage alcove built into back wall - full height, flush with wall
    { x: 9.5, z: APARTMENT.depth - 0.4, width: 1.8, depth: 0.8, isWallMounted: true },
  ],
  
  // Bathroom position makes night access trickier
  bathroomAccess: "constrained" as const,
};

// Get config based on scenario
export function getScenarioConfig(scenario: Scenario) {
  return scenario === "A" ? STUDIO_A_CONFIG : STUDIO_B_CONFIG;
}

// Restricted zones where furniture cannot be placed
export const RESTRICTED_ZONES = {
  bathroom: {
    minX: 0,
    maxX: APARTMENT.bathroom.width + APARTMENT.wallThickness,
    minZ: APARTMENT.depth - APARTMENT.bathroom.depth - APARTMENT.wallThickness,
    maxZ: APARTMENT.depth,
  },
  kitchen: {
    minX: APARTMENT.bathroom.width + APARTMENT.wallThickness,
    maxX: APARTMENT.bathroom.width + APARTMENT.wallThickness + APARTMENT.kitchen.width,
    minZ: APARTMENT.depth - APARTMENT.kitchen.depth - 0.3,
    maxZ: APARTMENT.depth,
  },
  entry: {
    minX: -0.5,
    maxX: 0.5,
    minZ: APARTMENT.entry.position.z - APARTMENT.entry.width / 2,
    maxZ: APARTMENT.entry.position.z + APARTMENT.entry.width / 2,
  },
};

// Get restricted zones including scenario-specific obstacles
export function getRestrictedZones(scenario: Scenario) {
  const baseZones = { ...RESTRICTED_ZONES };
  const config = getScenarioConfig(scenario);
  
  // Add obstacle zones for Studio B
  const obstacleZones: Record<string, { minX: number; maxX: number; minZ: number; maxZ: number }> = {};
  config.obstacles.forEach((obs, i) => {
    obstacleZones[`obstacle_${i}`] = {
      minX: obs.x - obs.width / 2,
      maxX: obs.x + obs.width / 2,
      minZ: obs.z - obs.depth / 2,
      maxZ: obs.z + obs.depth / 2,
    };
  });
  
  return { ...baseZones, ...obstacleZones };
}

// Wall boundaries for collision
export const WALL_BOUNDS = {
  minX: APARTMENT.wallThickness,
  maxX: APARTMENT.width - APARTMENT.wallThickness,
  minZ: APARTMENT.wallThickness,
  maxZ: APARTMENT.depth - APARTMENT.wallThickness,
};
