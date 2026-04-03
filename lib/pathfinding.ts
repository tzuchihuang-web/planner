import type { Furniture } from "./types";
import { APARTMENT, RESTRICTED_ZONES } from "./apartment-dimensions";
import { getFurnitureAABB, aabbOverlap } from "./collision-detection";

export interface GridNode {
  x: number;
  z: number;
  gCost: number;
  hCost: number;
  fCost: number;
  parent: GridNode | null;
}

const GRID_SIZE = 0.3; // 30cm grid cells
const CLEARANCE = 0.5; // Minimum clearance from obstacles

// Check if a point is walkable
function isWalkable(x: number, z: number, furniture: Furniture[]): boolean {
  // Check apartment bounds with clearance
  if (x - CLEARANCE < APARTMENT.wallThickness ||
      x + CLEARANCE > APARTMENT.width - APARTMENT.wallThickness ||
      z - CLEARANCE < APARTMENT.wallThickness ||
      z + CLEARANCE > APARTMENT.depth - APARTMENT.wallThickness) {
    return false;
  }

  // Check kitchen restricted zone
  const point = {
    minX: x - CLEARANCE,
    maxX: x + CLEARANCE,
    minZ: z - CLEARANCE,
    maxZ: z + CLEARANCE,
  };

  if (aabbOverlap(point, RESTRICTED_ZONES.kitchen)) {
    return false;
  }

  // Check furniture
  for (const item of furniture) {
    const furnitureAABB = getFurnitureAABB(item);
    const expandedAABB = {
      minX: furnitureAABB.minX - CLEARANCE,
      maxX: furnitureAABB.maxX + CLEARANCE,
      minZ: furnitureAABB.minZ - CLEARANCE,
      maxZ: furnitureAABB.maxZ + CLEARANCE,
    };

    if (aabbOverlap(point, expandedAABB)) {
      return false;
    }
  }

  return true;
}

// Heuristic: Euclidean distance
function heuristic(from: GridNode, to: GridNode): number {
  const dx = from.x - to.x;
  const dz = from.z - to.z;
  return Math.sqrt(dx * dx + dz * dz);
}

// Get neighbors of a node (8-directional)
function getNeighbors(node: GridNode, goal: GridNode, furniture: Furniture[]): GridNode[] {
  const neighbors: GridNode[] = [];
  const directions = [
    [0, -GRID_SIZE], [0, GRID_SIZE], // forward/back
    [-GRID_SIZE, 0], [GRID_SIZE, 0], // left/right
    [-GRID_SIZE, -GRID_SIZE], [-GRID_SIZE, GRID_SIZE], // diagonals
    [GRID_SIZE, -GRID_SIZE], [GRID_SIZE, GRID_SIZE],
  ];

  for (const [dx, dz] of directions) {
    const x = node.x + dx;
    const z = node.z + dz;

    if (isWalkable(x, z, furniture)) {
      const costMultiplier = Math.abs(dx) + Math.abs(dz) > GRID_SIZE ? Math.sqrt(2) : 1;
      const neighbor: GridNode = {
        x,
        z,
        gCost: node.gCost + costMultiplier * GRID_SIZE,
        hCost: 0,
        fCost: 0,
        parent: node,
      };
      neighbor.hCost = heuristic(neighbor, goal);
      neighbor.fCost = neighbor.gCost + neighbor.hCost;
      neighbors.push(neighbor);
    }
  }

  return neighbors;
}

// Find nearest walkable point to a position
function findNearestWalkable(x: number, z: number, furniture: Furniture[]): { x: number; z: number } | null {
  if (isWalkable(x, z, furniture)) {
    return { x, z };
  }

  // Search in expanding circles
  for (let radius = GRID_SIZE; radius <= 2.0; radius += GRID_SIZE) {
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      const testX = x + Math.cos(angle) * radius;
      const testZ = z + Math.sin(angle) * radius;
      if (isWalkable(testX, testZ, furniture)) {
        return { x: testX, z: testZ };
      }
    }
  }

  return null;
}

