import React from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Building2, Users, DollarSign, Settings } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  churchName: string;
}

export function WelcomeModal({ isOpen, onClose, churchName }: WelcomeModalProps) {
  const features = [
    {
      icon: Users,
      title: 'Member Management',
      description: 'Track members, attendance, and ministry involvement'
    },
    {
      icon: DollarSign,
      title: 'Financial Management',
      description: 'Handle tithes, offerings, and expense tracking'
    },
    {
      icon: Settings,
      title: 'Church Settings',
      description: 'Customize your church profile and preferences'
    }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
    >
      <div className="p-6">
        <div className="text-center">
          <Building2 className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Welcome to {churchName}!
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Your church administration system is ready to use. Here's what you can do:
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                <feature.icon className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button
            onClick={onClose}
            size="lg"
          >
            Get Started
          </Button>
        </div>
      </div>
    </Modal>
  );
}