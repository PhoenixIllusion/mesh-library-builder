import { Button } from "primevue";
import { defineComponent, ref, watch } from "vue";
import { injectActiveModel } from "../../common/services/provider-active-model";
import { DBMeshes } from "../../common/services/db";
import { showVec3Dialog } from "../../common/dialog/vec3-dialog";
import { makeVisibility } from "../../common/dialog/visibility";
import { invalidateDBModel } from "../../common/loader/db-model-loader";

export default defineComponent({
  setup() {
    const { activeModel } = injectActiveModel()!;

    const offset = ref<[number,number,number]>([0,0,0]);
    watch(activeModel, async (id: string|null) => {
      if(id) {
        DBMeshes.getMeshByName(id).then(mesh => {
          if(mesh) {
            offset.value = mesh.offset || [0,0,0]
          }
        })
      }
    });
    function editOffset(o: [number,number, number]) {
      const modelId = activeModel.value;
      if(modelId) {
        DBMeshes.getMeshByName(modelId).then(async model => {
          if(model) {
            model.offset = o;
            await DBMeshes.addMeshDirectory([model]);
            invalidateDBModel(modelId)
            activeModel.value = null;
            activeModel.value = modelId;
            offset.value = o;
          }
        })
      }
    }
    const showEditDialog = makeVisibility();
    return {
      activeModel, offset, showEditDialog, editOffset
    }
  },
  render() {
    const o = this.offset;
    if(!this.activeModel) {
      return <></>
    }
    return <>
    <Button label={"Offset: " + `[${o.join(', ')}]`} onClick={() => this.showEditDialog.show()}></Button>
    {showVec3Dialog(this.showEditDialog, this.offset, this.editOffset)}
    </>
  }
});