// A* pathfinding algorithm
export function findPath(
  startX: number,
  startZ: number,
  endX: number,
  endZ: number,
  furniture: Furniture[]
): Array<{ x: number; z: number }> {
  // Find nearest walkable points
  const walkableStart = findNearestWalkable(startX, startZ, furniture);
  const walkableEnd = findNearestWalkable(endX, endZ, furniture);

  if (!walkableStart || !walkableEnd) {
    return [];
  }

  // Use the walkable points as actual start/end
  startX = walkableStart.x;
  startZ = walkableStart.z;
  endX = walkableEnd.x;
  endZ = walkableEnd.z;

  const start: GridNode = {
    x: startX,
    z: startZ,
    gCost: 0,
    hCost: 0,
    fCost: 0,
    parent: null,
  };

  const goal: GridNode = {
    x: endX,
    z: endZ,
    gCost: 0,
    hCost: 0,
    fCost: 0,
    parent: null,
  };

  start.hCost = heuristic(start, goal);
  start.fCost = start.gCost + start.hCost;

  const openSet: GridNode[] = [start];
  const closedSet: Set<string> = new Set();

  const nodeKey = (node: GridNode): string => `${Math.round(node.x / GRID_SIZE)},${Math.round(node.z / GRID_SIZE)}`;

  while (openSet.length > 0) {
    // Find node with lowest fCost
    let current = openSet[0];
    let currentIndex = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].fCost < current.fCost) {
        current = openSet[i];
        currentIndex = i;
      }
    }

    if (Math.hypot(current.x - goal.x, current.z - goal.z) < GRID_SIZE) {
      // Goal reached, reconstruct path
      const path: Array<{ x: number; z: number }> = [];
      let node: GridNode | null = current;
      while (node) {
        path.unshift({ x: node.x, z: node.z });
        node = node.parent;
      }
      return path;
    }

    openSet.splice(currentIndex, 1);
    closedSet.add(nodeKey(current));

    const neighbors = getNeighbors(current, goal, furniture);
    for (const neighbor of neighbors) {
      if (closedSet.has(nodeKey(neighbor))) {
        continue;
      }

      const existingNode = openSet.find(n => Math.abs(n.x - neighbor.x) < GRID_SIZE / 2 && Math.abs(n.z - neighbor.z) < GRID_SIZE / 2);
      if (existingNode && neighbor.gCost >= existingNode.gCost) {
        continue;
      }

      if (existingNode) {
        const index = openSet.indexOf(existingNode);
        openSet.splice(index, 1);
      }

      openSet.push(neighbor);
    }

    // Safety check to prevent infinite loops
    if (openSet.length > 5000) {
      return [];
    }
  }

  // No path found
  return [];
}

// Smooth path with Catmull-Rom interpolation
export function smoothPath(pathPoints: Array<{ x: number; z: number }>): Array<{ x: number; z: number }> {
  if (pathPoints.length < 2) return pathPoints;

  const smoothed: Array<{ x: number; z: number }> = [];
  const segmentPoints = 5; // Points per segment

  for (let i = 0; i < pathPoints.length - 1; i++) {
    smoothed.push(pathPoints[i]);

    // Get control points for this segment
    const p0 = i > 0 ? pathPoints[i - 1] : pathPoints[i];
    const p1 = pathPoints[i];
    const p2 = pathPoints[i + 1];
    const p3 = i < pathPoints.length - 2 ? pathPoints[i + 2] : pathPoints[i + 1];

    // Catmull-Rom interpolation between p1 and p2
    for (let j = 1; j < segmentPoints; j++) {
      const t = j / segmentPoints;
      const t2 = t * t;
      const t3 = t2 * t;

      const x =
        0.5 *
        (2 * p1.x +
          (-p0.x + p2.x) * t +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);

      const z =
        0.5 *
        (2 * p1.z +
          (-p0.z + p2.z) * t +
          (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 +
          (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3);

      smoothed.push({ x, z });
    }
  }

  smoothed.push(pathPoints[pathPoints.length - 1]);
  return smoothed;
}
