import React, { useState } from 'react';
import { generateImageWithImagen } from '../services/geminiService';
import { Loader } from './Loader';
import type { ImageState } from '../App';
import { ErrorMessage } from './ErrorMessage';

interface ImageGeneratorProps {
  onImageReady: (file: File, base64: string) => void;
}

const aspectRatios = ["1:1", "16:9", "9:16", "4:3", "3:4"];

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onImageReady }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Пожалуйста, введите промпт.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { file, base64 } = await generateImageWithImagen(prompt, aspectRatio);
      onImageReady(file, base64);
    } catch (e: any) {
      setError(e.message || 'Не удалось создать изображение. Пожалуйста, попробуйте еще раз.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-4 text-center text-indigo-300">...или создайте с помощью ИИ</h2>
      <div className="w-full max-w-md space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-1">Промпт</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="например, Профессиональное фото синей замшевой туфли на белом фоне"
            className="w-full p-2 rounded-md bg-gray-800 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 text-white"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Соотношение сторон</label>
          <div className="flex flex-wrap gap-2">
            {aspectRatios.map(ar => (
              <button
                key={ar}
                onClick={() => setAspectRatio(ar)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${aspectRatio === ar ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
              >
                {ar}
              </button>
            ))}
          </div>
        </div>
        {error && <ErrorMessage message={error} />}
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? <Loader /> : 'Создать изображение'}
        </button>
      </div>
    </div>
  );
};