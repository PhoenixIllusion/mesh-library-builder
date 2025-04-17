
import { TscnReader } from "../tscn-reader/index.mjs";
import type { Block, PropFunction, PropVal } from "../tscn-reader/parser.mjs";

type F3 = [number,number,number];
export type F12 = [number,number,number,number,
  number,number,number,number,
  number,number,number,number];
export interface GridMap {
  file: string;
  name: string;
  cell_size: F3;
  cell_scale: number;
  transform: F12;
  mesh_library: string;
  mesh_db: string | null;
  data: IndexKeyCell[];
}


interface IndexKey {
  x: number;
  y: number;
  z: number;
}
interface Cell {
  item: number;
  rot: number;
  layer: number;
}
export type IndexKeyCell = IndexKey & Cell;

export function parseGridMapCellValues(vals: Uint32Array) {
  const res: IndexKeyCell[] = [];
  const dv = new DataView(vals.buffer);
  for(let i=0;i<vals.length;i+=3) {
    const offset = i*4;
    const x = dv.getInt16(offset, true);
    const y = dv.getInt16(offset+2, true);
    const z = dv.getInt16(offset+4, true);
    const item = dv.getUint16(offset+8, true);
    const rot_layer = dv.getUint16(offset+10, true);
    const rot = rot_layer & 0x1F;
    const layer = rot_layer >> 5;
    res.push({x,y,z,item,rot,layer})
  }
  return res;
}
export function convertCellValues( values: IndexKeyCell[]): Uint32Array {
  const u32 = new Uint32Array(values.length * 3);
  const dv = new DataView(u32.buffer);
  for(let i=0;i<values.length;i++) {
    const offset = i*12;
    const v = values[i];
    dv.setInt16(offset, v.x, true);
    dv.setInt16(offset+2, v.y, true);
    dv.setInt16(offset+4, v.z, true);
    dv.setUint16(offset+8, v.item, true);
    const rot_layer = (v.rot & 0x1f) | (v.layer<<5)
    dv.setUint16(offset+10, rot_layer, true);
  }
  return u32;
}


function propsToObject(block: Block): Record<string,PropVal> {
  const ret: Record<string,PropVal> = {};
  block.props.forEach(([k,v]) => {
    ret[k] = v;
  })
  return ret;
}

function getBlocksWithAttribute(blocks: Block[], attr: string, val: string): Block[] {
 return blocks.filter(x => x.block.attr.find(([a,v])=> attr == a && v == val)); 
}
function getBlockAttribute(block: Block, attr: string): string | null {
  const a = block.block.attr.find(([a])=> attr == a);
  return a ? a[1]: null;
}
function isPropObject(val: PropVal | undefined): val is Record<string,PropVal> {
  if(val && typeof val == 'object') return true;
  return false;
}
function isPropFunction(val: PropVal | undefined): val is PropFunction {
  if(val && typeof val == 'object' && ('method' in val )) return true;
  return false;
}

function asTransform3D(val: PropVal | undefined): F12|undefined {
  if(isPropFunction(val) && val.method == 'Transform3D') {
    return val.args as F12;
  }
  return undefined;
}
function asVector3(val: PropVal | undefined): F3|undefined {
  if(isPropFunction(val) && val.method == 'Vector3') {
    return val.args as F3;
  }
  return undefined;
}
function asNumber(val: PropVal | undefined): number | undefined {
  if(val && typeof val == 'number') {
    return val;
  }
  return undefined;
}

export function parseGridMap(filename: string, text: string) {
  const result: GridMap[] = [];
  try {
    const parsed = TscnReader.parse(text);
    const gridMaps = getBlocksWithAttribute(parsed, 'type', '"GridMap"');

    if(gridMaps.length == 0) {
      alert("No GridMaps Found in TSCN File");
    } else {
      gridMaps.forEach(map => {
        let mesh_library = 'unknown';
        const gridName = getBlockAttribute(map, 'name')||'unknown';
        let data: Uint32Array|null = null;
        const props = propsToObject(map);
        const mesh_library_prop = props['mesh_library'];
        if(isPropFunction(mesh_library_prop)) {
          const {method, args} = mesh_library_prop as PropFunction;
          if(method == 'ExtResource') {
            const ext_res = getBlocksWithAttribute(parsed, 'id', `"${args[0]}"`);
            if(ext_res[0]) {
              mesh_library = getBlockAttribute(ext_res[0], 'path') || 'Not Found';
              mesh_library = mesh_library.substring(1, mesh_library.length-1);
            }
          }
        }
        const data_prop = props['data'];
        if(isPropObject(data_prop)) {
          const cells = data_prop['cells'];
          if(isPropFunction(cells) && cells.method == 'PackedInt32Array') {
            data = new Uint32Array(cells.args);
          } else {
            alert('Found GridMap, but Data is not in PackedInt32 format')
          }
        }

        const cell_size = asVector3(props['cell_size']) || [1,1,1];
        const cell_scale = asNumber(props['cell_scale']) || 1;
        const transform = asTransform3D(props['transform']) || [1,0,0, 0,1,0, 0,0,1, 0,0,0]
        if(data) {
          const gridMap: GridMap = {
            file: filename,
            name: gridName,
            mesh_library,
            data: parseGridMapCellValues(data),
            cell_scale,
            cell_size,
            transform,
            mesh_db: null
          } 
          result.push(gridMap);
        }
      });
    }
  } catch(e) {console.error(e)}
  return result;
}