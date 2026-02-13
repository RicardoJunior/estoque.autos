import React from 'react';

interface Step {
  id: number;
  label: string;
  description: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep }) => {
  return (
    <div className="w-full mb-12">
      <ul className="steps steps-horizontal w-full">
        {steps.map((step) => (
          <li
            key={step.id}
            className={`step ${currentStep >= step.id ? 'step-primary' : ''}`}
            data-content={currentStep > step.id ? '✓' : step.id}
          >
            <div className="mt-2 hidden md:block">
              <div className="font-semibold text-sm">{step.label}</div>
              <div className="text-xs opacity-60">{step.description}</div>
            </div>
            <div className="mt-2 md:hidden">
              <div className="font-semibold text-xs">{step.label}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
