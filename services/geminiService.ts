import { GoogleGenAI, Modality } from "@google/genai";
import { base64ToBlob } from '../utils/imageUtils';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// Centralized error handler for API calls
function handleApiError(error: any): never {
  console.error("Gemini API Error:", error);
  // Check for the specific quota exceeded error message
  if (error.message && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED'))) {
    throw new Error(
      'Вы превысили квоту использования API. Пожалуйста, проверьте ваш тарифный план. Подробнее: ai.google.dev/gemini-api/docs/rate-limits'
    );
  }
  // Generic error for other API issues
  throw new Error('Произошла ошибка при обращении к AI. Пожалуйста, попробуйте еще раз.');
}

// Function to edit an image using a text prompt with Gemini 2.5 Flash Image
export async function editImageWithGeminiFlash(base64Image: string, mimeType: string, prompt: string): Promise<string> {
  try {
    const imagePart = {
      inlineData: {
        data: base64Image.split(',')[1],
        mimeType,
      },
    };

    const textPart = {
      text: prompt,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64Data = part.inlineData.data;
        const mimeType = part.inlineData.mimeType;
        return `data:${mimeType};base64,${base64Data}`;
      }
    }
    
    throw new Error('Изображение не было сгенерировано API.');
  } catch(e) {
    if (e instanceof Error && e.message.includes('Изображение не было сгенерировано')) {
      throw e;
    }
    handleApiError(e);
  }
}

// Function to generate an image from a text prompt using Imagen
export async function generateImageWithImagen(prompt: string, aspectRatio: string): Promise<{ file: File, base64: string }> {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: aspectRatio as "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
            const blob = await base64ToBlob(imageUrl, 'image/png');
            const file = new File([blob], 'generated-image.png', { type: 'image/png' });
            return { file, base64: imageUrl };
        }

        throw new Error('Генерация изображения не удалась.');
    } catch (e) {
        if (e instanceof Error && e.message.includes('Генерация изображения не удалась')) {
            throw e;
        }
        handleApiError(e);
    }
}


// Function to analyze an image and get text feedback using Gemini 2.5 Flash
export async function analyzeImageWithGemini(base64Image: string, mimeType: string, prompt: string): Promise<string> {
  try {
    const imagePart = {
      inlineData: {
        data: base64Image.split(',')[1],
        mimeType,
      },
    };
    
    const textPart = {
      text: prompt,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
    });

    return response.text;
  } catch(e) {
    handleApiError(e);
  }
}