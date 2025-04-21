import { ImageBitmapLoader, LoadingManager } from "three";
import { DBMeshes, MeshEntry } from "../services/db";
import { GLTF, GLTFLoader } from "three/examples/jsm/Addons.js";

const gltfLoader = new GLTFLoader();

class DBImageBitmapLoader extends ImageBitmapLoader {
  constructor(manager: LoadingManager) {
    super(manager);
  }
  async load(url: string, onLoad?: (bmp: ImageBitmap) => void, _onProgress?: ((event: ProgressEvent<EventTarget>) => void), onError?: (e: Error) => void) {
    const tex = await DBMeshes.getTextureByName(url);
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

const models: Map<string, GLTF> = new Map();

async function loadModelWithBlob(mesh: MeshEntry): Promise<GLTF> {
  const blob = mesh.gltf;
  const key = mesh.name;
  const dir = mesh.directory;
  const gltf = await gltfLoader.parseAsync(await blob.arrayBuffer(), dir + '/');
  models.set(key, gltf);
  gltf?.scene?.name && (gltf.scene.name = key);
  return gltf;
}

export function invalidateDBModel(path: string) {
  models.delete(path);
}

export async function loadDBModel(path: string) {
  const model = models.get(path);
  if (model) {
    return model;
  }
  const mesh = await DBMeshes.getMeshByName(path);
  if (mesh) {
    return loadModelWithBlob(mesh);
  }
  return null;
}