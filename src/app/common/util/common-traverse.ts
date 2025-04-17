import { MeshEntry, DBMeshes, TextureEntry } from "../services/db";


export interface DirContents {
  previews: Map<string, Blob> | null;
  models: Map<string, Blob> | null;
  textures: Map<string, Blob> | null;
}

export async function postTraverse(dirName: string, { previews, models, textures }: DirContents) {

  if (previews && models) {
    const meshEntries: MeshEntry[] = []
    for (let [previewFilename, previewBlob] of previews.entries()) {
      const key = previewFilename.replace(/\.[^\.]+$/, '')
      const model = models.get(key + '.glb')
      if (model) {
        const previewExt = previewFilename.split('.').pop()!;
        const entry: MeshEntry = {
          directory: dirName,
          name: key,
          gltf: model,
          icon: {
            data: previewBlob,
            extension: previewExt
          }
        }
        meshEntries.push(entry);
      }
    }
    await DBMeshes.addMeshDirectory(meshEntries);
    if (textures) {
      const entries: TextureEntry[] = []
      for (let [filename, blob] of textures.entries()) {
        entries.push({
          name: filename,
          directory: dirName,
          data: blob
        })
      }
      await DBMeshes.addTextureDirectory(entries);
    }
  }
}