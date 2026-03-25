// Apartment dimensions in meters
// Long rectangular studio: ~12m x 5m

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

  // Living area (flexible zone)
  // Everything else is living area - from x=2.5 to x=12, and from z=0 to z=5
  // Minus kitchen counter zone

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

// Wall boundaries for collision
export const WALL_BOUNDS = {
  minX: APARTMENT.wallThickness,
  maxX: APARTMENT.width - APARTMENT.wallThickness,
  minZ: APARTMENT.wallThickness,
  maxZ: APARTMENT.depth - APARTMENT.wallThickness,
};
