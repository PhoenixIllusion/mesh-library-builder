import { Menubar } from "primevue";
import type { MenuItem } from "primevue/menuitem";
import { defineComponent, watch } from "vue";
import { injectDBProvider } from "../../../common/services/provider-db";
import { injectActiveModel } from "../../../common/services/provider-active-model";
import { getMaterials } from "../../../common/loader/db-model-loader";
import { VariantEntry } from "../../../common/services/db";
import { traverseTextureDirectory } from "../../../common/util/dir-traverse";

export default defineComponent({
  setup() {
    const activeModel = injectActiveModel()!;
    const { variants } = injectDBProvider()!;
    watch(activeModel.activeModel, (a) => {
      variants.loadList(a);
      variants.select(null);
    })
    return { activeModel, variants }
  },
  render() {
    const model = this.activeModel.activeModel.value;
    const variant = this.variants.active;

    const newModelVariant = async (modelId: string) => {
      const materials = await getMaterials(modelId);
      this.variants.new(modelId, { materials })
      this.variants.loadList(modelId);
    }

    const deleteModelVariant = async (v: VariantEntry) => {
      this.variants.delete(v)
      this.variants.loadList(v.mesh);
    }

    const loadTextureDirectory = async () => {
      const getDir = await window.showDirectoryPicker({ id: "load-texture-library-dir" });
      if (getDir) {
        await traverseTextureDirectory(getDir);
      }
    }

    const getMenuItems = (): MenuItem[] => {
      return [
        { label: 'New', command: () => { model && newModelVariant(model) }, disabled: !model },
        { label: 'Delete', command: () => { variant.value && deleteModelVariant(variant.value) }, disabled: !variant.value },
        { label: 'Load Texture Dir', command: () => { loadTextureDirectory(); }}
      ]
    }
    return  <Menubar model={getMenuItems()} />
  }
});