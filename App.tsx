
import React, { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ImageGenerator } from './components/ImageGenerator';
import { Editor } from './components/Editor';
import { Header } from './components/Header';

export type ImageState = {
  file: File;
  base64: string;
};

function App() {
  const [imageState, setImageState] = useState<ImageState | null>(null);

  const handleImageReady = useCallback((file: File, base64: string) => {
    setImageState({ file, base64 });
  }, []);

  const handleReset = useCallback(() => {
    setImageState(null);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
      <Header onReset={imageState ? handleReset : undefined} />
      <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col items-center justify-center">
        {!imageState ? (
          <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8">
            <ImageUploader onImageReady={handleImageReady} />
            <div className="flex items-center justify-center">
                <div className="h-full w-px bg-gray-700 hidden md:block"></div>
                <div className="w-full h-px bg-gray-700 md:hidden"></div>
            </div>
            <ImageGenerator onImageReady={handleImageReady} />
          </div>
        ) : (
          <Editor initialImage={imageState} />
        )}
      </main>
    </div>
  );
}

export default App;
