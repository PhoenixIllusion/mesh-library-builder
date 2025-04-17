import { postTraverse } from "./common-traverse";

async function loadAsBlobs(prefix: string, dir: FileSystemDirectoryHandle, regex: RegExp, filterName: (s: string) => string = x => x): Promise<Map<string, Blob>> {
  const res: Map<string, Blob> = new Map();
  for await (const [filename, handle] of dir.entries()) {
    if (filename.match(regex) && handle instanceof FileSystemFileHandle) {
      const path = filterName(`${prefix}/${filename}`);
      if (!res.has(path))
        res.set(path, await handle.getFile())
    }
  }
  return res;
}

export async function traverseDirectory(dirHandle: FileSystemDirectoryHandle) {
  await dirHandle.requestPermission({ mode: 'read' })
  let previews: Map<string, Blob> | null = null;
  let models: Map<string, Blob> | null = null;
  let textures: Map<string, Blob> | null = null;
  const dirName = dirHandle.name;
  for await (const [filename, handle] of dirHandle.entries()) {
    if (filename == 'Previews') {
      previews = await loadAsBlobs(dirName, <FileSystemDirectoryHandle>handle, /\.(jpg|png)$/i);
    }
    if (filename == 'Isometric') {
      const regex = /_SE\.(jpg|png)$/i;
      previews = await loadAsBlobs(dirName, <FileSystemDirectoryHandle>handle, regex, s => s.replace(regex, '.$1'));
    }
    if (filename == 'Models') {
      const dir = (<FileSystemDirectoryHandle>handle);
      for await (const [filename, handle] of dir.entries()) {
        if (filename == 'GLB format' || filename == 'GLTF format') {
          models = await loadAsBlobs(dirName, <FileSystemDirectoryHandle>handle, /\.glb$/i);
          try {
            const texDir = await (<FileSystemDirectoryHandle>handle).getDirectoryHandle('Textures')
            textures = await loadAsBlobs(`${dirName}/${texDir.name}`, texDir, /\.png$/i);
          } catch { }
        }
      }
    }
  }
  await postTraverse(dirHandle.name, { previews, models, textures })
}

