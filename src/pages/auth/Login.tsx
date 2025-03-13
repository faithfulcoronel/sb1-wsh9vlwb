import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader, CardContent } from '../../components/ui2/card';
import { Input } from '../../components/ui2/input';
import { Button } from '../../components/ui2/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '../../components/ui2/alert-dialog';
import { Building2, LogIn, Loader2, Mail, Lock } from 'lucide-react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMode, setResetMode] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;
      setResetSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center space-y-2">
            <h2 className="text-3xl font-bold">
              {resetMode ? 'Reset your password' : 'Sign in to your account'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {resetMode ? (
                'Enter your email to receive reset instructions'
              ) : (
                <>
                  Or{' '}
                  <Link
                    to="/register"
                    className="font-medium text-primary hover:text-primary/90"
                  >
                    register your church
                  </Link>
                </>
              )}
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={resetMode ? handleResetPassword : handleLogin} className="space-y-4">
              <div className="space-y-4">
                <Input
                  id="email-address"
                  name="email"
                  type="email"
                  label="Email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@email.com"
                  icon={<Mail className="h-5 w-5" />}
                />

                {!resetMode && (
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    label="Password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Password"
                    icon={<Lock className="h-5 w-5" />}
                    showPasswordToggle
                  />
                )}
              </div>

              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    setResetMode(!resetMode);
                    setError(null);
                    setResetSuccess(false);
                  }}
                  className="px-0"
                >
                  {resetMode ? 'Back to sign in' : 'Forgot your password?'}
                </Button>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : resetMode ? (
                  <>
                    <Mail className="h-5 w-5 mr-2" />
                    Send Reset Instructions
                  </>
                ) : (
                  <>
                    Sign In
                  </>
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
          src="/landing_bg.svg"
          alt="Church interior"
        />
        <div className="absolute inset-0 bg-primary-900 bg-opacity-50 backdrop-blur-sm"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-2xl mx-auto text-left text-white">
            <img className="h-12" src="/logo_long.svg" alt="Logo" />
            <br />
            <h1 className="text-7xl font-bold mb-4">Making church</h1>
            <h1 className="text-7xl font-bold mb-4">management</h1>
            <h1 className="text-7xl font-bold mb-4">much easier.</h1>
          </div>
        </div>
      </div>


      {/* Error Dialog */}
      <AlertDialog open={!!error} onOpenChange={() => setError(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle variant="danger">
              Authentication Error
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

      {/* Success Dialog */}
      <AlertDialog open={resetSuccess} onOpenChange={() => setResetSuccess(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle variant="success">
              Password Reset Email Sent
            </AlertDialogTitle>
            <AlertDialogDescription>
              Please check your email for password reset instructions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={() => setResetSuccess(false)}>
            Close
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default Login;