import { DBMeshes, DBTexture, DBVariants, MaterialOverride } from "../services/db";


export type Dimension = [number,number,number,number];
const previewCache: Record<string, ImageBitmap> = {}
export async function renderPreviewImage(modelId: string | undefined, ctx: CanvasRenderingContext2D, pos: Dimension ) {
  let img: ImageBitmap|null = previewCache[modelId||''] || null;;
  if (!img && modelId) {
    const mesh = await DBMeshes.getMeshByName(modelId);
    const blob = mesh?.icon?.data;
    if (blob) {
      img = previewCache[modelId] = await createImageBitmap(blob)
    }
  }
  if(img) {
    ctx.clearRect(... pos);
    ctx.drawImage(img, ... pos);
  }
}
const VARIANT_W = 16;
const VARIANT_H = 16;
export async function renderVariant(variantId: string | null, ctx: CanvasRenderingContext2D, pos: Dimension ) {
  if(variantId) {
    const variant = await DBVariants.getById(variantId);
    if(variant) {
      //note, this supports up to first 6 displaying 
      const m = variant.materials.slice(0,8).reverse();
      const [px,py,pw,ph] = pos;
      const point: Dimension = [px+pw, py+ph-VARIANT_H, VARIANT_W, VARIANT_H]; // position to lower right of tile
      for (let [idx, v] of m.entries()) {
        if(idx == 3) {
          point[0]+=3*VARIANT_W;
          point[1]-=VARIANT_W;
        }
        point[0]-=VARIANT_W;
        await renderMaterialPreview(v, ctx, point)
        ctx.strokeStyle='black';
        ctx.lineWidth=1;
        ctx.strokeRect(point[0],point[1],point[2]-1,point[3]-1);
      }
    }
  }
}

const texCache: Record<string, ImageBitmap> = {}
export async function renderMaterialPreview(material: MaterialOverride|undefined, ctx: CanvasRenderingContext2D, pos: Dimension ) {
  if(material) {
    if('texture' in material) {
      const url = material.texture;
      let bmp: ImageBitmap|null = texCache[url]||null;
      if(!bmp) {
        const tex = await DBTexture.getTextureByName(url);
        if(tex)
          bmp = await createImageBitmap(tex.data, Object.assign({}, { colorSpaceConversion: 'none' as ColorSpaceConversion }));
      }
      if (bmp) {
        ctx.drawImage(bmp, ... pos);
      } else {
        ctx.fillStyle = `#FF00FF`
        ctx.fillRect(... pos);
      }
    }
    if('color' in material) {
      const [r,g,b,_a] = material.color;
      ctx.fillStyle = `rgb(${r*255},${g*255},${b*255})`
      ctx.fillRect(... pos);
    }
  }
}