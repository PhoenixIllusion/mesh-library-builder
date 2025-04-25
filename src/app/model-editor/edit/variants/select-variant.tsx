import { Column, DataTable, DataTableCellEditCompleteEvent, DataTableEditingRows, DataTableExpandedRows, DataTableRowEditSaveEvent, InputText } from "primevue";
import { defineComponent, ref, toRaw } from "vue";
import { injectDBProvider } from "../../../common/services/provider-db";
import { MaterialOverride, VariantEntry } from "../../../common/services/db";
import MaterialPreview from "./material-preview";
import MaterialEditor from "./material-editor";

export default defineComponent({
  setup() {
    const { variants } = injectDBProvider()!;

    const expandedRows = ref<DataTableExpandedRows>({});
    const setExpandedRows = (rows: DataTableExpandedRows) => expandedRows.value = rows;

    const editingRows = ref<any[]>([]);
    const setEditingRows = (rows: any[]) => editingRows.value = rows;

    return { variants, expandedRows, setExpandedRows, editingRows, setEditingRows };
  },
  render() {
    const variants = this.variants.list.data.value;

    const updateVariant = (evt: { newData: VariantEntry, index: number}) => {
      const data = Object.assign({},evt.newData as VariantEntry);
      data.materials = toRaw(data.materials);
      this.variants.update(data);
      this.variants.list.data?.value && (this.variants.list.data.value[evt.index] = data);
    }

    return <DataTable selectionMode="single" selection={this.variants.active.value} onUpdate:selection={(v: VariantEntry) => this.variants.select(v)} expandedRows={this.expandedRows}
      onCellEditComplete={updateVariant}
      editMode="cell" dataKey={"id"} onUpdate:expandedRows={(v) => this.setExpandedRows(v)} value={variants}>
      {{
        default: () => <>
            <Column expander style="width: 5rem" />
            <Column field="name" header="Name">{{
              body: ({data}: {data: MaterialOverride}) => <>{data.name}</>,
              editor: ({data}: {data: MaterialOverride}) => <InputText id="map-name"
                              modelValue={data.name}
                              onUpdate:modelValue={(value: string) => data.name = value}
                              class="flex-auto"/>
            }}</Column>
          </>
        ,
        expansion: ({data, index}: { data: VariantEntry, index: number}) => <>
          Materials: 
          <DataTable editMode="row" value={data.materials} dataKey={'name'}
            editingRows={this.editingRows}
            onUpdate:editingRows={this.setEditingRows} onRowEditSave={(scope:DataTableRowEditSaveEvent) => {
              data.materials[scope.index] = toRaw(scope.newData);
              updateVariant({newData: data, index});
            }}>
                  <Column field="name"></Column>
                  <Column>{{
                    body: ({data}: {data: MaterialOverride}) => <MaterialPreview material={data}></MaterialPreview>,
                    editor: (scope: {data: MaterialOverride, index: number}) => 
                      <MaterialEditor material={scope.data} onUpdate={evt => {
                        if('texture' in scope.data && 'texture' in evt) scope.data.texture = evt.texture;
                        if('color' in scope.data && 'color' in evt) scope.data.color = evt.color;
                      }}></MaterialEditor>
                  }}</Column>
                  <Column rowEditor></Column>
          </DataTable></>
      }}
    </DataTable>
  }
});