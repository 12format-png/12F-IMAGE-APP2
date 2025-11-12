
import React, { useState, useCallback, useRef } from 'react';
import { fileToBase64 } from '../utils/imageUtils';

interface ImageUploaderProps {
  onImageReady: (file: File, base64: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageReady }) => {
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(async (files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const base64 = await fileToBase64(file);
        onImageReady(file, base64);
      } else {
        alert('Пожалуйста, выберите файл изображения.');
      }
    }
  }, [onImageReady]);

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    handleFileChange(e.dataTransfer.files);
  };
  
  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-4 text-center text-indigo-300">Начните с вашей фотографии</h2>
        <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={onButtonClick}
            className={`w-full max-w-md h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 ${dragging ? 'border-indigo-400 bg-gray-800' : 'border-gray-600 hover:border-indigo-500 hover:bg-gray-800/50'}`}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files)}
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-400">Перетащите изображение сюда</p>
            <p className="text-gray-500 text-sm">или нажмите, чтобы выбрать файл</p>
        </div>
    </div>
  );
};
