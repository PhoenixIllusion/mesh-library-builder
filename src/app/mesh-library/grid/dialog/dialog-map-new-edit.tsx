import { Ref, ref } from "vue";
import { DBProvider, injectDBProvider } from "../../../common/services/provider-db";
import { MapMenu } from "../map-menu-bar";
import { Dialog, InputText, InputNumber, Button } from "primevue";

declare module 'primevue' {
  interface InputTextProps {
    'onUpdate:modelValue': (value: string)=>void;
  }
  interface InputNumberProps {
    'onUpdate:modelValue': (value: number)=>void;
  }
}


function getBool(v: Ref<boolean,boolean>|boolean): boolean {
  return (typeof v == 'boolean') ? v : v.value;
}


function editMap(db: DBProvider, isEdit: boolean, name: string, width: number, height: number) {
  const { map, newMap, editMap } = db;
  const _curMap = map?.data?.value;
  if(isEdit && _curMap) {
    editMap(_curMap, name, width, height);
  } else {
    newMap(name, width, height);
  }
}

export function newMapDialog(context: MapMenu.Data) {
  const db: DBProvider = injectDBProvider()!;
  const { map } = db;
  const _curMap = map?.data?.value;
  const isEdit = getBool(context.editMap.ref);
  const obj = (_curMap && isEdit) ? {
    name: ref(_curMap.name),
    width: ref(_curMap.width),
    height: ref(_curMap.height)
  } : {
    name: ref('New Map'),
    width: ref(10),
    height: ref(10)
  }

  return <Dialog v-model:visible={context.newEditVisible} modal header="Map" style={{ width: '25rem' }}>
    <div class="flex items-center gap-4 mb-4">
      <label for="map-name" class="font-semibold w-24">Name</label>
      <InputText id="map-name"
        modelValue={obj.name.value}
        onUpdate:modelValue={(value: string) => obj.name.value = value}
        class="flex-auto"/>
    </div>
    <div class="flex items-center gap-4 mb-4">
        <label for="map-width" class="font-semibold w-24">Width</label>
        <InputNumber inputId="map-width"
          modelValue={obj.width.value}
          onUpdate:modelValue={(value: number) => obj.width.value = value}
          class="flex-auto"/>
    </div>
    <div class="flex items-center gap-4 mb-8">
        <label for="map-height" class="font-semibold w-24">Height</label>
        <InputNumber inputId="map-height"
          modelValue={obj.height.value}
          onUpdate:modelValue={(value: number) => obj.height.value = value}
          class="flex-auto" />
    </div>
    <div class="flex justify-end gap-2">
        <Button type="button" label="Cancel" severity="secondary" onClick={(_) => context.newMap.hide()}></Button>
        <Button type="button" label={isEdit ? "Save" : "New"} onClick={(_) => {
          editMap(db, isEdit, obj.name.value, obj.width.value, obj.height.value);
          (context.newEditVisible as boolean) = false;
        }}></Button>
    </div>
</Dialog>
}