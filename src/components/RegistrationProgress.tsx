import React, { useEffect, useState } from 'react';
import { Modal } from './ui/Modal';
import { ProgressSteps } from './ui/ProgressSteps';
import { Building2, UserPlus, Database, CheckCircle2 } from 'lucide-react';

interface RegistrationProgressProps {
  isOpen: boolean;
  currentStep: number;
}

const registrationSteps = [
  {
    title: 'Creating Church Account',
    description: 'Setting up your church profile and configuration'
  },
  {
    title: 'Setting Up Admin User',
    description: 'Creating your administrator account with proper permissions'
  },
  {
    title: 'Initializing Database',
    description: 'Preparing your database and initial settings'
  },
  {
    title: 'Completing Setup',
    description: 'Finalizing your church administration system'
  }
];

export function RegistrationProgress({ isOpen, currentStep }: RegistrationProgressProps) {
  const [displayStep, setDisplayStep] = useState(0);

  // Add a delay when updating the displayed step
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayStep(currentStep);
    }, 500); // Add a 500ms delay for smoother transitions

    return () => clearTimeout(timer);
  }, [currentStep]);

  return (
    <Modal 
      isOpen={isOpen}
      onClose={() => {}}
      size="lg"
    >
      <div className="p-6">
        <div className="text-center mb-8">
          <div className="relative mx-auto h-12 w-12">
            <Building2 className={`
              absolute inset-0 h-12 w-12 text-primary-600
              transition-all duration-500 transform
              ${displayStep === registrationSteps.length ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}
            `} />
            <CheckCircle2 className={`
              absolute inset-0 h-12 w-12 text-green-500
              transition-all duration-500 transform
              ${displayStep === registrationSteps.length ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
            `} />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            {displayStep === registrationSteps.length
              ? 'Setup Complete!'
              : 'Setting Up Your Church'}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {displayStep === registrationSteps.length
              ? 'Your church administration system is ready to use'
              : 'Please wait while we prepare your church administration system'}
          </p>
        </div>

        <ProgressSteps
          steps={registrationSteps}
          currentStep={displayStep}
          className="max-w-2xl mx-auto"
        />

        {displayStep === registrationSteps.length && (
          <div className="mt-8 text-center animate-fade-in">
            <p className="text-sm text-gray-500">
              You will be redirected to the login page in a moment...
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}