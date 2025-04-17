import { Ref, ref } from "vue";

export interface ModalVisibility {
  ref: Ref<boolean, boolean> | boolean;
  show(): void;
  hide(): void;
}

export function makeVisibility() {
  const val = ref(false);
  return {
    ref: val, show: () => { val.value = true }, hide: () => { val.value = false }
  }
}
