import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useMessageStore } from '../../components/MessageHandler';
import { Card, CardHeader, CardContent } from '../../components/ui2/card';
import { Input } from '../../components/ui2/input';
import { Button } from '../../components/ui2/button';
import { Separator } from '../../components/ui2/separator';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '../../components/ui2/alert-dialog';
import {
  Building2,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  Globe,
  Loader2,
} from 'lucide-react';

type RegistrationData = {
  // User Info
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  
  // Church Info
  churchName: string;
  subdomain: string;
  address: string;
  contactNumber: string;
  churchEmail: string;
  website: string;
};

function Register() {
  const navigate = useNavigate();
  const { addMessage } = useMessageStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<RegistrationData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    churchName: '',
    subdomain: '',
    address: '',
    contactNumber: '',
    churchEmail: '',
    website: '',
  });

  const validateForm = () => {
    // Email validation
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Password validation
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (!/[A-Z]/.test(formData.password)) {
      setError('Password must contain at least one uppercase letter');
      return false;
    }

    if (!/[a-z]/.test(formData.password)) {
      setError('Password must contain at least one lowercase letter');
      return false;
    }

    if (!/[0-9]/.test(formData.password)) {
      setError('Password must contain at least one number');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    // Name validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('Please enter your full name');
      return false;
    }

    // Church validation
    if (!formData.churchName.trim()) {
      setError('Please enter your church name');
      return false;
    }

    if (!formData.subdomain.trim()) {
      setError('Please enter a subdomain');
      return false;
    }

    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(formData.subdomain)) {
      setError('Subdomain can only contain lowercase letters, numbers, and hyphens');
      return false;
    }

    if (!formData.address.trim()) {
      setError('Please enter your church address');
      return false;
    }

    if (!formData.contactNumber.trim()) {
      setError('Please enter a contact number');
      return false;
    }

    if (!formData.churchEmail.trim()) {
      setError('Please enter a church email');
      return false;
    }

    if (!emailRegex.test(formData.churchEmail)) {
      setError('Please enter a valid church email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Create user account
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!user) throw new Error('Failed to create user account');

      // Store registration data and navigate to onboarding
      sessionStorage.setItem('registrationData', JSON.stringify({
        userId: user.id,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        churchName: formData.churchName,
        subdomain: formData.subdomain,
        address: formData.address,
        contactNumber: formData.contactNumber,
        churchEmail: formData.churchEmail,
        website: formData.website,
      }));

      // Navigate to onboarding progress screen
      navigate('/onboarding');
    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 bg-white">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader className="text-center space-y-2">
            <h2 className="text-3xl font-bold">
              Register Your Church
            </h2>
            <p className="text-sm text-muted-foreground">
              Or{' '}
              <Link
                to="/login"
                className="font-medium text-primary hover:text-primary/90"
              >
                sign in to your account
              </Link>
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Admin Account Section */}
              <div>
                <h3 className="text-lg font-medium mb-4">Admin Account</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      name="firstName"
                      label="First Name"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                      icon={<User />}
                    />

                    <Input
                      name="lastName"
                      label="Last Name"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                      icon={<User />}
                    />
                  </div>

                  <Input
                    type="email"
                    name="email"
                    label="Email Address"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    icon={<Mail />}
                  />

                  <Input
                    type="password"
                    name="password"
                    label="Password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    required
                    icon={<Lock />}
                    showPasswordToggle
                    helperText="Must be at least 8 characters with uppercase, lowercase, and numbers"
                  />

                  <Input
                    type="password"
                    name="confirmPassword"
                    label="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                    icon={<Lock />}
                    showPasswordToggle
                  />
                </div>
              </div>

              <Separator />

              {/* Church Information Section */}
              <div>
                <h3 className="text-lg font-medium mb-4">Church Information</h3>
                <div className="space-y-4">
                  <Input
                    name="churchName"
                    label="Church Name"
                    value={formData.churchName}
                    onChange={(e) => setFormData(prev => ({ ...prev, churchName: e.target.value }))}
                    required
                    icon={<Building2 />}
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      name="subdomain"
                      label="Subdomain"
                      value={formData.subdomain}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') 
                      }))}
                      required
                      pattern="[a-z0-9-]+"
                      icon={<Globe />}
                      rightElement={
                        <div className="px-3 py-2 bg-muted text-muted-foreground text-sm">
                          .stewardtrack.com
                        </div>
                      }
                      helperText="Only lowercase letters, numbers, and hyphens allowed"
                    />

                    <Input
                      name="website"
                      label="Church Website"
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      icon={<Globe />}
                      placeholder="https://example.com"
                    />
                  </div>

                  <Input
                    name="address"
                    label="Church Address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    required
                    icon={<MapPin />}
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      name="contactNumber"
                      label="Contact Number"
                      value={formData.contactNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                      required
                      icon={<Phone />}
                    />

                    <Input
                      type="email"
                      name="churchEmail"
                      label="Church Email"
                      value={formData.churchEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, churchEmail: e.target.value }))}
                      required
                      icon={<Mail />}
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Register Church'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Right side - Background Image */}
      <div className="hidden lg:block relative w-0 flex-1">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="\landing_bg.svg"
          alt="Church interior"
        />
        <div className="absolute inset-0 bg-primary-900 bg-opacity-50 backdrop-blur-sm"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-2xl mx-auto text-center text-white">
            <h1 className="text-4xl font-bold mb-4">Welcome to Steward Track</h1>
            <p className="text-xl">
              Streamline your church administration with our comprehensive management solution
            </p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-3xl mx-auto">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Member Management</h3>
                <p className="text-sm text-gray-100">
                  Efficiently manage your church members, track attendance, and maintain detailed profiles.
                </p>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Financial Tools</h3>
                <p className="text-sm text-gray-100">
                  Track tithes, offerings, and expenses with our comprehensive financial management system.
                </p>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Reporting & Analytics</h3>
                <p className="text-sm text-gray-100">
                  Generate detailed reports and gain insights into your church's growth and activities.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Dialog */}
      <AlertDialog open={!!error} onOpenChange={() => setError(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle variant="danger">
              Registration Error
            </AlertDialogTitle>
            <AlertDialogDescription>
              {error}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={() => setError(null)}>
            Try Again
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default Register;