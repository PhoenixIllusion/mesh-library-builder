import { defineComponent, PropType, watch } from "vue";
import { injectActiveModel } from "../../common/services/provider-active-model";
import { BatchedMesh, BufferGeometry, Camera, GridHelper, Mesh, Object3D, Scene } from "three";
import ThreeCanvas, { createCamera, createScene } from "../../common/three-canvas";
import { DBMeshes, MapEntry } from "../../common/services/db";

import './active-model.scss';
import { loadDBModel } from "../../common/loader/db-model-loader";

import {
  computeBoundsTree, disposeBoundsTree,
  computeBatchedBoundsTree, disposeBatchedBoundsTree, acceleratedRaycast,
} from 'three-mesh-bvh';
import { useGenerateCollisionBus, useSelectCollisionNodeBus } from "../collision/collision-panel";
import { generateCollisionData, renderCollisionData, renderCollisionDataSelection } from "./render/collision";
import { injectDBProvider } from "../../common/services/provider-db";
import { disableMetalness } from "../../common/loader/model-utils";
import { ButtonGroup, Button } from "primevue";

// Add the extension functions
BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
Mesh.prototype.raycast = acceleratedRaycast;

BatchedMesh.prototype.computeBoundsTree = computeBatchedBoundsTree;
BatchedMesh.prototype.disposeBoundsTree = disposeBatchedBoundsTree;
BatchedMesh.prototype.raycast = acceleratedRaycast;


export namespace ActiveModel {
  export interface Data {
    scene: () => Scene | null;
    root: Object3D;
    obj: Object3D;
    collision: Object3D;
  }
}


async function renderModel(data: ActiveModel.Data, variantId: string|null, model: string | null) {
  if(data.scene() && !data.scene()?.getObjectByName('grid-helper')) {
    const grid = new GridHelper();
    grid.name = 'grid-helper';
    grid.position.set(0.5,0,0.5);
    data.scene()?.add(grid);
  }
  if(!data.root.parent) {
    data.scene()?.add(data.root);
  }
  const obj = [... (data.obj.children||[])]
  data.obj.remove(... obj);
  if (model) {
    const obj = await loadDBModel(model, variantId);
    if (obj?.scene) {
      DBMeshes.getMeshByName(model).then(db => {
        data.root.position.set(... db?.offset||[0,0,0])
      })
      const entry = obj.scene.clone();
      data.obj.add(entry);
      disableMetalness(entry);
    }
  }
}

function changeAxis(camera: Camera | null, axis: 'x' | 'y' | 'z') {
  if (camera) {
    const dist = camera.position.length()
    switch (axis) {
      case 'x': camera.position.set(dist, 0, 0); break;
      case 'y': camera.position.set(0, dist, 0); break;
      case 'z': camera.position.set(0, 0, dist); break;
    }
  }
}

export default defineComponent({
  props: {
    map: Object as PropType<MapEntry | null>
  },
  setup() {
    const { activeModel } = injectActiveModel()!;
    const { collision, variants } = injectDBProvider()!;
    const accessorScene = createScene();
    const accessorCamera = createCamera();

    const root = new Object3D();
    const collisionNode = new Object3D();
    const obj = new Object3D();
    root.add(collisionNode);  
    root.add(obj);  
    const data: ActiveModel.Data = {
      scene() { return accessorScene.scene.value },
      obj,
      collision: collisionNode, root
    }

    watch([activeModel, variants.active, accessorScene.scene], ([newModel, variant, newScene]) => {
      if (newScene) {
        renderModel(data, variant?.id||null, newModel);
      }
    })
    watch([accessorScene.scene, collision.loaded], ([newScene, newCollisionData]) => {
      if (newScene) {
        renderCollisionData(data, newCollisionData?.collision || null)
      }
    })

    const eventBus = useGenerateCollisionBus();
    const unsubscribeCollisionBus = eventBus.on((evt, payload) => {
      if (payload) {
        collision.save(payload, generateCollisionData(data, evt))
      } else {
        collision.loaded.value = null;
      }
    });
    const selectionBus = useSelectCollisionNodeBus();
    const unsubscribeSelectedNode = selectionBus.on((selected) => {
      renderCollisionDataSelection(data, selected)
    });

    return { ...accessorScene, ...accessorCamera, unsubscribeCollisionBus, unsubscribeSelectedNode, activeModel };
  },
  unmounted() {
    this.unsubscribeCollisionBus();
    this.unsubscribeSelectedNode();
  },
  render() {
    return <div class="active-model">
      <h2>{this.activeModel != null ? this.activeModel : 'No Model Selected'}</h2>
      <div class="canvas-container">
        <ThreeCanvas initialZoom={1.5}
          onCamera={(c: Camera) => this.setCamera(c)}
          onScene={(s: Scene) => this.setScene(s)} ></ThreeCanvas>
      </div>
      <ButtonGroup>
        <Button label="X" severity="danger" onClick={() => changeAxis(this.camera, 'x')} />
        <Button label="Y" severity="success" onClick={() => changeAxis(this.camera, 'y')} />
        <Button label="Z" severity="info" onClick={() => changeAxis(this.camera, 'z')} />
      </ButtonGroup>
    </div>
  }
});