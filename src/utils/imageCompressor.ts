/**
 * Ultra-lightweight client-side image compressor using pure HTML5 <canvas>.
 * Resizes image to 160x160 square center-cropped JPEG (< 25 KB Data URL).
 * Zero external libraries, zero network usage, works 100% offline.
 */
export async function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('ఫైల్ చదవడంలో లోపం జరిగింది (File read error)'));
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error('చిత్రం లోడ్ చేయడంలో విఫలమైంది (Image load error)'));
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = 160;
            canvas.height = 160;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              reject(new Error('Canvas context not available'));
              return;
            }

            // Calculate center-crop coordinates
            const minDim = Math.min(img.width, img.height);
            const startX = (img.width - minDim) / 2;
            const startY = (img.height - minDim) / 2;

            // Draw center-cropped 160x160 square
            ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, 160, 160);

            // Export as JPEG at 0.72 quality
            let dataUrl = canvas.toDataURL('image/jpeg', 0.72);

            // Ensure size < 25 KB (~34,000 base64 chars)
            if (dataUrl.length > 34000) {
              dataUrl = canvas.toDataURL('image/jpeg', 0.5);
            }

            resolve(dataUrl);
          } catch (err) {
            reject(err);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      reject(err);
    }
  });
}
