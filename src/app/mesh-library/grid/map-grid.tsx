import { defineComponent, VNode } from "vue";

import { injectDBProvider } from "../../common/services/provider-db";
import { MapEntry } from "../../common/services/db";
import MeshPreview from '../../common/toolbox/preview/mesh-previews';

import './map-grid.scss';

export default defineComponent({
  methods: {
    onDragOver(evt: Event) {
      evt.preventDefault();
      //debugger;
    },
    onDrop(saveMap: (map: MapEntry) => void, map: MapEntry, evt: DragEvent, key: number) {
      evt.preventDefault();
      const model: string | undefined = evt.dataTransfer?.getData('model-key');
      const parentKey = parseInt(evt.dataTransfer?.getData('parent-key') || '-1', 10);
      if (model?.length) {
        map.data[key] = model;
        if (parentKey >= 0) {
          map.data[parentKey] = undefined;
        }
        saveMap(map);
      }
    }
  },
  render() {
    const { map, saveMap } = injectDBProvider()!;
    const cells: VNode[] = [];
    let width = 0;
    let height = 0;
    if (map.data.value) {
      const mapData = map.data.value;
      width = mapData.width;
      height = mapData.height;
      let idx = 0;
      for (let x = 0; x < mapData.width; x++)
        for (let y = 0; y < mapData.height; y++) {
          const key = idx++;
          const model = mapData.data[key];
          cells.push(
            <div class="cell" data-slot={key} onDragover={(evt) => this.onDragOver(evt)} onDrop={(evt) => this.onDrop(saveMap, mapData, evt, key)}>
              {model ? <MeshPreview mesh={model}></MeshPreview> : null}
            </div>
          );
        }
    }
    return <>
      <div class="map-grid" style={{ '--grid-width': width, '--grid-height': height }}>
        {cells}
      </div></>
      ;
  }
});