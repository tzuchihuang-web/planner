import type { Furniture } from "./types";
import { APARTMENT, RESTRICTED_ZONES } from "./apartment-dimensions";
import { getFurnitureAABB, aabbOverlap } from "./collision-detection";

const GRID_SIZE = 0.25; // 25cm grid cells for finer paths
const MIN_CLEARANCE = 0.25; // Minimum clearance from obstacles

// Check if a point is walkable with given clearance
function isWalkable(x: number, z: number, furniture: Furniture[], clearance: number = MIN_CLEARANCE): boolean {
  // Check apartment bounds
  if (x - clearance < APARTMENT.wallThickness ||
      x + clearance > APARTMENT.width - APARTMENT.wallThickness ||
      z - clearance < APARTMENT.wallThickness ||
      z + clearance > APARTMENT.depth - APARTMENT.wallThickness) {
    return false;
  }

  // Check bathroom zone
  const bathroomZone = {
    minX: 0,
    maxX: APARTMENT.bathroom.width + APARTMENT.wallThickness * 2,
    minZ: APARTMENT.depth - APARTMENT.bathroom.depth - APARTMENT.wallThickness,
    maxZ: APARTMENT.depth,
  };

  const point = {
    minX: x - clearance,
    maxX: x + clearance,
    minZ: z - clearance,
    maxZ: z + clearance,
  };

  if (aabbOverlap(point, bathroomZone)) {
    return false;
  }

  // Check kitchen restricted zone
  if (aabbOverlap(point, RESTRICTED_ZONES.kitchen)) {
    return false;
  }

  // Check furniture with smaller clearance
  for (const item of furniture) {
    const furnitureAABB = getFurnitureAABB(item);
    const expandedAABB = {
      minX: furnitureAABB.minX - clearance,
      maxX: furnitureAABB.maxX + clearance,
      minZ: furnitureAABB.minZ - clearance,
      maxZ: furnitureAABB.maxZ + clearance,
    };

    if (aabbOverlap(point, expandedAABB)) {
      return false;
    }
  }

  return true;
}

// Check if there's line of sight between two points
function hasLineOfSight(
  x1: number, z1: number,
  x2: number, z2: number,
  furniture: Furniture[]
): boolean {
  const distance = Math.hypot(x2 - x1, z2 - z1);
  const steps = Math.ceil(distance / (GRID_SIZE / 2));
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t;
    const z = z1 + (z2 - z1) * t;
    
    if (!isWalkable(x, z, furniture, MIN_CLEARANCE * 0.8)) {
      return false;
    }
  }
  
  return true;
}

// Get the edge position of a furniture piece (where a person would stand)
export function getFurnitureEdgePosition(
  item: Furniture,
  targetX: number,
  targetZ: number
): { x: number; z: number } {
  const aabb = getFurnitureAABB(item);
  const centerX = (aabb.minX + aabb.maxX) / 2;
  const centerZ = (aabb.minZ + aabb.maxZ) / 2;
  
  // Direction from furniture center to target
  const dx = targetX - centerX;
  const dz = targetZ - centerZ;
  const dist = Math.hypot(dx, dz);
  
  if (dist < 0.01) {
    // Default to front of furniture
    return { x: centerX, z: aabb.maxZ + 0.4 };
  }
  
  // Normalize direction
  const ndx = dx / dist;
  const ndz = dz / dist;
  
  // Find edge point with offset
  const halfW = (aabb.maxX - aabb.minX) / 2 + 0.4;
  const halfD = (aabb.maxZ - aabb.minZ) / 2 + 0.4;
  
  // Scale by furniture dimensions
  const scaleX = Math.abs(ndx) > 0.01 ? halfW / Math.abs(ndx) : Infinity;
  const scaleZ = Math.abs(ndz) > 0.01 ? halfD / Math.abs(ndz) : Infinity;
  const scale = Math.min(scaleX, scaleZ);
  
  return {
    x: centerX + ndx * scale,
    z: centerZ + ndz * scale,
  };
}

// Find nearest walkable point using expanding search
function findNearestWalkable(
  x: number, z: number,
  furniture: Furniture[],
  maxRadius: number = 3.0
): { x: number; z: number } | null {
  // First try the exact point
  if (isWalkable(x, z, furniture)) {
    return { x, z };
  }

  // Search in expanding circles with more angles
  for (let radius = GRID_SIZE; radius <= maxRadius; radius += GRID_SIZE) {
    const numAngles = Math.max(16, Math.floor(radius * 20));
    for (let i = 0; i < numAngles; i++) {
      const angle = (i / numAngles) * Math.PI * 2;
      const testX = x + Math.cos(angle) * radius;
      const testZ = z + Math.sin(angle) * radius;
      if (isWalkable(testX, testZ, furniture)) {
        return { x: testX, z: testZ };
      }
    }
  }

  return null;
}

interface GridNode {
  x: number;
  z: number;
  gCost: number;
  hCost: number;
  fCost: number;
  parent: GridNode | null;
}

