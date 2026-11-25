/**
 * Compresses any user-selected image file or live camera video frame
 * into a compact WebP File (`image/webp`) with proportional resizing.
 */
export interface CompressedImageResult {
  file: File;
  previewUrl: string;
  originalBytes: number;
  compressedBytes: number;
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

function canvasToWebpBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to encode image as WebP.'));
          return;
        }
        resolve(blob);
      },
      'image/webp',
      quality
    );
  });
}

export async function compressImageToWebP(
  source: File | HTMLVideoElement,
  options: { maxDimension?: number; quality?: number } = {}
): Promise<CompressedImageResult> {
  const maxDim = options.maxDimension ?? 1024;
  const quality = options.quality ?? 0.72;

  let srcWidth = 0;
  let srcHeight = 0;
  let originalBytes = 0;
  let drawSource: CanvasImageSource;
  let baseName = `photo-${Date.now()}`;

  if (source instanceof File) {
    originalBytes = source.size;
    baseName = source.name.replace(/\.[^.]+$/, '') || baseName;
    const img = await loadImageElement(source);
    srcWidth = img.naturalWidth || img.width || 640;
    srcHeight = img.naturalHeight || img.height || 480;
    drawSource = img;
  } else {
    srcWidth = source.videoWidth || 640;
    srcHeight = source.videoHeight || 480;
    drawSource = source;
  }

  let targetWidth = srcWidth;
  let targetHeight = srcHeight;
  if (srcWidth > maxDim || srcHeight > maxDim) {
    if (srcWidth >= srcHeight) {
      targetWidth = maxDim;
      targetHeight = Math.round((srcHeight / srcWidth) * maxDim);
    } else {
      targetHeight = maxDim;
      targetWidth = Math.round((srcWidth / srcHeight) * maxDim);
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, targetWidth);
  canvas.height = Math.max(1, targetHeight);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context is not available.');
  }
  ctx.drawImage(drawSource, 0, 0, canvas.width, canvas.height);

  const webpBlob = await canvasToWebpBlob(canvas, quality);
  if (!(source instanceof File)) {
    originalBytes = webpBlob.size;
  }

  const webpFile = new File([webpBlob], `${baseName}.webp`, {
    type: 'image/webp',
  });

  return {
    file: webpFile,
    previewUrl: URL.createObjectURL(webpFile),
    originalBytes,
    compressedBytes: webpFile.size,
  };
}

