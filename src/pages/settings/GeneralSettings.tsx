// src/pages/settings/GeneralSettings.tsx
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useMessageStore } from '../../components/MessageHandler';
import { Card, CardHeader, CardContent } from '../../components/ui2/card';
import { Input } from '../../components/ui2/input';
import { Button } from '../../components/ui2/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui2/select';
import { DollarSign, Lock, Mail, Save } from 'lucide-react';
import CurrencySelector from '../../components/CurrencySelector';

function GeneralSettings() {
  const { user } = useAuthStore();
  const { addMessage } = useMessageStore();
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  const updatePasswordMutation = useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      // First verify the current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // If current password is correct, update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      addMessage({
        type: 'success',
        text: 'Password updated successfully',
        duration: 3000,
      });
      setNewPassword('');
      setCurrentPassword('');
    },
    onError: (error: Error) => {
      addMessage({
        type: 'error',
        text: error.message,
        duration: 5000,
      });
    }
  });

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 8) {
      addMessage({
        type: 'error',
        text: 'New password must be at least 8 characters long',
        duration: 5000,
      });
      return;
    }

    if (currentPassword === newPassword) {
      addMessage({
        type: 'error',
        text: 'New password must be different from current password',
        duration: 5000,
      });
      return;
    }

    try {
      await updatePasswordMutation.mutateAsync({ currentPassword, newPassword });
    } catch (error) {
      console.error('Error updating password:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Currency Settings */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium flex items-center">
            <DollarSign className="h-5 w-5 text-muted-foreground mr-2" />
            Currency Settings
          </h3>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <CurrencySelector />
          </div>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium flex items-center">
            <Mail className="h-5 w-5 text-muted-foreground mr-2" />
            Account Settings
          </h3>
        </CardHeader>
        <CardContent>
          <div className="max-w-md space-y-6">
            {/* Email Display */}
            <Input
              label="Email Address"
              value={user?.email || ''}
              disabled
              icon={<Mail className="h-4 w-4" />}
              helperText="Your email address cannot be changed"
            />

            {/* Password Update Form */}
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <Input
                type="password"
                label="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                icon={<Lock className="h-4 w-4" />}
                placeholder="Enter your current password"
                showPasswordToggle
              />

              <Input
                type="password"
                label="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                icon={<Lock className="h-4 w-4" />}
                placeholder="Enter new password"
                helperText="Password must be at least 8 characters long"
                showPasswordToggle
              />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  loading={updatePasswordMutation.isPending}
                  icon={<Save className="h-4 w-4" />}
                >
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default GeneralSettings;
