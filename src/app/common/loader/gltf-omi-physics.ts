import { BufferAttribute, BufferGeometry, Mesh, MeshBasicMaterial, Object3D, Points, PointsMaterial, Quaternion, Vector3, Vector3Tuple } from "three";
import { BufferGeometryUtils, ConvexGeometry, GLTFExporter, GLTFExporterPlugin, GLTFWriter } from "three/examples/jsm/Addons.js";
import { DBMap, DBMeshes } from "../services/db";
import { CollisionNode } from "../services/collision";
import { md5 } from 'js-md5';
import { loadDBModel } from "./db-model-loader";
import { flattenObjectTree } from "./model-utils";

interface OMIPhysicsBody {
  motion: {
    type: 'dynamic' | 'static'
  }
  collider: {
    shape: number;
  }
}
interface OMIPhysicsShapeBox {
  type: 'box',
  box: {
    size: [number, number, number]
  }
}
interface OMIPhysicsShapeSphere {
  type: 'sphere';
  sphere: {
    radius: number;
  }
}
interface OMIPhysicsShapeTriMesh {
  type: 'trimesh';
  trimesh: {
    mesh: number;
  }
}
interface OMIPhysicsShapeConvex {
  type: 'convex';
  convex: {
    mesh: number;
  }
}
type OMIPhysicsShape = OMIPhysicsShapeBox | OMIPhysicsShapeSphere | OMIPhysicsShapeConvex | OMIPhysicsShapeTriMesh;

function getCollisionCacheKey(node: CollisionNode) {
  const data = [...node.extents, ... (node.data?.flat() || [])]
  const f32Buffer = new Float32Array(data);
  return node.type + '-' + md5.hex(f32Buffer.buffer);
}

const OMI_physics_shape = "OMI_physics_shape";
const OMI_physics_body = "OMI_physics_body";

interface MeshWriter extends GLTFWriter {
  pending: Promise<any>[];
  processMeshAsync(mesh: Mesh): Promise<number | null>;
}

function getCollisionNodeGeometry(node: CollisionNode): BufferGeometry | null {
  switch (node.type) {
    case 'convex': {
      return new ConvexGeometry(node.data?.map(x => new Vector3(...x)) || []);
    }; break;
    case 'trimesh': {
      const geometry = new BufferGeometry();
      const vertices = new Float32Array(node.data?.flat() || [])
      geometry.setAttribute('position', new BufferAttribute(vertices, 3));
      return geometry;
    }
  }
  return null;
}


class OMI_Physics_Plugin implements GLTFExporterPlugin {
  private basicMaterial = new MeshBasicMaterial();
  constructor(public writer: GLTFWriter, private collisionData: Map<Object3D, CollisionNode | null>) { }

  private getShapeArray() {
    const writer = this.writer;
    const json = (writer as any).json as { extensions?: { OMI_physics_shape: { shapes: [] } } };
    const ext = json.extensions = json.extensions || { OMI_physics_shape: { shapes: [] } };
    return ext.OMI_physics_shape.shapes as OMIPhysicsShape[];
  }

  private setMeshId(writer: MeshWriter, geometry: BufferGeometry | null, obj: { mesh: number }) {
    if (geometry) {
      writer.pending.push(writer.processMeshAsync(new Mesh(BufferGeometryUtils.mergeVertices(geometry, 0), this.basicMaterial)).then(idx => {
        if (idx)
          obj.mesh = idx;
      }))
    }
  }

