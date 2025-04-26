import { computed, defineComponent, shallowRef, watch } from "vue";


import MeshPreview from './preview/mesh-previews';
import { injectDBProvider } from "../services/provider-db";

import './tool-box.scss';
import { Tabs, TabList, Tab, ProgressSpinner } from "primevue";
import { DBMeshes, DBVariants, MeshEntry, VariantEntry } from "../services/db";

export default defineComponent({
  setup() {
    const { dir, variants } = injectDBProvider()!;

    const meshList = shallowRef<MeshEntry[]>([]);
    const variantList = shallowRef<VariantEntry[]>([]);
    watch([dir.active, variants.active], ([newV]) => {
      DBVariants.getByDirectory(newV).then(res => {
        variantList.value = res;
      })
      if(newV) {
        meshList.value = [];
        DBMeshes.getDirectory(newV).then(res => {
          meshList.value = res;
        })
      }
    })

    const dirContent = computed(() => {
      const dirContent: [MeshEntry, VariantEntry|null][] = [];
      (meshList.value || []).forEach(m => {
        dirContent!.push([m, null])
        variantList.value.filter(v => v.mesh == m.name).forEach(v => {
          dirContent!.push([m, v])
        })
      })
      return dirContent;
    })


    return { dir, dirContent }
  },
  render() {
    const { map } = injectDBProvider()!;
    const inUseElements = Object.values(map.loaded?.data?.value?.data || {})
    const dirs = this.dir.list.data.value || [];


    return <div class="tool-box">
      <Tabs
        scrollable={true}
        onUpdate:value={(value: string) => this.dir.select(value)}
        value={this.dir.active.value || 0}>
        <TabList>
          {dirs.map(dir => <Tab key={dir} value={dir}>{dir}</Tab>)}
        </TabList>
      </Tabs>
      <div class="contents">
        {
          (!this.dir.loaded.loading) ? <ProgressSpinner /> :
            this.dirContent!.map(([ele,v]) => 
              <MeshPreview mesh={ele.name} variant={v?.id} inUse={inUseElements.includes(ele.name+(v ? `:${v.id}`: ''))}></MeshPreview>)
        }
      </div>
    </div>
  }
});