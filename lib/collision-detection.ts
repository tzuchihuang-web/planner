import type { Furniture, AABB } from "./types";
import { RESTRICTED_ZONES, WALL_BOUNDS, APARTMENT } from "./apartment-dimensions";

// Get AABB for a furniture piece (accounting for rotation)
export function getFurnitureAABB(furniture: Furniture): AABB {
  const { position, dimensions, rotation } = furniture;
  const [x, , z] = position;

  // Account for rotation - swap width/depth if rotated 90 or 270 degrees
  const rotationNormalized = ((rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const isRotated90 =
    (rotationNormalized > Math.PI * 0.25 && rotationNormalized < Math.PI * 0.75) ||
    (rotationNormalized > Math.PI * 1.25 && rotationNormalized < Math.PI * 1.75);

  const effectiveWidth = isRotated90 ? dimensions.depth : dimensions.width;
  const effectiveDepth = isRotated90 ? dimensions.width : dimensions.depth;

  return {
    minX: x - effectiveWidth / 2,
    maxX: x + effectiveWidth / 2,
    minZ: z - effectiveDepth / 2,
    maxZ: z + effectiveDepth / 2,
  };
}

// Check if two AABBs overlap
export function aabbOverlap(a: AABB, b: AABB): boolean {
  return a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;
}

// Check if furniture is within wall bounds
export function isWithinWalls(aabb: AABB): boolean {
  return (
    aabb.minX >= WALL_BOUNDS.minX &&
    aabb.maxX <= WALL_BOUNDS.maxX &&
    aabb.minZ >= WALL_BOUNDS.minZ &&
    aabb.maxZ <= WALL_BOUNDS.maxZ
  );
}

// Check if furniture overlaps with restricted zones
export function overlapsRestrictedZone(aabb: AABB): { overlaps: boolean; zone?: string } {
  if (aabbOverlap(aabb, RESTRICTED_ZONES.bathroom)) {
    return { overlaps: true, zone: "bathroom" };
  }
  if (aabbOverlap(aabb, RESTRICTED_ZONES.kitchen)) {
    return { overlaps: true, zone: "kitchen" };
  }
  return { overlaps: false };
}

// Check if furniture overlaps with other furniture
export function overlapsOtherFurniture(
  furniture: Furniture,
  allFurniture: Furniture[]
): { overlaps: boolean; otherId?: string } {
  const aabb = getFurnitureAABB(furniture);

  for (const other of allFurniture) {
    if (other.id === furniture.id) continue;
    const otherAABB = getFurnitureAABB(other);
    if (aabbOverlap(aabb, otherAABB)) {
      return { overlaps: true, otherId: other.id };
    }
  }

  return { overlaps: false };
}

// Validate furniture placement
export function validatePlacement(
  furniture: Furniture,
  allFurniture: Furniture[]
): { valid: boolean; reason?: string } {
  const aabb = getFurnitureAABB(furniture);

  // Check wall bounds
  if (!isWithinWalls(aabb)) {
    return { valid: false, reason: "Furniture is outside apartment bounds" };
  }

  // Check restricted zones
  const restrictedCheck = overlapsRestrictedZone(aabb);
  if (restrictedCheck.overlaps) {
    return { valid: false, reason: `Cannot place furniture in ${restrictedCheck.zone}` };
  }

  // Check other furniture overlap
  const overlapCheck = overlapsOtherFurniture(furniture, allFurniture);
  if (overlapCheck.overlaps) {
    return { valid: false, reason: "Furniture overlaps with another item" };
  }

  return { valid: true };
}

// Clamp position to valid area (for dragging)
export function clampToValidArea(
  x: number,
  z: number,
  width: number,
  depth: number
): [number, number] {
  const halfW = width / 2;
  const halfD = depth / 2;

  const clampedX = Math.max(WALL_BOUNDS.minX + halfW, Math.min(WALL_BOUNDS.maxX - halfW, x));
  const clampedZ = Math.max(WALL_BOUNDS.minZ + halfD, Math.min(WALL_BOUNDS.maxZ - halfD, z));

  return [clampedX, clampedZ];
}

// Check if a point is in walkable area (for first-person mode)
export function isPointWalkable(x: number, z: number, playerRadius: number = 0.3): boolean {
  const playerAABB: AABB = {
    minX: x - playerRadius,
    maxX: x + playerRadius,
    minZ: z - playerRadius,
    maxZ: z + playerRadius,
  };

  // Check walls
  if (
    playerAABB.minX < WALL_BOUNDS.minX ||
    playerAABB.maxX > WALL_BOUNDS.maxX ||
    playerAABB.minZ < WALL_BOUNDS.minZ ||
    playerAABB.maxZ > WALL_BOUNDS.maxZ
  ) {
    // Allow walking near entry
    const entryZMin = APARTMENT.entry.position.z - APARTMENT.entry.width / 2;
    const entryZMax = APARTMENT.entry.position.z + APARTMENT.entry.width / 2;
    if (!(playerAABB.minX < 0 && z > entryZMin && z < entryZMax)) {
      return false;
    }
  }

  // Check bathroom (can enter bathroom in walkthrough)
  // Actually allow bathroom access for walkthrough
  // Only block kitchen counter area
  if (aabbOverlap(playerAABB, RESTRICTED_ZONES.kitchen)) {
    return false;
  }

  return true;
}