// A* pathfinding with improved performance
export function findPath(
  startX: number,
  startZ: number,
  endX: number,
  endZ: number,
  furniture: Furniture[]
): Array<{ x: number; z: number }> {
  // Find walkable start and end points
  const walkableStart = findNearestWalkable(startX, startZ, furniture);
  const walkableEnd = findNearestWalkable(endX, endZ, furniture);

  if (!walkableStart || !walkableEnd) {
    // Fallback: return simple direct path if no walkable points found
    return [{ x: startX, z: startZ }, { x: endX, z: endZ }];
  }

  startX = walkableStart.x;
  startZ = walkableStart.z;
  endX = walkableEnd.x;
  endZ = walkableEnd.z;

  // Quick check: if direct path is clear, use it
  if (hasLineOfSight(startX, startZ, endX, endZ, furniture)) {
    return [{ x: startX, z: startZ }, { x: endX, z: endZ }];
  }

  const start: GridNode = {
    x: startX,
    z: startZ,
    gCost: 0,
    hCost: Math.hypot(endX - startX, endZ - startZ),
    fCost: 0,
    parent: null,
  };
  start.fCost = start.hCost;

  const goal: GridNode = {
    x: endX,
    z: endZ,
    gCost: 0,
    hCost: 0,
    fCost: 0,
    parent: null,
  };

  const openSet: GridNode[] = [start];
  const closedSet = new Map<string, GridNode>();

  const nodeKey = (x: number, z: number): string => 
    `${Math.round(x / GRID_SIZE)},${Math.round(z / GRID_SIZE)}`;

  // 8-directional movement
  const directions = [
    [0, -GRID_SIZE], [0, GRID_SIZE],
    [-GRID_SIZE, 0], [GRID_SIZE, 0],
    [-GRID_SIZE, -GRID_SIZE], [-GRID_SIZE, GRID_SIZE],
    [GRID_SIZE, -GRID_SIZE], [GRID_SIZE, GRID_SIZE],
  ];

  let iterations = 0;
  const maxIterations = 8000;

  while (openSet.length > 0 && iterations < maxIterations) {
    iterations++;

    // Find node with lowest fCost
    let currentIndex = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].fCost < openSet[currentIndex].fCost ||
          (openSet[i].fCost === openSet[currentIndex].fCost && openSet[i].hCost < openSet[currentIndex].hCost)) {
        currentIndex = i;
      }
    }

    const current = openSet[currentIndex];

    // Check if we reached the goal
    if (Math.hypot(current.x - goal.x, current.z - goal.z) < GRID_SIZE * 1.5) {
      // Reconstruct path
      const rawPath: Array<{ x: number; z: number }> = [];
      let node: GridNode | null = current;
      while (node) {
        rawPath.unshift({ x: node.x, z: node.z });
        node = node.parent;
      }
      // Add exact end point
      rawPath.push({ x: endX, z: endZ });
      
      // Simplify path using line-of-sight
      return simplifyPath(rawPath, furniture);
    }

    openSet.splice(currentIndex, 1);
    closedSet.set(nodeKey(current.x, current.z), current);

    // Explore neighbors
    for (const [dx, dz] of directions) {
      const nx = current.x + dx;
      const nz = current.z + dz;
      const key = nodeKey(nx, nz);

      if (closedSet.has(key)) continue;
      if (!isWalkable(nx, nz, furniture)) continue;

      const moveCost = Math.hypot(dx, dz);
      const gCost = current.gCost + moveCost;
      const hCost = Math.hypot(goal.x - nx, goal.z - nz);
      const fCost = gCost + hCost;

      const existingIndex = openSet.findIndex(n => 
        Math.abs(n.x - nx) < GRID_SIZE / 2 && Math.abs(n.z - nz) < GRID_SIZE / 2
      );

      if (existingIndex >= 0) {
        if (gCost < openSet[existingIndex].gCost) {
          openSet[existingIndex].gCost = gCost;
          openSet[existingIndex].fCost = fCost;
          openSet[existingIndex].parent = current;
        }
      } else {
        openSet.push({
          x: nx,
          z: nz,
          gCost,
          hCost,
          fCost,
          parent: current,
        });
      }
    }
  }

  // Fallback: return direct path if A* fails
  return [{ x: startX, z: startZ }, { x: endX, z: endZ }];
}

// Simplify path by removing unnecessary waypoints using line-of-sight
function simplifyPath(
  path: Array<{ x: number; z: number }>,
  furniture: Furniture[]
): Array<{ x: number; z: number }> {
  if (path.length <= 2) return path;

  const simplified: Array<{ x: number; z: number }> = [path[0]];
  let current = 0;

  while (current < path.length - 1) {
    let furthest = current + 1;
    
    // Find the furthest point we can see from current
    for (let i = path.length - 1; i > current + 1; i--) {
      if (hasLineOfSight(path[current].x, path[current].z, path[i].x, path[i].z, furniture)) {
        furthest = i;
        break;
      }
    }
    
    simplified.push(path[furthest]);
    current = furthest;
  }

  return simplified;
}

// Smooth path with gentle curves
export function smoothPath(
  pathPoints: Array<{ x: number; z: number }>
): Array<{ x: number; z: number }> {
  if (pathPoints.length < 2) return pathPoints;
  if (pathPoints.length === 2) {
    // For two points, add intermediate points for smoother line
    const [p1, p2] = pathPoints;
    const midX = (p1.x + p2.x) / 2;
    const midZ = (p1.z + p2.z) / 2;
    return [p1, { x: midX, z: midZ }, p2];
  }

  const smoothed: Array<{ x: number; z: number }> = [];
  const segmentPoints = 4;

  for (let i = 0; i < pathPoints.length - 1; i++) {
    smoothed.push(pathPoints[i]);

    const p0 = i > 0 ? pathPoints[i - 1] : pathPoints[i];
    const p1 = pathPoints[i];
    const p2 = pathPoints[i + 1];
    const p3 = i < pathPoints.length - 2 ? pathPoints[i + 2] : pathPoints[i + 1];

    for (let j = 1; j < segmentPoints; j++) {
      const t = j / segmentPoints;
      const t2 = t * t;
      const t3 = t2 * t;

      const x = 0.5 * (
        2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
      );

      const z = 0.5 * (
        2 * p1.z +
        (-p0.z + p2.z) * t +
        (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 +
        (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3
      );

      smoothed.push({ x, z });
    }
  }

  smoothed.push(pathPoints[pathPoints.length - 1]);
  return smoothed;
}
