import { convertCellValues, IndexKeyCell } from "../gridmap-parser/gridmap.mjs";
import { tilemapFlagToGridmapRot } from "./rot_tilemap_flag_convert.mjs";

function renderGridMap(name: string, mesh_library: string, cellData: IndexKeyCell[], map: TileMap): string {

const cell_size = map.property(`cell_size:${name}`)||`Vector3(1,1,1)`;
const cell_scale = map.property(`cell_scale:${name}`)||`1`;
const transform = map.property(`transform:${name}`)||`Transform3D(1,0,0,0,1,0,0,0,1,0,0,0)`;

const data = convertCellValues(cellData);

return `[node name=${name} type="GridMap"]
mesh_library = ExtResource("${mesh_library}")
cell_scale = ${cell_scale}
cell_size = ${cell_size}
transform = ${transform}
data = {
"cells": PackedInt32Array(${data.join(', ')})
}
metadata/_editor_floor_ = Vector3(0, 0, 0)
`
}

function generateRandomString(length: number) {
  return [...Array(length)].map(() => Math.random().toString(26)[2]).join('');
}

export function convertTileMaptoGridMap(map: TileMap): string {
  const cellData: Record<string, IndexKeyCell[]> = {}
  const extResources: Record<string, string> = {}
  const gridmapResources: Record<string, string> = {}

  map.layers.forEach(layer => {
    if(layer.isTileLayer) {
      const gridMap = layer.property('gridmap')?.toString() || '';
      const mesh_library = map.property(`mesh_library:${gridMap}`)?.toString()||``;
      if(!extResources[mesh_library]) {
        const id = extResources[mesh_library]=`${Object.keys(extResources).length+1}_${generateRandomString(5)}`;
        gridmapResources[gridMap]=id;
      }
      const data  = (cellData[gridMap] = (cellData[gridMap] || []));
      const height = layer.property('y') as number;
      const tileLayer = layer as TileLayer;
      tiled.log(`Parsing ${layer.name}: [${gridMap}] [${mesh_library}]`)
      tileLayer.region().rects.forEach( rect => {
        for(let y=rect.y;y<(rect.y+rect.height);y++)
        for(let x=rect.x;x<(rect.x+rect.width);x++) {
          const cell = tileLayer.cellAt(x,y);
          if(cell.tileId >=0) {
            const flipped_h = cell.flippedHorizontally;
            const flipped_v = cell.flippedVertically;
            const flipped_d = cell.flippedAntiDiagonally;
            data.push({ x, y: height, z: y, item: cell.tileId, rot: tilemapFlagToGridmapRot(flipped_h, flipped_v, flipped_d), layer: 0 })
          }
        }
      })
      tiled.log(`New GridMap Cell Count: ${data.length}`)
    }
  });


  const text = 
`
[gd_scene load_steps=2 format=3]
${
  Object.entries(extResources).map(([mesh, id]) => {
    return `[ext_resource type="MeshLibrary" path="${mesh}" id="${id}"]`
  }).join('\n')
}
${Object.entries(cellData).map(([name, data]) => {
  return renderGridMap(name, gridmapResources[name], data, map)
}).join('\n')}`
return text;
}
