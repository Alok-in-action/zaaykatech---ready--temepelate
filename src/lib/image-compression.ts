/**
 * Client-Side Image Compression Utility
 * Resizes and compresses images in the browser before network transmission.
 * Reduces 5–10 MB smartphone photos to ~30–120 KB WebP/JPEG for lightning-fast uploads on mobile data.
 */

export function getRecommendedCompression(purpose: 'logo' | 'hero' | 'poster' | 'dish' | string): {
  maxDimension: number;
  quality: number;
} {
  switch (purpose) {
    case 'logo':
      return { maxDimension: 512, quality: 0.82 };
    case 'dish':
      return { maxDimension: 800, quality: 0.82 };
    case 'hero':
    case 'poster':
    case 'hero-poster':
      return { maxDimension: 1280, quality: 0.8 };
    default:
      return { maxDimension: 1200, quality: 0.82 };
  }
}

export async function compressImage(
  file: File,
  maxDimension: number = 1200,
  quality: number = 0.82
): Promise<File> {
  // If SVG or non-image, skip compression
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let { width, height } = img;

        // Downscale while preserving aspect ratio if longest edge > maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(file);
          return;
        }

        // Draw downscaled image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first for superior compression and alpha transparency support
        const tryFormat = (mimeType: string, fallbackMime: string) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                // Fallback to JPEG if WebP blob creation failed
                if (fallbackMime && fallbackMime !== mimeType) {
                  tryFormat(fallbackMime, '');
                  return;
                }
                resolve(file);
                return;
              }

              // Only use compressed if it actually reduced file size
              if (blob.size >= file.size && file.type === mimeType) {
                resolve(file);
                return;
              }

              const ext = mimeType === 'image/webp' ? '.webp' : mimeType === 'image/png' ? '.png' : '.jpg';
              const cleanBase = file.name.replace(/\.[^/.]+$/, '');
              const compressedFile = new File([blob], `${cleanBase}${ext}`, {
                type: mimeType,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            mimeType,
            quality
          );
        };

        // Modern browsers: export WebP (or fallback to JPEG)
        tryFormat('image/webp', 'image/jpeg');
      };

      img.onerror = () => resolve(file);
    };

    reader.onerror = () => resolve(file);
  });
}
