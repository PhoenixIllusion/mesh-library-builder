import { GridHelper, Object3D } from "three";
import { Scene } from "three/src/scenes/Scene.js";

import { defineComponent, watch } from "vue";
import type { PropType } from 'vue'
import { MapEntry } from "../../common/services/db";
import { injectDBProvider } from "../../common/services/provider-db";

import ThreeCanvas, { createScene } from '../../common/three-canvas';
import { updateMeshLibraryGrid } from "./render/mesh-library-grid";

export namespace GridCanvas {
  export interface Data {
    scene: () => Scene | null;
    gridHelper: GridHelper | null;
    gridItems: Object3D[];
  }
}

export default defineComponent({
  props: {
    map: Object as PropType<MapEntry | null>
  },
  setup() {
    const { map } = injectDBProvider()!;
    const accessor = createScene();

    const data: GridCanvas.Data = {
      scene: () => accessor.scene.value,
      gridHelper: null,
      gridItems: []
    }
    watch([map.loaded.data, accessor.scene], ([newMap, newScene]) => {
      if (newMap && newScene) {
        updateMeshLibraryGrid(data, newMap);
      }
    })

    return { ...accessor };
  },
  render() {
    return <ThreeCanvas onScene={(s: Scene) => this.setScene(s)} ></ThreeCanvas>
  }
});