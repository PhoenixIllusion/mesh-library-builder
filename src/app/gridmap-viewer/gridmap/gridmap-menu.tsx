import { defineComponent } from "vue";

import type { MenuItem } from "primevue/menuitem";
import { PrimeIcons } from '@primevue/core';
import { Menubar } from "primevue";
import { GridMapProvider, injectGridMapProvider } from "../../common/services/provider-gridmap";

function getMenuItems(gridmap: GridMapProvider): MenuItem[] {
  return [
    { label: 'Import TSCN', icon: PrimeIcons.UPLOAD, command: gridmap.import },
    { label: 'Export', icon: PrimeIcons.DOWNLOAD, command: gridmap.export }
  ]
}

export default defineComponent({
  setup() {
    const gridmap = injectGridMapProvider()!;
    return {
      gridmap
    }
  },
  render() {
    return <Menubar model={getMenuItems(this.gridmap)} />
  }
});