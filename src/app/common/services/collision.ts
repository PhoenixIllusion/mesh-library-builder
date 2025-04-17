
export type CollisionType = 'empty' | 'box' | 'capsule' | 'convex' | 'cylinder' | 'sphere' | 'trimesh'

export interface CollisionNode {
  type: CollisionType;
  extents: [number, number, number];
  position: [number, number, number];
  rotation: [number, number, number, number];
  data?: [number, number, number][];
  children?: CollisionNode[];
}

const CollisionNodeFields: (keyof CollisionNode)[] = ['type', 'extents', 'position', 'rotation'];
const CollisionNodeFieldsArr: (keyof CollisionNode)[] = ['extents', 'position', 'rotation'];

export function validateCollisionNode(node: CollisionNode): boolean {
  for (let field of CollisionNodeFields) {
    if (!node[field]) return false;
  }
  if (typeof node.type != 'string') {
    return false;
  }
  for (let field of CollisionNodeFieldsArr) {
    if (!Array.isArray(node[field])) return false;
  }
  if (node.children && !Array.isArray(node.children)) return false;
  return true;
}

export function validateCollisionNodeRecursive(node: CollisionNode, depth = 0, maxDepth = 10, _seen: Set<CollisionNode> = new Set()): boolean {
  if (depth >= maxDepth) {
    return true;
  }
  let valid = true;
  valid &&= validateCollisionNode(node);
  _seen.add(node);
  if ((depth + 1) < maxDepth) {
    node?.children?.forEach(child => {
      if (!_seen.has(child)) {
        valid &&= validateCollisionNodeRecursive(child, depth + 1, maxDepth, _seen);
      }
    })
  }
  return valid;
}