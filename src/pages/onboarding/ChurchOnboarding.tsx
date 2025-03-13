import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useMessageStore } from '../../components/MessageHandler';
import { Card, CardContent } from '../../components/ui2/card';
import { Progress } from '../../components/ui2/progress';
import { Badge } from '../../components/ui2/badge';
import {
  Building2,
  UserPlus,
  Database,
  CheckCircle2,
  Loader2,
  Tag,
} from 'lucide-react';

function ChurchOnboarding() {
  const navigate = useNavigate();
  const { addMessage } = useMessageStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [isComplete, setIsComplete] = useState(false);

  const steps = [
    {
      title: 'Creating Church Account',
      description: 'Setting up your church profile and configuration',
      icon: Building2,
    },
    {
      title: 'Setting Up Admin User',
      description: 'Creating your administrator account with proper permissions',
      icon: UserPlus,
    },
    {
      title: 'Initializing Database',
      description: 'Preparing your database and initial settings',
      icon: Database,
    },
    {
      title: 'Setting Up Categories',
      description: 'Configuring membership types, transaction categories, and more',
      icon: Tag,
    },
    {
      title: 'Completing Setup',
      description: 'Finalizing your church administration system',
      icon: CheckCircle2,
    },
  ];

  useEffect(() => {
    // Get registration data from session storage
    const data = sessionStorage.getItem('registrationData');
    if (!data) {
      navigate('/register');
      return;
    }

    const parsedData = JSON.parse(data);
    setRegistrationData(parsedData);
    handleRegistration(parsedData);
  }, [navigate]);

  const handleRegistration = async (data: any) => {
    try {
      // Step 1: Creating Church Account
      setCurrentStep(0);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Setting Up Admin User
      setCurrentStep(1);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Initializing Database
      setCurrentStep(2);
      
      // Create tenant with categories
      const { error: tenantError } = await supabase.rpc('handle_new_tenant_registration', {
        p_user_id: data.userId,
        p_tenant_name: data.churchName,
        p_tenant_subdomain: data.subdomain,
        p_tenant_address: data.address,
        p_tenant_contact: data.contactNumber,
        p_tenant_email: data.churchEmail,
        p_tenant_website: data.website || null
      });

      if (tenantError) {
        // If tenant creation fails, delete the user
        await supabase.auth.signOut();
        throw tenantError;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 4: Setting Up Categories
      setCurrentStep(3);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 5: Completing Setup
      setCurrentStep(4);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Clear registration data
      sessionStorage.removeItem('registrationData');

      // Show success message
      addMessage({
        type: 'success',
        text: 'Church setup completed successfully! Please check your email to verify your account.',
        duration: 5000,
      });

      setIsComplete(true);

      // Redirect to login
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Registration error:', error);
      
      // Show error message
      addMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'An error occurred during setup',
        duration: 5000,
      });

      // Clean up on failure
      try {
        // Sign out to remove auth session
        await supabase.auth.signOut();
        
        // Clear registration data
        sessionStorage.removeItem('registrationData');
        
        // Navigate back to register page
        navigate('/register');
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }
  };

  if (!registrationData) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="relative mx-auto h-12 w-12">
              <Building2 className={`
                absolute inset-0 h-12 w-12 text-primary
                transition-all duration-500 transform
                ${isComplete ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}
              `} />
              <CheckCircle2 className={`
                absolute inset-0 h-12 w-12 text-success
                transition-all duration-500 transform
                ${isComplete ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
              `} />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              {isComplete ? 'Setup Complete!' : 'Setting Up Your Church'}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {isComplete
                ? 'Your church administration system is ready to use'
                : 'Please wait while we prepare your church administration system'}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="space-y-8">
            {steps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = index < currentStep || isComplete;

              return (
                <div key={index} className="relative">
                  {/* Step content */}
                  <div className="flex items-start">
                    <div className={`
                      relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full
                      ${isCompleted 
                        ? 'bg-success text-success-foreground'
                        : isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                      }
                    `}>
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : isActive ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <step.icon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="ml-4 min-w-0 flex-1">
                      <div className="flex items-center">
                        <p className={`
                          text-sm font-medium
                          ${isCompleted 
                            ? 'text-success' 
                            : isActive
                            ? 'text-primary'
                            : 'text-muted-foreground'
                          }
                        `}>
                          {step.title}
                        </p>
                        {isActive && (
                          <Badge variant="secondary" className="ml-2">
                            In Progress
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-4 top-9 -ml-px h-full w-0.5">
                      <div className={`h-full w-0.5 ${
                        isCompleted ? 'bg-success' : 'bg-muted'
                      }`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Overall Progress */}
          <div className="mt-8">
            <Progress 
              value={(currentStep / (steps.length - 1)) * 100}
              className="h-2"
            />
          </div>

          {/* Completion Message */}
          {isComplete && (
            <div className="mt-8 text-center animate-fade-in">
              <p className="text-sm text-muted-foreground">
                You will be redirected to the login page in a moment...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ChurchOnboarding;