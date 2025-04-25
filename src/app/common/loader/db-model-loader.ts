import { ImageBitmapLoader, LoadingManager, Material, Mesh, MeshStandardMaterial, Object3D, Source, Color } from "three";
import { DBMeshes, DBTexture, DBVariants, MaterialOverride, MaterialOverrideBase, MeshEntry, VariantEntry } from "../services/db";
import { GLTF, GLTFLoader } from "three/examples/jsm/Addons.js";

const gltfLoader = new GLTFLoader();

class DBImageBitmapLoader extends ImageBitmapLoader {
  constructor(manager: LoadingManager) {
    super(manager);
  }
  async load(url: string, onLoad?: (bmp: ImageBitmap) => void, _onProgress?: ((event: ProgressEvent<EventTarget>) => void), onError?: (e: Error) => void) {
    const tex = await DBTexture.getTextureByName(url);
    if (tex) {
      const scope = this;
      const bmp = await createImageBitmap(tex.data, Object.assign(scope.options as ImageBitmapOptions, { colorSpaceConversion: 'none' as ColorSpaceConversion }));
      onLoad && onLoad(bmp);
      return bmp;
    }
    onError && onError(new Error("404 '" + url + "' not found"));
  }
}

const dirLoader = {
  name: "DB Loader",
  textureLoader: new DBImageBitmapLoader(gltfLoader.manager)
}

gltfLoader.register(parser => {
  parser.textureLoader = dirLoader.textureLoader;
  return dirLoader
})
interface GLTFTexture {
  uri: string;
  name: string;
}
interface GLTFMaterial {
  doubleSided?: boolean;
  name: string;
  pbrMetallicRoughness?: {
    baseColorTexture?: { index: number };
    baseColorFactor?: [number,number,number,number];
    roughnessFactor?: number;
    metallicFactor?: number;
  }
  normalTextureInfo?: {
    index: number;
    scale: number;
  }
}

const models: Map<string, GLTF> = new Map();
const json: Map<string, { images?: GLTFTexture[], materials?: GLTFMaterial[] }> = new Map();

async function loadModelWithBlob(mesh: MeshEntry): Promise<GLTF> {
  const blob = mesh.gltf;
  const key = mesh.name;
  const dir = mesh.directory;
  const gltf = await gltfLoader.parseAsync(await blob.arrayBuffer(), dir + '/');
  models.set(key, gltf);
  const { images, materials } = gltf.parser.json;
  json.set(key, { images, materials });
  gltf?.scene?.name && (gltf.scene.name = key);
  return gltf;
}

export function invalidateDBModel(path: string) {
  models.delete(path);
}

export async function getMaterials(path: string): Promise<MaterialOverride[]> {
  if(!json.has(path)) {
    await loadDBModel(path);
  }
  const result: MaterialOverride[] = [];
  const entry: MeshEntry|null = await DBMeshes.getMeshByName(path);
  if(entry) {
    const values = json.get(path);
    const images = (values?.images || []).map(x => `${entry.directory}/${x.uri}`);
    values?.materials?.forEach(val => {
      const { name } = val;
      const pbr = val.pbrMetallicRoughness;
      if(pbr) {
        const metallic = pbr.metallicFactor || 1;
        const roughness = pbr.roughnessFactor || 1;
        const normal = val?.normalTextureInfo;
        const base: MaterialOverrideBase = { name, metallic, roughness};
        if(normal && images[normal.index]) {
          base.normal = { texture: images[normal.index], scale: normal.scale || 1.0 }
        }
        if(pbr.baseColorTexture && images[pbr.baseColorTexture.index]) {
          result.push({
            ... base,
            texture: images[pbr.baseColorTexture.index],
          })
        }
        if(pbr.baseColorFactor) {
          result.push({
            ... base,
            color: pbr.baseColorFactor
          })
        }
      }
    })
  }
  
  return result;
}

const texCache: Record<string, Source> = {}
async function loadTexture(url: string): Promise<Source> {
  return new Promise((resolve, reject) => {
    dirLoader.textureLoader.load(url, (bmp) => {
      const src = texCache[url] = new Source(bmp);
      resolve(src);
    }, () => {}, reject);
  });
}

async function addVariantData(gltf: GLTF, variant: VariantEntry): Promise<{ scene: Object3D }> {
  const result = gltf.scene.clone();
  const cache = new Map<string, Material>();
  const promises: Promise<any>[] = [];
  result.traverse(node => {
    if(node.type == 'Mesh') {
      const mesh = <Mesh> node;
      const materials = Array.isArray(mesh.material) ? mesh.material : [ mesh.material];
      for (const [idx, mat] of materials.entries()) {
        if(cache.has(mat.name)) {
          materials[idx] = cache.get(mat.name)!;
        } else {
          const v = variant.materials.find(x => x.name == mat.name);
          if(v) {
            const m = mat.clone() as  MeshStandardMaterial;
            materials[idx] = m;
            if('texture' in v) {
              const map = m.map = m.map!.clone();
              promises.push((async () => {
                map.source = await loadTexture(v.texture);
                map.needsUpdate = true;
                m.needsUpdate = true;
              })())
            }
            if('color' in v) {
              const [r,g,b] = v.color;
              m.color = new Color(r,g,b);
              m.needsUpdate = true;
            }
            cache.set(mat.name, m);
          }
        }
      }
      if(Array.isArray(mesh.material))
        mesh.material = materials;
      else
        mesh.material = materials[0]
    }
  });
  await Promise.all(promises);
  return {scene: result};
}

export async function loadDBModel(path: string, variantId: string|null = null) {
  const model = models.get(path);
  const variant = variantId ? await DBVariants.getById(variantId): null;
  if (model) {
    if(variant) {
      return addVariantData(model, variant);
    }
    return model;
  }
  const mesh = await DBMeshes.getMeshByName(path);
  if (mesh) {
    const model = await loadModelWithBlob(mesh);
    if(variant) {
      return addVariantData(model, variant);
    }
    return model;
  }
  return null;
}