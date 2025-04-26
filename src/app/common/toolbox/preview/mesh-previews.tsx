import { defineComponent, ref } from "vue";
import { injectActiveModel } from "../../services/provider-active-model";

import './mesh-preview.scss';
import { renderPreviewImage, renderVariant } from "../../util/render-preview";

export default defineComponent({
  props: {
    mesh: String,
    variant: String,
    inUse: Boolean
  },
  methods: {
    async update(meshId: string | undefined, variantId: string | undefined) {
      const canvas: HTMLCanvasElement = this.$el;
      const ctx = canvas.getContext('2d')!;
      await renderPreviewImage(meshId, ctx, [0,0,48,48]);
      renderVariant(variantId||null, ctx, [0,0,48,48]);
    },
    getKey() {
      return (this.mesh||'') + (this.variant ? `:${this.variant}`: '')
    }
  },
  data() {
    const isDragging = ref(false);
    function startDrag() {
      isDragging.value = true;
    }
    function stopDrag() {
      isDragging.value = false;
    }
    return {
      isDragging, startDrag, stopDrag
    }
  },
  watch: {
    mesh(cur: string) {
      this.update(cur, this.variant);
    },
    variant(cur: string) {
      this.update(this.mesh, cur);
    }
  },
  mounted() {
    this.update(this.mesh, this.variant);
  },
  render() {
    const { activeModel } = injectActiveModel()!;
    return <canvas width="48" height="48" draggable="true" onDragstart={(evt) => {
      if (evt.dataTransfer) {
        evt.dataTransfer.setData('model-key', this.getKey())
        evt.dataTransfer.setData('parent-key', this.$el?.parentElement?.dataset['slot'] || '')
        evt.dataTransfer.dropEffect = 'move';
      }
      this.startDrag();
    }}
      class={{ 'mesh-preview': true, activeModel: this.getKey() == activeModel.value, dragging: this.isDragging, inUse: this.inUse }}
      onDragend={() => this.stopDrag()}
      onClick={() => activeModel.value = this.getKey() == activeModel.value ? null : this.getKey() || null}></canvas>
  }
});