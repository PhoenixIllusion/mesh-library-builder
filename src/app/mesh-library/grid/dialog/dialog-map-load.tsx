
import { injectDBProvider } from "../../../common/services/provider-db";
import { ref } from "vue";
import { MapMenu } from "../../grid/map-menu-bar";
import { Dialog, ProgressSpinner, Listbox, Button } from "primevue";

export function loadMapDialog(context: MapMenu.Data) {
  const selected = ref<string|null>()
  const { mapList } = injectDBProvider()!;
  return <Dialog v-model:visible={context.loadMap.ref} modal header="Load Map" style={{ width: '25rem' }}>
    { 
    mapList.list.loading.value ? <ProgressSpinner /> :
    <>
      <Listbox
          modelValue={selected.value}
          options={mapList.list.data.value!}
          optionLabel={"name"}
          optionValue={"id"}
          onUpdate:modelValue={(value: string) => selected.value = value}>
      </Listbox>
      <Button severity="secondary" label="Load" />
    </>
    }
  </Dialog>
}