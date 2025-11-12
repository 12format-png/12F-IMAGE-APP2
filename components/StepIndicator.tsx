import React from 'react';

interface Step {
  id: number;
  name: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep }) => {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li key={step.name} className={`relative ${stepIdx !== steps.length - 1 ? 'flex-1' : ''}`}>
             {/* Connector Line */}
            {stepIdx !== steps.length - 1 && (
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className={`h-0.5 w-full ${step.id < currentStep ? 'bg-indigo-600' : 'bg-gray-700'}`} />
                </div>
            )}
            
            <div className="relative w-8">
                {step.id < currentStep ? (
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600">
                        <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" />
                        </svg>
                    </div>
                ) : step.id === currentStep ? (
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-indigo-600 bg-gray-800" aria-current="step">
                        <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" aria-hidden="true" />
                    </div>
                ) : (
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-700 bg-gray-800" />
                )}
                 <span className="absolute top-full pt-2 text-xs text-gray-400 whitespace-nowrap left-1/2 -translate-x-1/2">{step.name}</span>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};