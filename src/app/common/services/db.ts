import { DBSchema, openDB, StoreNames } from "idb";
import type { CollisionNode } from './collision';

function generateGuid() {
  var result, i, j;
  result = '';
  for (j = 0; j < 32; j++) {
    if (j == 8 || j == 12 || j == 16 || j == 20)
      result = result + '-';
    i = Math.floor(Math.random() * 16).toString(16).toUpperCase();
    result = result + i;
  }
  return result;
}

interface Session {
  id: number;
  activeMap: string;
  activeTab: string;
}

export interface MapEntry {
  guid: string;
  name: string;
  width: number;
  height: number;
  data: Array<string|null|undefined>;
}

export interface TextureEntry {
  directory: string;
  name: string;
  data: Blob;
}

interface PreviewEntry {
  extension: string;
  data: Blob;
}

export interface MeshEntry {
  gltf: Blob;
  icon: PreviewEntry;
  directory: string;
  name: string;
  offset: [number,number,number]
}

export interface CollisionEntry {
  name: string;
  collision: CollisionNode[];
}

export interface MaterialOverrideNormal {
  texture: string;
  scale: number;
}

export interface MaterialOverrideBase {
  name: string;
  metallic: number;
  roughness: number;
  normal?: MaterialOverrideNormal
}

export interface MaterialOverrideTexture extends MaterialOverrideBase {
  texture: string;
}
export interface MaterialOverridePBR extends MaterialOverrideBase {
  color: [number,number,number,number];
}

export type MaterialOverride = MaterialOverrideTexture | MaterialOverridePBR

export interface VariantEntry {
  id: string;
  directory: string;
  name: string;
  mesh: string;
  materials: MaterialOverride[]
}

interface MeshLibraryDB extends DBSchema {
  session: {
    key: number;
    value: Session;
  },
  maps: {
    key: string;
    value: MapEntry;
  },
  textures: {
    key: string;
    value: TextureEntry;
    indexes: { 'by-directory': string };
  }
  mesh: {
    key: string;
    value: MeshEntry;
    indexes: { 'by-directory': string };
  },
  collision: {
    key: string;
    value: CollisionEntry
  },
  directories: {
    key: string;
    value: string;
  },
  variants: {
    key: string;
    value: VariantEntry;
    indexes: { 'by-mesh': string, 'by-directory': string };
  }
}

const _db = openDB<MeshLibraryDB>('mesh-library-db', 1, {
  upgrade(db) {
    if(!db.objectStoreNames.contains('session'))
      db.createObjectStore('session', { keyPath: 'id' });
    if(!db.objectStoreNames.contains('maps'))
      db.createObjectStore('maps', { keyPath: 'guid' });
    if(!db.objectStoreNames.contains('directories'))
      db.createObjectStore('directories');
    if(!db.objectStoreNames.contains('collision'))
      db.createObjectStore('collision', { keyPath: 'name' });
    if(!db.objectStoreNames.contains('mesh')) {
      const mesh = db.createObjectStore('mesh', { keyPath: 'name' });
      mesh.createIndex('by-directory', 'directory')  
    }
    if(!db.objectStoreNames.contains('textures')) {
      const tex = db.createObjectStore('textures', { keyPath: 'name' });
      tex.createIndex('by-directory', 'directory')
    }
    if(!db.objectStoreNames.contains('variants')) {
      const variant = db.createObjectStore('variants', { keyPath: 'id' });
      variant.createIndex('by-mesh', 'mesh')
      variant.createIndex('by-directory', 'directory')
    }
  }
})



export class DBSession {
  static async load(): Promise<Session> {
    const db = await _db;
    const entry = await db.get('session', 0)
    return entry || { id: 0, activeMap: '', activeTab: '' };
  }
  static async save(session: Session): Promise<void> {
    const db = await _db;
    db.put('session', session)
  }
}

async function getByKey<S extends StoreNames<MeshLibraryDB>>(store: S, key: string): Promise<MeshLibraryDB[S]["value"] | null> {
  const db = await _db;
  const entry = await db.get(store, key)
  return entry || null;
}

export class DBMap {
  static async create(name?: string, height: number = 10, width: number = 10): Promise<MapEntry> {
    const guid = generateGuid();
    const map: MapEntry = {
      guid: guid,
      name: name || guid,
      width,
      height,
      data: []
    }
    const db = await _db;
    db.put('maps', map)
    return map;
  }

  static resize(map: MapEntry, width: number, height: number): MapEntry {
    const result = this.clone(map);
    result.width = width;
    result.height = height;
    result.data = result.data.slice(0, width * height);
    return result;
  }

  static clone(map: MapEntry): MapEntry {
    const result = Object.assign({}, map);
    result.data = [... map.data];
    return result;
  }

