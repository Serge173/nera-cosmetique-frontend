const OUTPUT_SIZE = 512;
const MAX_INPUT_BYTES = 15 * 1024 * 1024;

/**
 * Recadre la photo en carré centré de 512 px et la réencode.
 * Le réencodage retire les métadonnées (position GPS, appareil…) et allège fortement l'envoi.
 */
export async function prepareAvatar(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('Choisissez une image (JPG, PNG ou WebP).');
  if (file.size > MAX_INPUT_BYTES) throw new Error('Cette image est trop lourde (15 Mo maximum).');

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('Format d’image non pris en charge. Essayez une photo JPG ou PNG.');
  }

  const side = Math.min(bitmap.width, bitmap.height);
  const size = Math.min(OUTPUT_SIZE, side);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Votre navigateur ne permet pas de préparer l’image.');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  bitmap.close();

  const webp = await toBlob(canvas, 'image/webp', 0.88);
  if (webp?.type === 'image/webp') return webp;
  const jpeg = await toBlob(canvas, 'image/jpeg', 0.9);
  if (!jpeg) throw new Error('Impossible de préparer l’image.');
  return jpeg;
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}
