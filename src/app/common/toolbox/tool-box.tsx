import { defineComponent } from "vue";


import MeshPreview from './preview/mesh-previews';
import { injectDBProvider } from "../services/provider-db";

import './tool-box.scss';
import { Tabs, TabList, Tab, ProgressSpinner } from "primevue";


declare module 'primevue' {
  interface TabsProps {
    'onUpdate:value': (value: string) => void;
  }
}

export default defineComponent({

  render() {
    const { map } = injectDBProvider()!;
    const inUseElements = Object.values(map.data?.value?.data || {})
    const { selectDir, activeDir, dirList, loadedDir } = injectDBProvider()!;
    const dirs = dirList.data.value || [];
    const dirContent = loadedDir.data.value;

    return <div class="tool-box">
      <Tabs
        scrollable={true}
        onUpdate:value={(value: string) => selectDir(value)}
        value={activeDir.value || 0}>
        <TabList>
          {dirs.map(dir => <Tab key={dir} value={dir}>{dir}</Tab>)}
        </TabList>
      </Tabs>
      <div class="contents">
        {
          (loadedDir.loading.value || !dirContent) ? <ProgressSpinner /> :
            dirContent!.map(ele => <MeshPreview mesh={ele.name} inUse={inUseElements.includes(ele.name)}></MeshPreview>)
        }
      </div>
    </div>
  }
});