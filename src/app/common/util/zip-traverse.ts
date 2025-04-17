import * as fflate from 'fflate';


import { DirContents, postTraverse } from "./common-traverse";

type LogicFilter = { path: RegExp, regex: RegExp, dest: 'previews' | 'models' | 'textures', rename?: (s: string) => string }

const logic: LogicFilter[] = [
  { path: /^Previews\//, regex: /\.(jpg|png)$/i, dest: 'previews' },
  { path: /^Isometric\//, regex: /_SE\.(jpg|png)$/i, dest: 'previews', rename: s => s.replace(/_SE\.(jpg|png)$/i, ".$1") },
  { path: /^Models\/(GLB|GLTF) format\//, regex: /\.glb$/i, dest: 'models' },
  { path: /^Models\/(GLB|GLTF) format\//, regex: /\.png$/i, dest: 'textures' },
]

export async function traverseZip(zipFile: File) {

  const dirContent: DirContents = {
    previews: null,
    models: null,
    textures: null
  }
  const dirName = zipFile.name.replace(/\.zip$/i, '');

  fflate.unzip(new Uint8Array(await zipFile.arrayBuffer()), {
    filter(info) {
      const { name } = info;
      let result = false;
      for (let filter of logic) {
        result = result || (filter.path.test(name) && filter.regex.test(name))
      }
      return result;
    }
  }, (err, data) => {
    if (err == null) {
      for (let [name, arrbuffer] of Object.entries(data)) {
        for (let filter of logic) {
          if (filter.path.test(name) && filter.regex.test(name)) {
            let key = name.replace(filter.path, '');
            if (filter.rename) {
              key = filter.rename(key);
            }
            dirContent[filter.dest] = (dirContent[filter.dest] || new Map());
            dirContent[filter.dest]?.set(`${dirName}/${key}`, new Blob([arrbuffer]));
          }
        }
      }
      postTraverse(dirName, dirContent)
    }
  })
}