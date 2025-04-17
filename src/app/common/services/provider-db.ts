import { App, inject, Ref, ref, shallowRef, ShallowRef, watch } from "vue";
import { CollisionEntry, DBMap, DBMeshes, DBSession, MapEntry, MeshEntry } from "./db";
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

export interface DBProvider {
  map: Pending<MapEntry | null>;
  loadMap(guid: string): void;

  saveMap(map: MapEntry): void;
  newMap(name?: string, width?: number, height?: number): void;
  editMap(map: MapEntry, name: string, width: number, height: number): void;

  loadMapList(): void;
  mapList: Pending<MapEntry[]>;

  loadDirList(): void;
  dirList: Pending<string[]>;

  selectDir(dir: string): void;
  activeDir: ShallowRef<string | null>
  loadedDir: Pending<MeshEntry[]>;

  collisionData: ShallowRef<CollisionEntry | null>,
  saveCollisionData(name: string, collision: CollisionNode[]): void;
  loadCollisionData(name: string): void;
}

const __symb = Symbol('DBProvider');

export function provideDBProvider(app: App<Element>) {
  app.provide(__symb, createDBProvider())
}

export function injectDBProvider() {
  return inject<DBProvider>(__symb)
}

function createDBProvider(): DBProvider {

  const [loadMap, map] = createPending(DBMap.load);

  function saveMap(_map: MapEntry) {
    DBMap.save(_map).then(m => map.data.value = m);
  }

  const [loadMapList, mapList] = createPending(DBMap.getAll);

  const [loadDirList, dirList] = createPending(DBMeshes.getDirectories);

  const activeDir = shallowRef<string | null>(null);
  const [selectDir, loadedDir] = createPending((dir: string) => {
    activeDir.value = dir;
    return DBMeshes.getDirectory(dir);
  })

  function editMap(_map: MapEntry, name: string, width: number, height: number) {
    const newMap = DBMap.resize(_map, width, height);
    newMap.name = name;
    saveMap(newMap);
  }
  function newMap(name?: string, width?: number, height?: number) {
    DBMap.create(name, width, height).then(_map => map.data.value = _map);
  }

  DBSession.load().then(session => {
    if (session.activeMap?.length) {
      loadMap(session.activeMap);
    }
    if (session.activeTab?.length) {
      selectDir(session.activeTab);
    }
    watch(map.data, (_map) => {
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

  const collisionData: Ref<CollisionEntry | null> = shallowRef(null);
  function loadCollisionData(name: string) {
    DBMeshes.loadCollisionData(name).then(res => collisionData.value = res);
  }
  function saveCollisionData(name: string, collision: CollisionNode[]) {
    DBMeshes.saveCollisionData(name, collision).then(res => collisionData.value = res);
  }

  return {
    map,
    newMap,
    loadMap,
    saveMap,
    editMap,

    loadMapList,
    mapList,

    loadDirList,
    dirList,

    selectDir,
    loadedDir,
    activeDir,

    collisionData,
    saveCollisionData,
    loadCollisionData
  }
}