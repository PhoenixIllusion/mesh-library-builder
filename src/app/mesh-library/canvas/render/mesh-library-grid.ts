import { Scene, Object3D, GridHelper } from "three";
import { GridCanvas } from "../grid-canvas";
import { loadDBModel } from "../../../common/loader/db-model-loader";
import { disableMetalness } from "../../../common/loader/model-utils";
import { DBMeshes, MapEntry } from "../../../common/services/db";


function initGrid(context: GridCanvas.Data, width: number, height: number) {
  let { gridHelper, gridItems } = context
  const scene = context.scene() as Scene;
  gridItems.forEach(k => {
    k?.removeFromParent();
  });
  gridItems.length = 0;
  let idx = 0;
  for (let y = 0; y < height; y++)
  for (let x = 0; x < width; x++) {
        const obj = new Object3D();
        obj.position.x = (width - x - width / 2.0)
        obj.position.z = (height - y - height / 2.0)
        obj.name = `slot-${idx}`;
        scene?.add(obj);
        gridItems[idx++] = obj;
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

async function updateModelGrid(context: GridCanvas.Data, map: MapEntry) {
  const { gridItems } = context;

  gridItems.forEach(async (cell, index) => {
    let item = map.data[index++];
    if (item?.length) {
      item = item.replace(/\.png/, '');
      const newEle = (await loadDBModel(item))?.scene?.clone();
      const dbData = await DBMeshes.getMeshByName(item);
      if (newEle) {
        if(dbData) {
          const offset = dbData.offset||[0,0,0];
          newEle.position.set(... offset);
        }
        disableMetalness(newEle);
        cell.add(newEle);
      }
    }
  });
}

export function updateMeshLibraryGrid(context: GridCanvas.Data, map: MapEntry) {
  initGrid(context, map.width, map.height);
  updateModelGrid(context, map);
}