import { App, inject, shallowRef, ShallowRef, toRaw, watch } from "vue";
import { TscnReader } from "../util/tscn-reader";
import { Block, PropFunction, PropVal } from "../util/tscn-reader/parser";

const __symb = Symbol('GridMapProvider');

type F3 = [number, number, number];
export type F12 = [number, number, number, number,
  number, number, number, number,
  number, number, number, number];
export interface GridMap {
  file: string;
  name: string;
  cell_size: F3;
  cell_scale: number;
  transform: F12;
  mesh_library: string;
  mesh_db: string | null;
  data: Uint32Array;
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
type IndexKeyCell = IndexKey & Cell;

export function parseGridMapCellValues(vals: Uint32Array) {
  const res: IndexKeyCell[] = [];
  const dv = new DataView(vals.buffer);
  for (let i = 0; i < vals.length; i += 3) {
    const offset = i * 4;
    const x = dv.getInt16(offset, true);
    const y = dv.getInt16(offset + 2, true);
    const z = dv.getInt16(offset + 4, true);
    const item = dv.getUint16(offset + 8, true);
    const rot_layer = dv.getUint16(offset + 10, true);
    const rot = rot_layer & 0x1F;
    const layer = rot_layer >> 5;
    res.push({ x, y, z, item, rot, layer })
  }
  return res;
}

type MapsShallowRef = ShallowRef<GridMap[]>;
export interface GridMapProvider {
  import(): Promise<void>;
  export(): Promise<void>;
  save(): void;
  maps: MapsShallowRef;
}

async function exportGridMap(_maps: MapsShallowRef) {

}

function propsToObject(block: Block): Record<string, PropVal> {
  const ret: Record<string, PropVal> = {};
  block.props.forEach(([k, v]) => {
    ret[k] = v;
  })
  return ret;
}

function getBlocksWithAttribute(blocks: Block[], attr: string, val: string): Block[] {
  return blocks.filter(x => x.block.attr.find(([a, v]) => attr == a && v == val));
}
function getBlockAttribute(block: Block, attr: string): string | null {
  const a = block.block.attr.find(([a]) => attr == a);
  return a ? a[1] : null;
}
function isPropObject(val: PropVal | undefined): val is Record<string, PropVal> {
  if (val && typeof val == 'object') return true;
  return false;
}
function isPropFunction(val: PropVal | undefined): val is PropFunction {
  if (val && typeof val == 'object' && ('method' in val)) return true;
  return false;
}

function asTransform3D(val: PropVal | undefined): F12 | undefined {
  if (isPropFunction(val) && val.method == 'Transform3D') {
    return val.args as F12;
  }
  return undefined;
}
function asVector3(val: PropVal | undefined): F3 | undefined {
  if (isPropFunction(val) && val.method == 'Vector3') {
    return val.args as F3;
  }
  return undefined;
}
function asNumber(val: PropVal | undefined): number | undefined {
  if (val && typeof val == 'number') {
    return val;
  }
  return undefined;
}

async function importGridMap(maps: MapsShallowRef) {
  const getFile = await window.showOpenFilePicker({
    types: [{ accept: { 'application/text': ['.tscn'] } }],
    multiple: false,
    id: "load-mesh-library-gridmap-file"
  });
  if (getFile?.length) {
    const fileHandle = getFile[0];
    if (fileHandle.kind == 'file') {
      const handle = fileHandle as FileSystemFileHandle;
      await handle.requestPermission({ mode: 'read' })
      const text = await (await handle.getFile()).text();
      try {

        const result: GridMap[] = [];
        const parsed = TscnReader.parse(text);
        const gridMaps = getBlocksWithAttribute(parsed, 'type', '"GridMap"');

        if (gridMaps.length == 0) {
          alert("No GridMaps Found in TSCN File");
        } else {
          gridMaps.forEach(map => {
            let mesh_library = 'unknown';
            const gridName = getBlockAttribute(map, 'name') || 'unknown';
            let data: Uint32Array | null = null;
            const props = propsToObject(map);
            const mesh_library_prop = props['mesh_library'];
            if (isPropFunction(mesh_library_prop)) {
              const { method, args } = <PropFunction>mesh_library_prop;
              if (method == 'ExtResource') {
                const ext_res = getBlocksWithAttribute(parsed, 'id', `"${args[0]}"`);
                if (ext_res[0]) {
                  mesh_library = getBlockAttribute(ext_res[0], 'path') || 'Not Found';
                  mesh_library = mesh_library.substring(1, mesh_library.length - 1);
                }
              }
            }
            const data_prop = props['data'];
            if (isPropObject(data_prop)) {
              const cells = data_prop['cells'];
              if (isPropFunction(cells) && cells.method == 'PackedInt32Array') {
                data = new Uint32Array(cells.args);
              } else {
                alert('Found GridMap, but Data is not in PackedInt32 format')
              }
            }
            const filename = fileHandle.name;
            const cell_size = asVector3(props['cell_size']) || [1, 1, 1];
            const cell_scale = asNumber(props['cell_scale']) || 1;
            const transform = asTransform3D(props['transform']) || [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]
            if (data) {
              const gridMap: GridMap = {
                file: filename,
                name: gridName,
                mesh_library,
                data,
                cell_scale,
                cell_size,
                transform,
                mesh_db: null
              }
              result.push(gridMap);
            }
          });
          maps.value = result;
        }
      } catch { }
    }
  }
}

function createGridMapProvider(): GridMapProvider {
  const maps = shallowRef(history.state as GridMap[] || [] as GridMap[]);
  watch(maps, (value, _oldValue) => {
    const raw = toRaw(value);
    history.replaceState(raw, '');
  })
  return {
    import: () => importGridMap(maps),
    export: () => exportGridMap(maps),
    save: () => { maps.value = [...maps.value] },
    maps
  }
}

export function provideGridMapProvider(app: App<Element>) {
  app.provide(__symb, createGridMapProvider())
}

export function injectGridMapProvider(): GridMapProvider | undefined {
  return inject<GridMapProvider>(__symb)
}