import type { MenuItem } from "primevue/menuitem";
import type { TreeNode } from "primevue/treenode";
import { ComputedRef, defineComponent, ref, toRaw, watch } from "vue";
import { PrimeIcons } from '@primevue/core';
import { injectActiveModel } from "../../common/services/provider-active-model";
import { useClipboard, useEventBus, UseEventBusReturn } from '@vueuse/core'
import { injectDBProvider } from "../../common/services/provider-db";
import { CollisionNode, validateCollisionNodeRecursive } from "../../common/services/collision";
import type { TreeSelectionKeys } from "primevue/tree";
import { Tree, Menubar, Panel } from "primevue";

declare module '@primevue/core' {
  interface PrimeIconsOptions {
    readonly CLIPBOARD: string;
  }
}
declare module 'primevue' {
  interface TreeProps {
    'onUpdate:selectionKeys': (key: TreeSelectionKeys)=>void;
  }
}

export type GenerateCollisionSignal = 'BVH3' |'BVH6' | 'AABox' | 'Sphere' | 'Capsule' | 'ConvexHull' | 'TriMesh' | 'BestFit Box' | 'Clear';
type GenerateCollisionBus = UseEventBusReturn<GenerateCollisionSignal, string|null>;
const EVENT_BUS_GENERATE_COLLISION = Symbol("EVENT_BUS_GENERATE_COLLISION")
export const useGenerateCollisionBus = () => useEventBus<GenerateCollisionSignal, string|null>(EVENT_BUS_GENERATE_COLLISION);

const EVENT_BUS_SELECT_COLLISION_NODE = Symbol("EVENT_BUS_SELECT_COLLISION_NODE")
export const useSelectCollisionNodeBus = () => useEventBus<string|null>(EVENT_BUS_SELECT_COLLISION_NODE);

type CollisionMap = Map<string, [CollisionNode,CollisionNode[]]>

function convertCollisionNodes(node: CollisionNode, map: CollisionMap, parent: CollisionNode[], path: string = '0') {
  map.set(path, [node, parent]);
  const result: TreeNode = {
    label: node.type,
    key: path,
    selectable: true,
    icon: 'pi pi-fw pi-circle',
    children: []
  }
  node.children?.forEach((n, i) => {
    result.children![i] = convertCollisionNodes(n, map, node.children!, path+'.'+i)
  })
  return result;
}

function makeEmpty() {
  return { type: 'empty', position: [0,0,0], rotation: [0,0,0,1], extents: [0,0,0]} as CollisionNode;
}

function modifyNodes(key: string|null, topLevel: CollisionNode[], map: CollisionMap, action: 'add'|'remove'|'up'|'down') {
  if(!key && action == 'add') {
    topLevel.push(makeEmpty());
    return [...topLevel];
  }
  if(key) {
    const entry = map.get(key);
    if(entry) {
      const [node, parent] = entry;
      if(action == 'add') {
        (node.children = node.children||[]).push(makeEmpty());
        return [...topLevel];
      } else {
        const indexOf = parent.indexOf(node);
        if(action == 'remove') {
          parent.splice(indexOf,1);
        }
        function swap(idxA: number, idxB: number) {
          const a = parent[idxA];
          const b = parent[idxB];
          parent[idxA] = b;
          parent[idxB] = a;
        }
        if(action == 'up') {
          swap(indexOf, Math.max(0, indexOf-1))
        }
        if(action == 'down') {
          swap(indexOf, Math.min(parent.length-1, indexOf+1))
        }
      }
      return [...topLevel];
    }
  }
}

function validateCopyText(text: string|undefined): CollisionNode[]|null {
  if(text == '[]' || !text?.startsWith('[{')) {
    return null;
  }
  try {
    const nodes = JSON.parse(text) as CollisionNode[]
    if(!Array.isArray(nodes)) {
      return null;
    }
    for(let node of nodes) {
      if(!validateCollisionNodeRecursive(node)) {
        return null;
      }
    }
    return nodes;
  } catch {

  }
  return null
}

function copyPaste({ text, copy}: {text: ComputedRef<string>, copy: (s: string)=>Promise<void>} ,key: string|null, topLevel: CollisionNode[], map: CollisionMap, action: 'copy'|'paste'): CollisionNode[]|null  {
  const copiedNode = validateCopyText(text.value);
  if(key == null) {
    if(action == 'copy') {
      copy(JSON.stringify(topLevel));
    }
    if(action == 'paste' && copiedNode) {
      return copiedNode;
    }
  } else {
    if(key) {
      const entry = map.get(key);
      if(entry) {
        const [node, _] = entry;
        if(action == 'copy') {
          copy(JSON.stringify(node));
        }
        if(action == 'paste' && copiedNode) {
          (node.children = node.children||[]).push(... copiedNode);
          return [... topLevel];
        }
      }
    }
  }
  return topLevel;
}

