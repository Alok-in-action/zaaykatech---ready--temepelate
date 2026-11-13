/**
 * Client-Side Image Compression Utility
 * Resizes images so the longest edge is <= 1600px and compresses to JPEG/WebP.
 * Significantly saves mobile bandwidth on 3G/4G networks before uploading.
 */

export async function compressImage(
  file: File,
  maxDimension: number = 1600,
  quality: number = 0.85
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

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        // Keep PNG if user uploaded transparent PNG, otherwise compress to JPEG
        const outputMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // If compressed is larger than original, return original
            if (blob.size >= file.size) {
              resolve(file);
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type: outputMime,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          outputMime,
          quality
        );
      };

      img.onerror = () => resolve(file);
    };

    reader.onerror = () => resolve(file);
  });
}
