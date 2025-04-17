import { Scene, Object3D, GridHelper } from "three";
import { GridCanvas } from "../grid-canvas";
import { loadDBModel } from "../../../common/loader/db-model-loader";
import { disableMetalness } from "../../../common/loader/model-utils";
import { MapEntry } from "../../../common/services/db";


function initGrid(context: GridCanvas.Data, width: number, height: number) {
  let { gridHelper, gridItems } = context
  const scene = context.scene() as Scene;
  const toRemove: string[] = [];
  for (let [k, _] of gridItems.entries()) {
    const [y, x] = k.split('-').map(s => parseInt(s, 10));
    if (y >= height || x >= width) {
      toRemove.push(k);
      return;
    }
  }
  toRemove.forEach(k => {
    const obj = gridItems.get(k);
    gridItems.delete(k);
    obj?.removeFromParent();
  })
  for (let x = 0; x < width; x++)
    for (let y = 0; y < height; y++) {
      const slot = `${y}-${x}`;
      if (!gridItems.has(slot)) {
        const obj = new Object3D();
        obj.position.x = (width - x - width / 2.0)
        obj.position.z = (height - y - height / 2.0)
        obj.name = slot;
        scene?.add(obj);
        gridItems.set(slot, obj);
      }
    }
  if (gridHelper != null) {
    scene?.remove(gridHelper as GridHelper);
    gridHelper.dispose();
  }
  const gridSize = Math.max(width, height);
  gridHelper = new GridHelper(gridSize);
  gridHelper.position.x = 0.5;
  gridHelper.position.z = 0.5;
  scene?.add(gridHelper);
  context.gridHelper = gridHelper;
}

function updateModelGrid(context: GridCanvas.Data, map: MapEntry) {
  const { gridItems } = context;
  Object.entries(map.data).forEach(async ([slot, item]) => {
    const entry = gridItems.get(slot);
    if (entry) {
      if (item.length) {
        item = item.replace(/\.png/, '');
        const newEle = (await loadDBModel(item))?.scene;
        if (newEle && entry.children[0]?.name != newEle.name) {
          disableMetalness(newEle);
          entry.remove(...entry.children);
          entry.add(newEle.clone());
        }
      } else {
        entry.remove(...entry.children)
      }
    }
  });
}

export function updateMeshLibraryGrid(context: GridCanvas.Data, map: MapEntry) {
  initGrid(context, map.width, map.height);
  updateModelGrid(context, map);
}