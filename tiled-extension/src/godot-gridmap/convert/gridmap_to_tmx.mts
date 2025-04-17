import { GridMap } from "../gridmap-parser/gridmap.mjs";
import { gridmapRotToTilemapFlag } from "./rot_tilemap_flag_convert.mjs";


class MinMax {
  min = 1e30;
  max = -1e30;
  update(v: number) {
    this.min = Math.min(this.min, v);
    this.max = Math.max(this.max, v);
  }
  range() {
    return [this.min, this.max]
  }
  length() {
    return this.max - this.min;
  }
}

function loadTileSetIfNeeded(map: GridMap, fileName: string, loadedTileSet: Record<string,Tileset>): Tileset {
  const mesh_library = map.mesh_library;
  if(loadedTileSet[mesh_library]) {
    return loadedTileSet[mesh_library];
  }
  const filename = mesh_library.replace(/^.+\//,'').replace(/\.tres/,'');
  const tsx = `${fileName.replace(/\/[^\/]+$/,'')}/${filename}.tsx`;
  const tileset = tiled.tilesetFormat("tsx")!.read(tsx);
  loadedTileSet[mesh_library] = tileset;
  return tileset;
}

export function convertGridMapsToTileMap(fileName: string, gridMaps: GridMap[]): TileMap {
  const map = new TileMap();
  map.tileHeight = 48;
  map.tileWidth = 48;
  map.infinite = true;
  const loadedTileSet: Record<string,Tileset> = {}

  const range = { x: new MinMax(), y: new MinMax(), z: new MinMax() };

  const mapTiles: Record<string, {y: number, name: string, layer: TileLayer, edit: TileLayerEdit}> = {}
  gridMaps.forEach((m) => {
    map.setProperty(`cell_size:${m.name}`,`Vector3(${m.cell_size.join(',')})`)
    map.setProperty(`cell_scale:${m.name}`,m.cell_scale)
    map.setProperty(`transform:${m.name}`,`Transform3D(${m.transform.join(',')})`)
    map.setProperty(`mesh_library:${m.name}`,m.mesh_library);
    const tileset = loadTileSetIfNeeded(m, fileName, loadedTileSet);
    if(tileset)
    m.data.forEach(({x,y,z, item, rot}) => {
      const key = `${m.name}: ${y}`
      if(!mapTiles[key]) {
        const layer = new TileLayer(key);
        layer.setProperty('y', y);
        layer.setProperty('gridmap', m.name);
        mapTiles[key] = { y, name: m.name, layer, edit: layer.edit() };
      }
      const edit = mapTiles[key].edit;
      edit.setTile(x,z, tileset.tile(item), gridmapRotToTilemapFlag(rot));
      range.x.update(x);
      range.y.update(y);
      range.z.update(z);
    });
  });
  for (let entry of Object.values(mapTiles).sort((b,a) => {
    if(a.y == b.y) {
      return a.name.localeCompare(b.name);
    }
    return a.y - b.y;
  })) {
    const {layer, edit} = entry;
    edit.apply();
    map.addLayer(layer);
  }
  map.width = range.x.length();
  map.height = range.z.length();
  return map;
}