  private shapeCache = new Map<string, number>();
  getShapeIndex(collisionNode: CollisionNode): number {
    const hashKey = getCollisionCacheKey(collisionNode);
    const cache = this.shapeCache.get(hashKey);
    const meshWriter: MeshWriter = <MeshWriter>this.writer;
    if (cache !== undefined) {
      return cache;
    }
    const shapeArray = this.getShapeArray();
    switch (collisionNode.type) {
      case 'box': {
        const box: OMIPhysicsShapeBox = {
          type: 'box', box: { size: collisionNode.extents as Vector3Tuple }
        };
        shapeArray.push(box);
        return shapeArray.length - 1;
      }
      case 'sphere': {
        const sphere: OMIPhysicsShapeSphere = {
          type: 'sphere', sphere: { radius: collisionNode.extents[0] }
        };
        shapeArray.push(sphere);
        return shapeArray.length - 1;
      }
      case 'trimesh': {
        const trimesh: OMIPhysicsShapeTriMesh = {
          type: 'trimesh', trimesh: { mesh: 0 }
        };
        this.setMeshId(meshWriter, getCollisionNodeGeometry(collisionNode), trimesh.trimesh);
        shapeArray.push(trimesh);
        return shapeArray.length - 1;
      }
      case 'convex': {
        const convex: OMIPhysicsShapeConvex = {
          type: 'convex', convex: { mesh: 0 }
        };
        this.setMeshId(meshWriter, getCollisionNodeGeometry(collisionNode), convex.convex);
        shapeArray.push(convex);
        return shapeArray.length - 1;
      }
    }
    return 0;
  }

  writeNode(object: Object3D, nodeDef: { [key: string]: any }) {
    const collisionData = this.collisionData.get(object);
    if (collisionData) {
      const writer = this.writer;
      nodeDef.extensions = nodeDef.extensions || {};

      const ext: OMIPhysicsBody = {
        motion: { type: 'static' },
        collider: { shape: this.getShapeIndex(collisionData) }
      }
      nodeDef.extensions[OMI_physics_body] = ext;

      writer.extensionsUsed[OMI_physics_body] = writer.extensionsUsed[OMI_physics_shape] = true;
    }
  }
}

function addCollisionNode(obj: Object3D, node: CollisionNode, collisionMap: Map<Object3D, CollisionNode | null>) {
  const root = new Object3D();
  root.setRotationFromQuaternion(new Quaternion(...node.rotation))
  root.position.set(...node.position);
  collisionMap.set(root, node);
  node.children?.forEach((node) => {
    addCollisionNode(root, node, collisionMap);
  })
  obj.add(root);
}

function makePoint() {
  const dotGeometry = new BufferGeometry();
  dotGeometry.setAttribute('position', new BufferAttribute(new Float32Array([0, 0, 0]), 3));
  const dotMaterial = new PointsMaterial({ size: 1, color: 0xffffff });
  return new Points(dotGeometry, dotMaterial);
}

export async function writeMeshLibrary(map_id: string) {
  const exporter = new GLTFExporter();
  const map = await DBMap.load(map_id);

  const EMPTY_SLOT = makePoint();

  if (map) {
    const root = new Object3D();
    const collisionMap: Map<Object3D, CollisionNode | null> = new Map();
    const { width, height, data } = map;
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const slot: `${number}-${number}` = `${y}-${x}`;
        const obj = new Object3D();
        obj.position.x = (width - x - width / 2.0)
        obj.position.z = (height - y - height / 2.0)
        obj.name = ('' + (x + y * width)).padStart(4).replaceAll(' ', '0');
        const model = data[slot];
        if (model) {
          const gltf = await loadDBModel(model);
          if (gltf) {
            const meshes = flattenObjectTree(gltf.scene)
            if (meshes.length == 1) {
              const mesh = meshes[0];
              mesh.geometry.rotateY(Math.PI);
              const data = await DBMeshes.loadCollisionData(model);
              const collisionNode = new Object3D();
              data?.collision?.forEach(node => {
                addCollisionNode(collisionNode, node, collisionMap);
              })
              mesh.name = `${obj.name} - ${model}`;
              obj.rotateY(Math.PI);
              collisionNode.rotateY(Math.PI);
              mesh.add(collisionNode);
              obj.add(mesh);
            } else {
              console.error(`Error flattening ${model}. Mesh has more than one type of geometry.`)
            }
          }
        } else {
          const mesh = EMPTY_SLOT.clone();
          mesh.name = `${obj.name} - <empty>`;
          obj.add(mesh);
        }
        root.add(obj);
      }
    exporter.register(writer => new OMI_Physics_Plugin(writer, collisionMap));
    return exporter.parseAsync(root, { binary: true })
  }
  return null;
}