import { defineComponent, watch } from "vue";
import { Camera, GridHelper, Object3D, Scene, Vector3 } from "three";
import ThreeCanvas, { createCamera, createScene } from "../../common/three-canvas";
import { DBMap, DBMeshes } from "../../common/services/db";

import { loadDBModel } from "../../common/loader/db-model-loader";
import { disableMetalness } from "../../common/loader/model-utils";
import { GridMap, parseGridMapCellValues, injectGridMapProvider } from "../../common/services/provider-gridmap";
import { renderCollisionDataToNode } from "../../model-editor/canvas/render/collision";

function Basis(xx: number, xy: number, xz: number, yx: number, yy: number, yz: number, zx: number, zy: number, zz: number) {
  return { x: new Vector3(xx, xy, -xz), y: new Vector3(yx, yy, -yz), z: new Vector3(zx, zy, -zz) };
}

const ortho_bases = [
  Basis(1, 0, 0, 0, 1, 0, 0, 0, 1),
  Basis(0, -1, 0, 1, 0, 0, 0, 0, 1),
  Basis(-1, 0, 0, 0, -1, 0, 0, 0, 1),
  Basis(0, 1, 0, -1, 0, 0, 0, 0, 1),
  Basis(1, 0, 0, 0, 0, -1, 0, 1, 0),
  Basis(0, 0, 1, 1, 0, 0, 0, 1, 0),
  Basis(-1, 0, 0, 0, 0, 1, 0, 1, 0),
  Basis(0, 0, -1, -1, 0, 0, 0, 1, 0),
  Basis(1, 0, 0, 0, -1, 0, 0, 0, -1),
  Basis(0, 1, 0, 1, 0, 0, 0, 0, -1),
  Basis(-1, 0, 0, 0, 1, 0, 0, 0, -1),
  Basis(0, -1, 0, -1, 0, 0, 0, 0, -1),
  Basis(1, 0, 0, 0, 0, 1, 0, -1, 0),
  Basis(0, 0, -1, 1, 0, 0, 0, -1, 0),
  Basis(-1, 0, 0, 0, 0, -1, 0, -1, 0),
  Basis(0, 0, 1, -1, 0, 0, 0, -1, 0),
  Basis(0, 0, 1, 0, 1, 0, -1, 0, 0),
  Basis(0, -1, 0, 0, 0, 1, -1, 0, 0),
  Basis(0, 0, -1, 0, -1, 0, -1, 0, 0),
  Basis(0, 1, 0, 0, 0, -1, -1, 0, 0),
  Basis(0, 0, 1, 0, -1, 0, 1, 0, 0),
  Basis(0, 1, 0, 0, 0, 1, 1, 0, 0),
  Basis(0, 0, -1, 0, 1, 0, 1, 0, 0),
  Basis(0, -1, 0, 0, 0, -1, 1, 0, 0)
]

export namespace GridMapViewer {
  export interface Data {
    scene: () => Scene | null;
    root: Object3D;
  }
}


async function renderModel(data: GridMapViewer.Data, model: GridMap[], showCollision: boolean) {
  const scene = data.scene();
  const root = data.root;
  const maps = model.filter(x => x.mesh_db?.length);
  const mapNames = maps.map(x => `${x.file}\n${x.name}\n${x.mesh_db}`);
  if (scene && root) {
    for (let x of root.children) {
      x.removeFromParent();
    }
    for (const [index, value] of maps.entries()) {
      const mapName = mapNames[index];
      const node = new Object3D();
      root.add(node);
      node.name = mapName;
      const meshLib = (await DBMap.load(value.mesh_db!))!;
      const cells = parseGridMapCellValues(value.data);
      if (meshLib)
        for (const cell of cells) {
          const x = cell.item % meshLib.width;
          const y = Math.floor(cell.item / meshLib.height);
          const item = meshLib.data[`${y}-${x}`];
          if (item) {
            const model = (await loadDBModel(item))?.scene?.clone();
            if (model) {
              disableMetalness(model);
              model.scale.setScalar(value.cell_scale);
              const ortho = ortho_bases[cell.rot];
              model.up = ortho.y;
              model.lookAt(ortho.z);
              model.position.set(cell.x * value.cell_size[0], cell.y * value.cell_size[1], cell.z * value.cell_size[2]);
              node.add(model);
            }
            if (model && showCollision) {
              const collisionData = await DBMeshes.loadCollisionData(item);
              const collision = new Object3D();
              renderCollisionDataToNode(collision, collisionData?.collision || null);
              model.add(collision);
            }
          }
        }
    }
  }
}


export default defineComponent({
  props: {
    showCollision: Boolean
  },
  setup(props) {
    const { maps } = injectGridMapProvider()!;
    const accessorScene = createScene();
    const accessorCamera = createCamera();

    const data: GridMapViewer.Data = {
      scene() { return accessorScene.scene.value },
      root: new Object3D()
    }

    watch([maps, accessorScene.scene, () => props.showCollision], ([maps, newScene, showCollision]) => {
      if (newScene) {
        if (!data.root?.parent) {
          newScene.add(data.root);
          const gridHelper = new GridHelper();
          gridHelper.position.x = 0.5;
          gridHelper.position.z = 0.5;
          newScene.add(gridHelper);
        }
        renderModel(data, maps, showCollision);
      }
    })

    return { ...accessorScene, ...accessorCamera, maps };
  },
  render() {
    return <div class="active-model">
      <h2>{!!(this.maps?.length) ? this.maps[0].file : 'No GridMap Loaded'}</h2>
      <div class="canvas-container">
        <ThreeCanvas initialZoom={1.5}
          onCamera={(c: Camera) => { this.setCamera(c); c.position.z = -4; c.position.y = 3; }}
          onScene={(s: Scene) => this.setScene(s)} ></ThreeCanvas>
      </div>
    </div>
  }
});