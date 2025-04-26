import { Box3, BufferAttribute, BufferGeometry, LineBasicMaterial, LineSegments, Mesh, Object3D, Quaternion, Vector3, Vector3Tuple, Vector4Tuple, WireframeGeometry } from "three";
import { CollisionNode } from "../../../common/services/collision";
import { GenerateCollisionSignal } from "../../collision/collision-panel";
import { ActiveModel } from "../active-model";
import { BoxLineGeometry, BufferGeometryUtils, ConvexGeometry, ConvexHull } from "three/examples/jsm/Addons.js";
import { MeshBVH, SAH } from "three-mesh-bvh";

export function clearCollisionModels(data: ActiveModel.Data) {
  data.collision?.remove(... data.collision?.children||[])
}


const defaultMaterial = new LineBasicMaterial({
  color: 0xffffff,
  depthTest: false,
  opacity: 0.5,
  transparent: true
});

const activeMaterial = new LineBasicMaterial({
  color: 0xff00ff,
  depthTest: false,
  opacity: 0.5,
  transparent: true
});

function renderNode(parent: Object3D, node: CollisionNode, namePrefix: string) {
  const root = new Object3D();
  root.setRotationFromQuaternion(new Quaternion(...node.rotation))
  let geometry: BufferGeometry | null = null;
  switch (node.type) {
    case 'box': {
      geometry = new BoxLineGeometry(...node.extents, 1, 1, 1);
    } break;
    case 'convex': {
      geometry = new ConvexGeometry(node.data?.map(x => new Vector3(...x)) || []);
    }; break;
    case 'trimesh': {
      geometry = new BufferGeometry();
      const vertices = new Float32Array(node.data?.flat() || [])
      geometry.setAttribute('position', new BufferAttribute(vertices, 3));
    }
  }

  if (geometry) {
    const wireframe = new WireframeGeometry(geometry);
    const cube = new LineSegments(wireframe, defaultMaterial);
    cube.name = namePrefix;
    root.add(cube);
  }

  root.position.set(...node.position);
  node.children?.forEach((node, i) => {
    renderNode(root, node, namePrefix + '.' + i);
  })
  parent.add(root);
}

export function renderCollisionDataToNode(root: Object3D, collision: CollisionNode[] | null) {
  if (!collision?.length) {
    return;
  }
  collision.forEach((node, i) => {
    renderNode(root, node, '' + i);
  })
}

export function renderCollisionData(data: ActiveModel.Data, collision: CollisionNode[] | null) {
  clearCollisionModels(data);
  if (!collision?.length) {
    return;
  }
  const root = data.collision;
  renderCollisionDataToNode(root, collision);
}

export function renderCollisionDataSelection(data: ActiveModel.Data, key: string | null) {
  const collision = data.collision;
  if (collision) {
    collision.traverse(child => {
      if (child instanceof LineSegments) {
        child.material = child.name == key ? activeMaterial : defaultMaterial;
      }
    })
  }
}

function mergeGeometry(obj: Object3D): BufferGeometry {
  const geometries: BufferGeometry[] = [];
  obj.traverse(child => {
    if (child instanceof Mesh) {
      geometries.push(child.geometry)
    }
  })
  return BufferGeometryUtils.mergeGeometries(geometries);
}

function box3ToCollision(box3: Box3): CollisionNode {
  const position = box3.getCenter(new Vector3()).toArray();
  const rotation: Vector4Tuple = [0, 0, 0, 1];
  const extents: Vector3Tuple = box3.getSize(new Vector3()).toArray();
  return { type: 'box', position, rotation, extents };
}

function generateAABB(geometry: BufferGeometry): CollisionNode[] {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;

  return [
    box3ToCollision(box)
  ]
}
function generateSphere(geometry: BufferGeometry): CollisionNode[] {
  geometry.computeBoundingSphere();
  const sphere = geometry.boundingSphere!;
  const position = sphere.center.toArray();
  const rotation: Vector4Tuple = [0, 0, 0, 1];
  const extents: Vector3Tuple = [sphere.radius, sphere.radius, sphere.radius];
  return [
    { type: 'sphere', position, rotation, extents }
  ]
}

function generateBVH(geometry: BufferGeometry, maxDepth: number): CollisionNode[] {
  const bvh = new MeshBVH(geometry, { strategy: SAH });
  const box3 = new Box3();
  const result: CollisionNode[] = [];
  bvh.traverse((depth, isLeaf, boundData, _offset, _count) => {
    if (depth < maxDepth) {
      if (depth == maxDepth - 1 || isLeaf) {
        box3.setFromArray(boundData as any as Float32Array);
        result.push(box3ToCollision(box3))
      }
    }
  })
  return result;
}

function generateConvexHull(obj: Object3D): CollisionNode[] {
  const hull = new ConvexHull();
  hull.setFromObject(obj);
  return [
    { type: 'convex', position: [0, 0, 0], rotation: [0, 0, 0, 1], extents: [0, 0, 0], data: hull.vertices.map(p => p.point.toArray()) }
  ]
}
function generateTriMesh(geometry: BufferGeometry): CollisionNode[] {
  const p = geometry.toNonIndexed().getAttribute('position').array as Float32Array;
  const data: Vector3Tuple[] = [];
  for (let i = 0; i < p.length; i += 3) {
    data.push([p[i], p[i + 1], p[i + 2]]);
  }
  return [
    { type: 'trimesh', position: [0, 0, 0], rotation: [0, 0, 0, 1], extents: [0, 0, 0], data }
  ]
}

export function generateCollisionData(data: ActiveModel.Data, evt: GenerateCollisionSignal): CollisionNode[] {
  const model = data.obj;
  if (model == null) {
    return [];
  }
  switch (evt) {
    case 'AABox':
      return generateAABB(mergeGeometry(model));
    case 'Sphere':
      return generateSphere(mergeGeometry(model));
    case 'BVH3':
      return generateBVH(mergeGeometry(model), 3);
    case 'BVH6':
      return generateBVH(mergeGeometry(model), 6);
    case 'ConvexHull':
      return generateConvexHull(model);
    case 'TriMesh':
      return generateTriMesh(mergeGeometry(model));
  }

  return [];
}