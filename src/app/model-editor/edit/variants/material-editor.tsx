import { defineComponent, PropType, ref, shallowRef, toRaw, watch } from "vue";
import { DBTexture, MaterialOverride, MaterialOverridePBR, MaterialOverrideTexture } from "../../../common/services/db";
import { Select } from "primevue";
import MaterialPreview from "./material-preview";

export default defineComponent({
  emits: {
    "update": (_: MaterialOverride) => true,
  },
  props: {
    material: Object as PropType<MaterialOverride>
  },
  setup() {
    const activeDir = ref<string|null>(null);
    const activePath = ref<string|null>(null);
    const textureDirectories = shallowRef<string[]|null>(null);
    const directoryContents = shallowRef<string[]|null>(null);

    DBTexture.getTextureDirectories().then(v => {
      textureDirectories.value = v;
    })

    function changeDirectory(dir: string) {
      DBTexture.getTexturesByDirectory(dir).then(res => {
        directoryContents.value = res.map(x => x.name);
      })
    }
    watch(activeDir, (dir) => {
      changeDirectory(dir||'');
    });

    function setDir(dir: string) {
      activeDir.value = dir;
    }
    function setPath(path: string) {
      activePath.value = path;
    }

    return { textureDirectories, activeDir, activePath, directoryContents, setDir, setPath }
  },
  mounted() {
    if(this.material && 'texture' in this.material) {
      const path = this.material.texture;
      DBTexture.getTextureByName(path).then(res => {
        if(res) {
          this.setDir(res.directory);
          this.setPath(res.name);
        }
      })
    }
  },
  render() {
    if(this.material) {
      if('texture' in this.material && this.textureDirectories) {
        return <>
          <Select options={this.textureDirectories} modelValue={this.activeDir} onUpdate:modelValue={val => this.setDir(val)}></Select>
          {
            this.directoryContents &&
            <Select options={this.directoryContents} modelValue={this.activePath} onUpdate:modelValue={val => {
              this.setPath(val);
              const obj = Object.assign({}, this.material as MaterialOverrideTexture);
              obj.texture = val;
              this.$emit('update', obj);
            }}>
            {{
              option: ({option}:{option: string})=>{
                const filename = option.replace(/^.*\//,'');
                const opt = Object.assign({}, this.material as MaterialOverrideTexture);
                opt.texture = option;
                return <><MaterialPreview material={opt}></MaterialPreview>: {filename}</>
              }
            }}
            </Select>
          }
        </>
      }
      if('color' in this.material) {
        const [r,g,b] = toRaw(this.material.color).map(x => (0|(x*255)).toString(16).padStart(2,'0'));
        return <input type='color' value={'#'+[r,g,b].join('')} onChange={(e:Event) => {
          const target = e.target as HTMLInputElement;
          if(target) {
            const [_,r,g,b] = /#(?<r>..)(?<g>..)(?<b>..)/.exec(target.value) || [];
            if(r && g && b) {
              const obj = Object.assign({}, this.material as MaterialOverridePBR)
              obj.color = [... [r,g,b].map(x => parseInt(x, 16)/255) as [number,number,number], 1]
              this.$emit('update', obj);
            }
          }
        }} />
      }
    }

    return <></>
  }
});