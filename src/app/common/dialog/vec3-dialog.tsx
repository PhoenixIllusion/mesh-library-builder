import { Button, Dialog, InputNumber } from "primevue";
import { ModalVisibility } from "./visibility";
import { ref } from "vue";

export function showVec3Dialog(visible: ModalVisibility, value: [number,number,number], onSave: (val: [number,number,number])=>void) {
    value = value || [0,0,0];
    const x = ref(value[0])
    const y = ref(value[1])
    const z = ref(value[2])
    return <Dialog v-model:visible={visible.ref} modal header="Edit Vector3" style={{ width: '25rem' }}>
      
    <div class="flex items-center gap-4 mb-8">
        <label for="vec3-X" class="font-semibold w-24">X</label>
        <InputNumber inputId="vec3-X"
          modelValue={x.value} minFractionDigits={3}
          onUpdate:modelValue={(value: number) => x.value = value}
          class="flex-auto" />
    </div>
    <div class="flex items-center gap-4 mb-8">
        <label for="vec3-Y" class="font-semibold w-24">Y</label>
        <InputNumber inputId="vec3-Y"
          modelValue={y.value} minFractionDigits={3}
          onUpdate:modelValue={(value: number) => y.value = value}
          class="flex-auto" />
    </div>
    <div class="flex items-center gap-4 mb-8">
        <label for="vec3-Z" class="font-semibold w-24">Z</label>
        <InputNumber inputId="vec3-Z"
          modelValue={z.value} minFractionDigits={3}
          onUpdate:modelValue={(value: number) => z.value = value}
          class="flex-auto" />
    </div>
    <div class="flex justify-end gap-2">
        <Button type="button" label="Cancel" severity="secondary" onClick={(_) => visible.hide()}></Button>
        <Button type="button" label="Save" onClick={(_) => {
          onSave([x.value, y.value, z.value])
          visible.hide();
        }}></Button>
    </div>
    </Dialog>
}