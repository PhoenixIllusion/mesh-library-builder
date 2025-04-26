import { Panel } from "primevue";
import { defineComponent } from "vue";
import VariantMenu from "./variant-menu";
import SelectVariant from "./select-variant";

export default defineComponent({
  render() {
    return <Panel header="Variants" toggleable collapsed={false}>
      <VariantMenu></VariantMenu>
      <SelectVariant></SelectVariant>
    </Panel>
  }
});