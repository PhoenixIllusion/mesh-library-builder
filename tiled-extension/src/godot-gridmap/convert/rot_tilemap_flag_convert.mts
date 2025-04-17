
const ROT_90  = Tile.FlippedHorizontally | Tile.FlippedAntiDiagonally;
const ROT_180 = Tile.FlippedVertically   | Tile.FlippedAntiDiagonally;
const ROT_270 = Tile.FlippedVertically   | Tile.FlippedHorizontally;

const GRIDMAP_0 = 0; // actual 0
const GRIDMAP_90 = 22; // actual 22
const GRIDMAP_180 = 16 // actual 16
const GRIDMAP_270 = 10; // actual 10

export function gridmapRotToTilemapFlag(rot: number): number {
  switch(rot) {
    case GRIDMAP_90: return ROT_90;
    case GRIDMAP_180: return ROT_180;
    case GRIDMAP_270: return ROT_270;
  } 
  return GRIDMAP_0;
}
export function tilemapFlagToGridmapRot(flipped_h: boolean, flipped_v: boolean, flipped_d: boolean) {
    if(flipped_h && flipped_d)
      return GRIDMAP_90;
    if(flipped_v && flipped_d)
      return GRIDMAP_180;
    if(flipped_h && flipped_v)
      return GRIDMAP_270;
    return GRIDMAP_0;
}