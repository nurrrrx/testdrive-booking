'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  number: number;
  title: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center justify-center space-x-4 md:space-x-8">
        {steps.map((step) => (
          <li key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium',
                  step.number < currentStep
                    ? 'border-primary bg-primary text-primary-foreground'
                    : step.number === currentStep
                      ? 'border-primary text-primary'
                      : 'border-muted-foreground/30 text-muted-foreground/30'
                )}
              >
                {step.number < currentStep ? (
                  <Check className="h-5 w-5" />
                ) : (
                  step.number
                )}
              </div>
              <span
                className={cn(
                  'mt-2 text-xs font-medium hidden sm:block',
                  step.number <= currentStep
                    ? 'text-foreground'
                    : 'text-muted-foreground/50'
                )}
              >
                {step.title}
              </span>
            </div>
            {step.number < steps.length && (
              <div
                className={cn(
                  'h-0.5 w-8 md:w-16 ml-4 md:ml-8',
                  step.number < currentStep ? 'bg-primary' : 'bg-muted-foreground/30'
                )}
              />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
