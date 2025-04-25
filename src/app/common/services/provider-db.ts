import { App, inject, Ref, ref, shallowRef, ShallowRef, watch } from "vue";
import { CollisionEntry, DBMap, DBMeshes, DBSession, DBVariants, MapEntry, VariantEntry } from "./db";
import { CollisionNode } from "./collision";

export interface Pending<T> {
  data: ShallowRef<T | null>;
  loading: Ref<boolean>;
}
export interface PendingV<T> {
  data: T | null;
  loading: boolean;
}

function createPending<T extends Awaited<ReturnType<F>>, F extends (...args: any[]) => Promise<any>>(f: F): [(...args: Parameters<F>) => void, Pending<T>] {
  const loading: Ref<boolean> = ref(false);
  const data: ShallowRef<T | null> = shallowRef(null);
  const func = (...args: Parameters<typeof f>) => {
    loading.value = true;
    f.call(null, ...args).then(res => {
      data.value = res;
      loading.value = false;
    })
  }
  const pending: Pending<T> = { data, loading };
  return [func, pending];
}

const __symb = Symbol('DBProvider');

export function provideDBProvider(app: App<Element>) {
  app.provide(__symb, createDBProvider())
}

export function injectDBProvider() {
  return inject<DBProvider>(__symb)
}


function mapFunctionality() {
  const [loadMap, map] = createPending(DBMap.load);

  function saveMap(_map: MapEntry) {
    DBMap.save(_map).then(m => map.data.value = m);
  }

  function editMap(_map: MapEntry, name: string, width: number, height: number) {
    const newMap = DBMap.resize(_map, width, height);
    newMap.name = name;
    saveMap(newMap);
  }
  function newMap(name?: string, width?: number, height?: number) {
    DBMap.create(name, width, height).then(_map => map.data.value = _map);
  }

  return {
    loaded: map,
    new: newMap,
    load: loadMap,
    save: saveMap,
    edit: editMap
  }
}

function collisionFunctionality() {
  const collisionData: Ref<CollisionEntry | null> = shallowRef(null);
  function loadCollisionData(name: string) {
    DBMeshes.loadCollisionData(name).then(res => collisionData.value = res);
  }
  function saveCollisionData(name: string, collision: CollisionNode[]) {
    DBMeshes.saveCollisionData(name, collision).then(res => collisionData.value = res);
  }
  return {
    loaded: collisionData,
    save: saveCollisionData,
    load: loadCollisionData
  }
}

function variantFunctionality() {
  const [loadVariants, variants] = createPending((mesh: string|null) => DBVariants.getByMeshName(mesh));
  const activeVariant = ref<VariantEntry|null>(null);
  const selectVariant = (v: VariantEntry|null) => {
    activeVariant.value = v;
  }
  const newVariant = async (mesh: string, data: Partial<VariantEntry>) => {
    activeVariant.value = await DBVariants.newVariantForMeshName(mesh, data);
  }
  const updateVariant = async (v: VariantEntry) => {
    activeVariant.value = await DBVariants.updateVariant(v);
  }
  const deleteVariant = async (v: VariantEntry) => {
    activeVariant.value = await DBVariants.deleteVariant(v);
  }
  return {
    loadList: loadVariants, list: variants,

    active: activeVariant, select: selectVariant,

    new: newVariant, update: updateVariant, delete: deleteVariant
  }
}


export type DBProvider = ReturnType<typeof createDBProvider> 

function createDBProvider() {

  const mapFunc = mapFunctionality();
  const collisionFunc = collisionFunctionality();
  const variantFunc = variantFunctionality();

  const [loadMapList, mapList] = createPending(DBMap.getAll);
  const [loadDirList, dirList] = createPending(DBMeshes.getDirectories);

  const activeDir = shallowRef<string | null>(null);
  const [selectDir, loadedDir] = createPending((dir: string) => {
    activeDir.value = dir;
    return DBMeshes.getDirectory(dir);
  })


  DBSession.load().then(session => {
    if (session.activeMap?.length) {
      mapFunc.load(session.activeMap);
    }
    if (session.activeTab?.length) {
      selectDir(session.activeTab);
    }
    watch(mapFunc.loaded.data, (_map) => {
      if (_map) {
        session.activeMap = _map.guid;
      }
      DBSession.save(session);
    })
    watch(activeDir, (dir) => {
      if (dir) {
        session.activeTab = dir;
      }
      DBSession.save(session);
    })
  })
  loadDirList();


  return {
    map: mapFunc,

    mapList: {
      load: loadMapList,
      list: mapList
    },

    dir: {
      load: loadDirList,
      list: dirList,
      select: selectDir,
      loaded: loadedDir,
      active: activeDir,
    },


    collision: collisionFunc,
    variants: variantFunc
  }
}