import { Mesh, BufferGeometry, Object3D, Material, InstancedMesh, MeshStandardMaterial } from "three";
import { BufferGeometryUtils } from "three/examples/jsm/Addons.js";

interface SubBuffer {
  byteLength: number;
  byteOffset: number;
}
export const subBuffer = (struct: SubBuffer, arrayBuffer: ArrayBuffer) => {
  return arrayBuffer.slice(struct.byteOffset, struct.byteLength + struct.byteOffset);
}

type VertextDataHash = { [vertexLayout: string]: { [material: string]: { material: Material, geometries: BufferGeometry[] } } };

export const processObjectTree = (object: Object3D): Mesh[] => {
  const childMeshes: Mesh[] = [];
  if (object.isObject3D) {
    if (object.children) {
      object.children.forEach(child => {
        child.applyMatrix4(object.matrix);
        child.updateMatrix();
        childMeshes.push(...processObjectTree(child));
      })
    }
  }
  if (object.type === 'Mesh') {
    const mesh = object as Mesh;
    mesh.geometry.applyMatrix4(mesh.matrix);
    return [mesh];
  }
  return childMeshes;
}
export const flattenMeshes = (childMeshes: Mesh[]): Mesh[] => {
  const ret: Mesh[] = [];
  const vertTypeHash: VertextDataHash = {};
  childMeshes.forEach(child => {
    const vertextLayout = Object.keys(child.geometry.attributes).join(':');
    const material = Array.isArray(child.material) ? child.material.map(x => x.uuid).join(':') : child.material.uuid;
    if (!vertTypeHash[vertextLayout]) {
      vertTypeHash[vertextLayout] = {};
    }
    if (!vertTypeHash[vertextLayout][material]) {
      vertTypeHash[vertextLayout][material] = { material: child.material as Material, geometries: [] }
    }
    vertTypeHash[vertextLayout][material].geometries.push(child.geometry)
  });
  Object.values(vertTypeHash).forEach(vertexLayout => {
    const geometries: BufferGeometry[] = [];
    const materials: Material[] = [];
    Object.values(vertexLayout).forEach(material => {
      geometries.push(BufferGeometryUtils.mergeGeometries(material.geometries));
      materials.push(material.material);
    })
    const totalGeometry = BufferGeometryUtils.mergeGeometries(geometries, true);
    ret.push(new Mesh(totalGeometry, materials));
  })
  return ret;
}
export function disableMetalness(obj: Object3D) {
  obj.traverse(child => {
    if ('material' in child) {
      const mat = child.material as MeshStandardMaterial;
      if (mat.metalness === 1) mat.metalness = 0;
    }
  })
}
export const flattenObjectTree = (object: Object3D): Mesh[] => {
  return flattenMeshes(processObjectTree(object));
}
export const deinterleaveArray = (packFormat: number[], stride: number, array: Float32Array): Float32Array[] => {
  const elementCount = array.length / stride;
  const buffers = packFormat.map(count => new Float32Array(count * elementCount));
  let masterIndex = 0;
  let curPos = packFormat.map(_ => 0);
  for (let i = 0; i < elementCount; i++) {
    packFormat.forEach((packCount, curBuffer) => {
      for (let j = 0; j < packCount; j++) {
        buffers[curBuffer][curPos[curBuffer]++] = array[masterIndex++];
      }
    })
  }
  return buffers;
}

export class InstancedRef {
  count = 0;
  instancedMesh?: InstancedMesh[];
  constructor(public meshes: Mesh[]) {

  }
  getMesh(object: Object3D): () => Mesh[] {
    const index = this.count++;
    return () => {
      object.updateMatrix();
      if (this.count == 1) {
        this.meshes.forEach(mesh => {
          mesh.applyMatrix4(object.matrix);
        });
        return this.meshes;
      } else {
        if (!this.instancedMesh) {
          this.instancedMesh = this.meshes.map(mesh => {
            return new InstancedMesh(mesh.geometry, mesh.material, this.count)
          });
        }
        const instances = this.instancedMesh as InstancedMesh[];
        instances.forEach((inst) => {
          inst.setMatrixAt(index, object.matrix);
          if (index == this.count - 1) {
            inst.instanceMatrix.needsUpdate = true;
          }
        })
        if (index == 0) {
          return instances;
        }
      }
      return [] as Mesh[];
    }
  }
} 