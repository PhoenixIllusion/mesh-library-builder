import { defineComponent } from "vue";

import type { MenuItem } from "primevue/menuitem";

import { injectDBProvider } from "../services/provider-db";
import { traverseDirectory } from "../util/dir-traverse";
import { DBMeshes } from "../services/db";

import { PrimeIcons } from '@primevue/core';
import { traverseZip } from "../util/zip-traverse";
import { Menubar } from "primevue";

function getMenuItems(): MenuItem[] {
  const { selectDir } = injectDBProvider()!;

  async function addNewDir() {
    const getDir = await window.showDirectoryPicker({ id: "load-mesh-library-dir" });
    if (getDir) {
      await traverseDirectory(getDir);
      const dirs = await DBMeshes.getDirectories();
      if (dirs.includes(getDir.name)) {
        selectDir(getDir.name);
      }
    }
  }

  async function addZipFile() {
    const getFile = await window.showOpenFilePicker({
      types: [{ accept: { 'application/zip': ['.zip'] } }],
      multiple: false,
      id: "load-mesh-library-zip-file"
    });
    if (getFile?.length) {
      const fileHandle = getFile[0];
      if (fileHandle.kind == 'file') {
        const handle = fileHandle as FileSystemFileHandle;
        await handle.requestPermission({ mode: 'read' })
        traverseZip(await handle.getFile());
        const dirs = await DBMeshes.getDirectories();
        if (dirs.includes(handle.name)) {
          selectDir(handle.name);
        }
      }
    }
  }

  return [
    { label: 'Add Dir', icon: PrimeIcons.FOLDER_OPEN, command: addNewDir },
    { label: 'Add Zip', icon: PrimeIcons.PLUS_CIRCLE, command: addZipFile }
  ]
}

export default defineComponent({
  render() {
    return <Menubar model={getMenuItems()} />
  }
});