export default defineComponent({
  data() {
    return { 
      collisionMap: new Map<string, [CollisionNode,CollisionNode[]]>()
    }
  },
  setup() {
    const { activeModel } = injectActiveModel()!;
    const { collisionData, loadCollisionData, saveCollisionData } = injectDBProvider()!;

    let _id: string | null = null;
    watch(activeModel, async (id: string|null) => {
      if(_id !== id) {
        if(id) {
          loadCollisionData(id);
        } else {
          collisionData.value = null;
        }
      }
      _id = id;
    });

    const generateCollisionBus: GenerateCollisionBus = useGenerateCollisionBus();
    const onSelectBus = useSelectCollisionNodeBus();

    return { activeModel, collisionData, saveCollisionData, generateCollisionBus, onSelectBus, clipboard: useClipboard() }
  },
  render() {

    const collisionNodes = this.collisionData?.collision || [];
    const treeNodes: TreeNode[] = collisionNodes.map( (d,i) => convertCollisionNodes(d, this.collisionMap, collisionNodes, ''+i))||[];
    const selectedKeys = ref<TreeSelectionKeys>({});

    function getKey() {
      return Object.keys(selectedKeys.value)[0]||null;
    }
    const menuAction = (action: 'add'|'remove'|'up'|'down') => {
      const r = modifyNodes(getKey(), collisionNodes, this.collisionMap, action)
      if(this.activeModel && r && r !== collisionNodes) {
        this.saveCollisionData(this.activeModel, toRaw(r));
      }
    }
    const copyPasteAction = (action: 'copy'|'paste') => {
      const r = copyPaste(this.clipboard, getKey(), collisionNodes, this.collisionMap, action)
      if(this.activeModel && r && r !== collisionNodes) {
        this.saveCollisionData(this.activeModel, toRaw(r));
      }
    }
    const getMenuItems: ()=>MenuItem[] = () => {
      return [
            { icon: PrimeIcons.PLUS,  command: () => { menuAction('add'); }},
            { icon: PrimeIcons.MINUS, command: () => { menuAction('remove'); }},
            { icon: PrimeIcons.ARROW_UP, command: () => { menuAction('up'); }},
            { icon: PrimeIcons.ARROW_DOWN, command: () => { menuAction('down'); }},
            { icon: PrimeIcons.COPY, command: () => { copyPasteAction('copy') }},
            { icon: PrimeIcons.CLIPBOARD, command: () => { copyPasteAction('paste') }},
      ]
    }

    const generateMenu: ()=>MenuItem[] = () => {
      return [
        { label: 'BVH3', command: () => this.generateCollisionBus.emit('BVH3', this.activeModel)},
        { label: 'BVH6', command: () => this.generateCollisionBus.emit('BVH6', this.activeModel)},
        { label: 'AABox', command: () => this.generateCollisionBus.emit('AABox', this.activeModel)},
        { label: 'Sphere', command: ()  => this.generateCollisionBus.emit('Sphere', this.activeModel)},
        { label: 'Capsule', command: () => this.generateCollisionBus.emit('Capsule', this.activeModel)},
        { label: 'ConvexHull', command: () => this.generateCollisionBus.emit('ConvexHull', this.activeModel)},
        { label: 'TriMesh', command: ()  => this.generateCollisionBus.emit('TriMesh', this.activeModel)},
        {
          label: 'Clear', command: ()  => this.generateCollisionBus.emit('Clear', this.activeModel)
        }
      ]
    }

    if(this.activeModel == null) {
      return <></>
    }

    return <>
    <Menubar model={generateMenu()} />
    <Panel header="Collision Data" toggleable collapsed={false}> 
        <Menubar model={getMenuItems()} />
        <Tree
          onUpdate:selectionKeys={(key: TreeSelectionKeys) => { selectedKeys.value = key; this.onSelectBus.emit(getKey()) } }
          selectionKeys={selectedKeys.value}
          value={treeNodes}
          selectionMode="single" class="w-full md:w-[30rem]"></Tree>
    </Panel></>
  }
});