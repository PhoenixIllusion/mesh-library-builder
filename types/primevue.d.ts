export * from 'primevue';

interface ModelValue<T> {
  'onUpdate:modelValue': (value: T)=>void;
}

declare module 'primevue' {
  interface TreeProps {
    'onUpdate:selectionKeys': (value: TreeSelectionKeys) => void;
  }
  interface TabsProps {
    'onUpdate:value': (value: string) => void;
  }
  interface CheckboxProps     extends ModelValue<boolean>{}
  interface SelectProps       extends ModelValue<string>{}
  interface ListboxProps      extends ModelValue<string>{}
  interface InputTextProps    extends ModelValue<string>{}
  interface InputNumberProps  extends ModelValue<number>{}
  interface DataTableProps {
    'onUpdate:selection'?: (v: VariantEntry)=>void;
    'onUpdate:editingRows'?: (value: T[] | DataTableEditingRows)=>void;
    'onUpdate:expandedRows'?: (value: T[] | DataTableExpandedRows)=>void;
    onRowEditSave?: (scope:DataTableRowEditSaveEvent)=>void;
    onCellEditComplete?: (scope: DataTableCellEditCompleteEvent)=>void;
  }
}
