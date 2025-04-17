import { defineComponent, ref } from "vue";
import { injectActiveModel } from "../../services/provider-active-model";

import './mesh-preview.scss';
import { renderPreviewImage } from "../../util/render-preview";

export default defineComponent({
  props: {
    mesh: String,
    inUse: Boolean
  },
  methods: {
    update(cur: string | undefined) {
      const canvas: HTMLCanvasElement = this.$el;
      renderPreviewImage(cur, canvas);
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
    mesh(_: string, cur: string) {
      this.update(cur);
    }
  },
  mounted() {
    this.update(this.mesh);
  },
  render() {
    const { activeModel } = injectActiveModel()!;
    return <canvas width="48" height="48" draggable="true" onDragstart={(evt) => {
      if (evt.dataTransfer) {
        evt.dataTransfer.setData('model-key', this.mesh || '')
        evt.dataTransfer.setData('parent-key', this.$el?.parentElement?.dataset['slot'] || '')
        evt.dataTransfer.dropEffect = 'move';
      }
      this.startDrag();
    }}
      class={{ 'mesh-preview': true, activeModel: this.mesh == activeModel.value, dragging: this.isDragging, inUse: this.inUse }}
      onDragend={() => this.stopDrag()}
      onClick={() => activeModel.value = this.mesh == activeModel.value ? null : this.mesh || null}></canvas>
  }
});