export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

export function base64ToBlob(base64: string, mimeType: string): Promise<Blob> {
    return fetch(base64).then(res => res.blob());
}


export function resizeAndScaleImage(base64Str: string, aspectRatio: string, scale: number, panX: number, panY: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }

      const [w, h] = aspectRatio.split(':').map(Number);
      const targetAspectRatio = w / h;
      
      // We'll render at a max width of 1024 for performance
      const outputWidth = 1024;
      const outputHeight = outputWidth / targetAspectRatio;

      canvas.width = outputWidth;
      canvas.height = outputHeight;

      // Calculate scale required to cover the canvas
      const scaleToCover = Math.max(outputWidth / img.width, outputHeight / img.height);
      
      // Apply user scale on top of cover scale
      const finalScale = scaleToCover * scale;

      const drawWidth = img.width * finalScale;
      const drawHeight = img.height * finalScale;

      // Center the image initially
      const initialX = (outputWidth - drawWidth) / 2;
      const initialY = (outputHeight - drawHeight) / 2;

      // Calculate the maximum pannable distance (how much the image is off-canvas)
      const panRangeX = Math.max(0, drawWidth - outputWidth);
      const panRangeY = Math.max(0, drawHeight - outputHeight);

      // Calculate the offset from the center based on user input panX/panY (-1 to 1)
      const panOffsetX = panX * (panRangeX / 2);
      const panOffsetY = panY * (panRangeY / 2);
      
      const drawX = initialX - panOffsetX;
      const drawY = initialY - panOffsetY;
      
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (error) => reject(error);
  });
}

export function scaleAndCenterImage(base64Str: string, scale: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const scaledWidth = img.naturalWidth * scale;
      const scaledHeight = img.naturalHeight * scale;

      const x = (canvas.width - scaledWidth) / 2;
      const y = (canvas.height - scaledHeight) / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
      
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (error) => reject(error);
  });
}