  static load(guid: string): Promise<MapEntry | null> {
    return getByKey('maps', guid);
  }

  static async getAll(): Promise<MapEntry[]> {
    const db = await _db;
    return db.getAll('maps');
  }

  static async save(data: MapEntry): Promise<MapEntry | null> {
    const db = await _db;
    db.put('maps', data)
    return this.clone(data);
  }
  static async revert(data: MapEntry): Promise<MapEntry | null> {
    const db = await _db;
    return await db.get('maps', data.guid) || null;
  }

}
export class DBVariants {
  static async getByMeshName(name: string|null): Promise<VariantEntry[]> {
    if(!name) {
      return [];
    }
    const db = await _db;
    return (await db.getAllFromIndex('variants', 'by-mesh', name));
  }
  static async getById(id: string): Promise<VariantEntry|null> {
    return getByKey('variants', id);
  }
  static async getByDirectory(dir: string|null): Promise<VariantEntry[]> {
    if(!dir) {
      return [];
    }
    const db = await _db;
    return (await db.getAllFromIndex('variants', 'by-directory', dir));
  }
  static async newVariantForMeshName(mesh: string, data: Partial<VariantEntry>): Promise<VariantEntry> {
    const db = await _db;
    const id = generateGuid();
    const meshEntry = await DBMeshes.getMeshByName(mesh);
    const variant: VariantEntry = Object.assign({
      id,
      name: id,
      directory: meshEntry?.directory||'',
      mesh,
      materials: []
    }, data);
    await db.put('variants', variant);
    return variant;
  }
  static async updateVariant(curVariant: VariantEntry): Promise<VariantEntry> {
    const db = await _db;
    const variant = Object.assign({}, curVariant);
    await db.put('variants', variant);
    return variant;
  }
  static async deleteVariant(variant: VariantEntry): Promise<null> {
    const db = await _db;
    await db.delete('variants', variant.id);
    return null;
  }
}

export class DBTexture {

  static async getTextureByName(name: string): Promise<TextureEntry | null> {
    return getByKey('textures', name);
  }
  static async addTextureDirectory(data: TextureEntry[]): Promise<void> {
    if (data.length) {
      const db = await _db;
      const dir = data[0].directory;
      await db.put('directories', dir, dir)
      const tx = db.transaction('textures', 'readwrite');
      await Promise.all([...data.map(data => tx.store.put(data)), tx.done])
    }
  }
  static async deleteTextureDirectory(dir: string): Promise<void> {
    const db = await _db;
    const tx = db.transaction('textures', 'readwrite');
    const index = tx.store.index('by-directory');
    for await (const cursor of index.iterate(dir)) {
      cursor.delete()
    }
    await tx.done;
  }
  static async getTextureDirectories(): Promise<string[]> {
    const db = await _db;
    const entries = await db.getAllFromIndex('textures', 'by-directory')
    return entries.map(x => x.directory).filter((value, index, array) => {
      return array.indexOf(value) === index;
    });
  }

  static async getTexturesByDirectory(dir: string): Promise<TextureEntry[]> {
    const db = await _db;
    return await db.getAllFromIndex('textures', 'by-directory', dir);
  }
}

export class DBMeshes {
  static async getDirectories(): Promise<string[]> {
    const db = await _db;
    return await db.getAll('directories');
  }
  static async getMeshByName(name: string): Promise<MeshEntry | null> {
    return getByKey('mesh', name);
  }
  static async getDirectory(dir: string): Promise<MeshEntry[]> {
    const db = await _db;
    return db.getAllFromIndex('mesh', 'by-directory', dir);
  }
  static async addMeshDirectory(data: MeshEntry[]): Promise<void> {
    if (data.length) {
      const db = await _db;
      const dir = data[0].directory;
      await db.put('directories', dir, dir)
      const tx = db.transaction('mesh', 'readwrite');
      await Promise.all([...data.map(data => tx.store.put(data)), tx.done])
    }
  }
  static async deleteMeshDirectory(dir: string): Promise<void> {
    const db = await _db;
    const tx = db.transaction('mesh', 'readwrite');
    const index = tx.store.index('by-directory');
    for await (const cursor of index.iterate(dir)) {
      cursor.delete()
    }
    await tx.done;
  }
  static async deleteDirectory(dir: string): Promise<void> {
    const db = await _db;
    await db.delete('directories', dir);
    await DBTexture.deleteTextureDirectory(dir);
    await this.deleteMeshDirectory(dir);
  }

  static async loadCollisionData(name: string): Promise<CollisionEntry | null> {
    return getByKey('collision', name);
  }
  static async saveCollisionData(name: string, collision: CollisionNode[]): Promise<CollisionEntry> {
    const db = await _db;
    const entry: CollisionEntry = { name, collision };
    db.put('collision', entry);
    return entry;
  }
}