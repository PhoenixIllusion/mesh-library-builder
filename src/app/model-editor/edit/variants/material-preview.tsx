import { defineComponent, PropType } from "vue";
import { MaterialOverride } from "../../../common/services/db";
import { renderMaterialPreview } from "../../../common/util/render-preview";

export default defineComponent({
  props: {
    material: Object as PropType<MaterialOverride>
  },
  methods: {
    async update() {
      const el = this.$el as HTMLCanvasElement;
      const ctx = el.getContext('2d')!;
      renderMaterialPreview(this.material, ctx, [0, 0, 32, 32])
    }
  },
  watch: {
    material() {
      this.update();
    }
  },
  mounted() {
    this.update();
  },
  render() {
    return <canvas width={32} height={32}></canvas>
  }
});