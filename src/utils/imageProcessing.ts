import Pica from 'pica';

const pica = new Pica();

export async function resizeImage(file: File, maxWidth: number = 1200, maxHeight: number = 800): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (maxWidth * height) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (maxHeight * width) / height;
          height = maxHeight;
        }

        // Create canvases
        const from = document.createElement('canvas');
        from.width = img.width;
        from.height = img.height;
        const ctx = from.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');
        ctx.drawImage(img, 0, 0);

        const to = document.createElement('canvas');
        to.width = Math.round(width);
        to.height = Math.round(height);

        // Resize using pica
        const result = await pica.resize(from, to, {
          unsharpAmount: 80,
          unsharpRadius: 0.6,
          unsharpThreshold: 2
        });

        // Convert to blob
        const blob = await pica.toBlob(result, 'image/jpeg', 0.9);
        resolve(blob);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  return validTypes.includes(file.type);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}