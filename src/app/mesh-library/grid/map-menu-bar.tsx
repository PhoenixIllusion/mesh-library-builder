import type { MenuItem } from "primevue/menuitem";
import { computed, ComputedRef, defineComponent } from "vue";
import { makeVisibility, ModalVisibility } from "../../common/dialog/visibility";
import { injectDBProvider, Pending, PendingV } from "../../common/services/provider-db";
import { loadMapDialog } from "./dialog/dialog-map-load";
import { newMapDialog } from "./dialog/dialog-map-new-edit";

import { PrimeIcons } from '@primevue/core';
import { MapEntry } from "../../common/services/db";
import { writeMeshLibrary } from "../../common/loader/gltf-omi-physics";
import { Menubar } from "primevue";
import { useEventBus, UseEventBusReturn } from "@vueuse/core";
import { downloadFile } from "../../common/util/download-file";
import { createTsxImage, createTsxFileXML } from "../../common/tiled/tmx-encoder";

declare module '@primevue/core' {
  interface PrimeIconsOptions {
    readonly FILE_PLUS: string;
  }
}

export type MeshLibMenuSignal = 'export_tmx';
export type MenuLibMenuBus = UseEventBusReturn<"export_tmx", string | null>;
const EVENT_BUS_MESH_LIB_MENU = Symbol("EVENT_BUS_MESH_LIB_MENU");
export const useMeshLibMenuBus = () => useEventBus<MeshLibMenuSignal, string | null>(EVENT_BUS_MESH_LIB_MENU);


async function exportMap(map: PendingV<MapEntry>) {
  const map_id = map.data!.guid;
  const data = await writeMeshLibrary(map_id);
  if (data) {
    const array = data as ArrayBuffer;
    downloadFile(map.data!.name + '.glb', array)
  }
}
async function exporTSXImage(map: PendingV<MapEntry>) {
  const entry = map?.data;
  if (entry) {
    const img = await createTsxImage(entry);
    if (img.data) {
      downloadFile(img.name, img.data);
    }
  }
}
function exporTSX(map: PendingV<MapEntry>) {
  const entry = map?.data;
  if (entry) {
    const xml = createTsxFileXML(entry);
    if (xml.data) {
      downloadFile(xml.name, xml.data);
    }
  }
}

function getMenuItems(context: MapMenu.Data): MenuItem[] {
  const { loadMapList } = injectDBProvider()!;
  return [
    { label: 'New', icon: PrimeIcons.FILE_PLUS, command: () => { context.newMap.show() } },
    { label: 'Edit', icon: PrimeIcons.CLOUD_DOWNLOAD, command: () => { context.editMap.show() }, disabled: context.map.data == null },
    { label: 'Load', icon: PrimeIcons.CLOUD_UPLOAD, command: () => { loadMapList(); context.loadMap.show() } },
    {
      label: 'Export', icon: PrimeIcons.DOWNLOAD,
      items: [
        { label: 'GLTF MeshLib', command: () => { exportMap(context.map as PendingV<MapEntry>) }, disabled: context.map.data == null },
        { label: 'Tiled PNG', command: () => exporTSXImage(context.map as PendingV<MapEntry>), disabled: context.map.data == null },
        { label: 'Tiled TMX', command: () => exporTSX(context.map as PendingV<MapEntry>), disabled: context.map.data == null }
      ]
    }
  ]
}

export namespace MapMenu {
  export interface Data {
    newEditVisible: ComputedRef<boolean> | boolean,
    newMap: ModalVisibility;
    editMap: ModalVisibility;
    loadMap: ModalVisibility;
    map: Pending<MapEntry> | PendingV<MapEntry>;
  }
}
export default defineComponent({
  data(): MapMenu.Data {
    const { map } = injectDBProvider()!;
    const newMap = makeVisibility();
    const editMap = makeVisibility();
    const loadMap = makeVisibility();
    const newEditVisible = computed({ get: () => newMap.ref.value || editMap.ref.value, set: (_: boolean) => { editMap.hide(); newMap.hide() } });
    return {
      newMap, editMap, loadMap, newEditVisible, map
    }
  },
  render() {
    return <>
      <Menubar model={getMenuItems(this)} />
      {newMapDialog(this)}
      {loadMapDialog(this)}
    </>
      ;
  }
});