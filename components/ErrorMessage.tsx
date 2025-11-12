import React from 'react';

interface ErrorMessageProps {
  message: string;
}

// A simple function to find URLs and wrap them in <a> tags
const linkify = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-indigo-300 font-medium"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  const isQuotaError = message.toLowerCase().includes('квоту') || message.toLowerCase().includes('quota');
  
  return (
    <div className={`mt-4 p-4 rounded-md border ${isQuotaError ? 'bg-red-900/50 border-red-700' : 'bg-yellow-900/50 border-yellow-700'}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className={`h-5 w-5 ${isQuotaError ? 'text-red-400' : 'text-yellow-400'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.031-1.742 3.031H4.42c-1.532 0-2.492-1.697-1.742-3.031l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className={`text-sm font-medium ${isQuotaError ? 'text-red-300' : 'text-yellow-300'}`}>
            {isQuotaError ? 'Ошибка квоты API' : 'Произошла ошибка'}
          </h3>
          <div className="mt-2 text-sm text-gray-300">
            <p>{linkify(message)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
