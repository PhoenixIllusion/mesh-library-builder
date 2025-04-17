import { convertGridMapsToTileMap } from './convert/gridmap_to_tmx.mjs';
import { convertTileMaptoGridMap } from './convert/tmx_to_gridmap.mjs';
import { parseGridMap } from './gridmap-parser/gridmap.mjs';


tiled.registerMapFormat("GridMap", {
	name: "Godot Gridmap TSCN",
	extension: "tscn",
  write: (map: TileMap, fileName: string) => {
    const file = new TextFile(fileName, TextFile.WriteOnly);
    const text = convertTileMaptoGridMap(map);
    file.write(text);
    file.commit();
    return ""
  },
  read: (fileName: string): TileMap => {
    const file = new TextFile(fileName, TextFile.ReadOnly);
    const gridMaps = parseGridMap(fileName, file.readAll());
    return convertGridMapsToTileMap(fileName, gridMaps);
  }
});