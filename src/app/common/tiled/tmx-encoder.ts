import { DBMeshes, MapEntry } from "../services/db";

import type { TiledTileset, TiledMapOrthogonal, TiledLayerAbstract, TiledLayerType } from 'tiled-types'
import { Dimension, renderPreviewImage, renderVariant } from "../util/render-preview";

export namespace TSX {
  export interface TileSet extends Partial<TiledTileset> {
  }
  export interface Transformations {
    hflip: number;
    vflip: number;
    rotate: number;
    preferuntransformed: number;
  }
  export interface Image {
    width: number;
    height: number;
    format?: string;
    source?: string;
  }
  export interface TileSetInfo {
    tileset: TileSet & Record<string, string | number>;
    transforms: Transformations & Record<string, string | number>;
  }
}

export namespace TMX {
  export interface Map extends Partial<TiledMapOrthogonal> {
  }

  export interface TileSet {
    firstgid: number;
    source: string;
  }
  export interface Layer extends TiledLayerAbstract<TiledLayerType> {
  }
  export interface Data {
    encoding: string;
  }
  export namespace Data {
    export interface Chunk {
      x: number;
      y: number;
      width: number;
      height: number;
    }
  }
}

const TILE_WIDTH = 48;
const TILE_HEIGHT = 48;
const TILE_SPACING = 1;

interface XmlNode {
  tag: string;
  attrs: Record<string, string | number>,
  text?: string;
  children?: XmlNode[]
}

const XML_ENCODING = '<?xml version="1.0" encoding="UTF-8"?>\n'

function setXmlAttributes(doc: XMLDocument, el: Element, node: XmlNode) {
  for (var key in node.attrs) {
    el.setAttribute(key, '' + node.attrs[key]);
  }
  if (node.text) {
    el.innerHTML = node.text;
  }
  node.children?.forEach(child => {
    const node = doc.createElement(child.tag);
    el.append(node);
    setXmlAttributes(doc, node, child);
  })
}

export function createTsxFileXML(mapEntry: MapEntry): { name: string, data: Blob | null } {

  const { width, height } = mapEntry;
  const config: TSX.TileSetInfo = {
    tileset: { firstgid: 1, columns: width, name: mapEntry.name, tilecount: width * height, tileheight: TILE_HEIGHT, tilewidth: TILE_WIDTH, spacing: TILE_SPACING },
    transforms: { hflip: 1, preferuntransformed: 1, rotate: 1, vflip: 1 }
  };
  const canvas = {
    width: width * (TILE_WIDTH + TILE_SPACING),
    height: height * (TILE_HEIGHT + TILE_SPACING)
  }

  const x = new XMLSerializer();
  const doc = document.implementation.createDocument(null, 'tileset');
  const root = doc.children[0];
  const image_attrs: TSX.Image & Record<string, string | number> = { width: canvas.width, height: canvas.height, source: `${mapEntry.name}.png` }

  setXmlAttributes(doc, root, {
    tag: 'tileset',
    attrs: config.tileset,
    children: [{
      tag: 'transformations',
      attrs: config.transforms
    }, {
      tag: 'image',
      attrs: image_attrs
    }]
  })

  return { name: `${mapEntry.name}.tsx`, data: new Blob([XML_ENCODING + x.serializeToString(doc)]) };
}

function markCanvasDirection(offset: { x: number, y: number }, context: CanvasRenderingContext2D): void {
  const mark_height = 4;
  const mark_width = 16;
  const x = offset.x + TILE_WIDTH / 2 - mark_width / 2;
  const y = offset.y + TILE_HEIGHT - mark_height;

  // Draw the circle
  context.fillStyle = '#ff00ff';
  context.fillRect(x, y, mark_width, mark_height);
}

export async function createTsxImage(mapEntry: MapEntry): Promise<{ name: string, data: Blob | null }> {
  const canvas = document.createElement('canvas');

  const { width, height, data } = mapEntry;
  canvas.width = width * (TILE_WIDTH + TILE_SPACING);
  canvas.height = height * (TILE_HEIGHT + TILE_SPACING);
  const ctx = canvas.getContext('2d')!;
  let index = 0;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const entry = data[index++];
      if (entry) {
        const [model, variant] = entry.split(':')
        if (canvas) {
          const ix = x * (TILE_WIDTH + TILE_SPACING);
          const iy = y * (TILE_HEIGHT + TILE_SPACING);
          const pos: Dimension = [ix, iy, TILE_WIDTH, TILE_HEIGHT];
          await renderPreviewImage(model, ctx, pos)
          await renderVariant(variant, ctx, pos)
          markCanvasDirection({ x: ix, y: iy }, ctx);
        }
      }
    }
  return { name: `${mapEntry.name}.png`, data: (await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))) };
}
