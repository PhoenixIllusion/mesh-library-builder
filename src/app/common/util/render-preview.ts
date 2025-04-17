import { DBMeshes } from "../services/db";

export async function renderPreviewImage(modelId: string | undefined, canvas: HTMLCanvasElement) {
  if (modelId) {
    const mesh = await DBMeshes.getMeshByName(modelId);
    const blob = mesh?.icon?.data;
    if (canvas && blob) {
      const img = await createImageBitmap(blob)
      canvas.getContext('2d')?.drawImage(img, 0, 0, 48, 48);
    }
  }
}