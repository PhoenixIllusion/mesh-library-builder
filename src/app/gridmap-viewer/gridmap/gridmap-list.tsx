import { Card, Fieldset, Select } from "primevue";
import { defineComponent } from "vue";
import { F12, GridMap, injectGridMapProvider } from "../../common/services/provider-gridmap";
import { injectDBProvider } from "../../common/services/provider-db";

declare module 'primevue' {
  interface SelectProps {
    'onUpdate:modelValue': (value: string) => void;
  }
}
import './gridmap-list.scss';

function transformMatrix(m: F12) {
  return <table class="transform">
    <tr><td>{m[0]}</td><td>{m[3]}</td><td>{m[6]}</td><td>{m[9]}</td></tr>
    <tr><td>{m[1]}</td><td>{m[4]}</td><td>{m[7]}</td><td>{m[10]}</td></tr>
    <tr><td>{m[2]}</td><td>{m[5]}</td><td>{m[8]}</td><td>{m[11]}</td></tr>
  </table>
}

export default defineComponent({
  setup() {
    const gridmap = injectGridMapProvider()!;
    const { mapList, loadMapList } = injectDBProvider()!;
    loadMapList();
    return {
      gridmap, mapList: mapList.data
    }
  },
  render() {
    const maps = this.gridmap.maps.value;
    if (!(maps?.length)) {
      return <></>
    }

    const updateUseLibrary = (map: GridMap, lib: string) => {
      map.mesh_db = lib;
      this.gridmap.save();
    }

    const file = maps[0].file;
    return <Card>{{
      title: () => file,
      content: () => maps.map(map => {
        const selectMeshLib = this.mapList ? <div>
          <label>Use Library</label>
          <Select modelValue={map.mesh_db} options={this.mapList} optionLabel={'name'} optionValue={'guid'} onUpdate:modelValue={(val: string) => updateUseLibrary(map, val)}></Select>
        </div> : <></>;

        return <Fieldset class={"gridmap"} legend={map.name}>
          <div><label>Mesh Library: </label>{map.mesh_library}</div>
          <div><label>Cell Size: </label>{map.cell_size.map(x => x.toFixed(1)).join(', ')}</div>
          <div><label>Cell Scale: </label>{map.cell_scale.toFixed(1)}</div>
          <div><label>Transform: </label>{transformMatrix(map.transform)}</div>
          {selectMeshLib}
        </Fieldset>
      })
    }}</Card>
  }
});