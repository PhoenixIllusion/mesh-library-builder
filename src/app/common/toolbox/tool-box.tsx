import { computed, defineComponent, ref, shallowRef, watch } from "vue";


import MeshPreview from './preview/mesh-previews';
import { injectDBProvider } from "../services/provider-db";

import './tool-box.scss';
import { Tabs, TabList, Tab, ProgressSpinner } from "primevue";
import { DBMeshes, DBVariants, MeshEntry, VariantEntry } from "../services/db";


declare module 'primevue' {
  interface TabsProps {
    'onUpdate:value': (value: string) => void;
  }
}

export default defineComponent({
  setup() {
    const { dir } = injectDBProvider()!;

    const meshes = shallowRef<MeshEntry[]>([]);
    const variants = shallowRef<VariantEntry[]>([]);
    watch(dir.active, (newV) => {
      DBVariants.getByDirectory(newV).then(res => {
        variants.value = res;
      })
      if(newV)
      DBMeshes.getDirectory(newV).then(res => {
        meshes.value = res;
      })
    })

    const dirContent = computed(() => {
      const dirContent: [MeshEntry, VariantEntry|null][] = [];
      (meshes.value || []).forEach(m => {
        dirContent!.push([m, null])
        variants.value.filter(v => v.mesh == m.name).forEach(v => {
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