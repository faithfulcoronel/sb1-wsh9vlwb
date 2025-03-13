import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useMessageStore } from '../../components/MessageHandler';
import {
  Building2,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Upload,
  Mail,
  Phone,
  Globe,
  MapPin,
} from 'lucide-react';

type Tenant = {
  id: string;
  name: string;
  address: string | null;
  contact_number: string | null;
  email: string | null;
  website: string | null;
  profile_picture_url: string | null;
  created_at: string;
  updated_at: string;
};

function ChurchSettings() {
  const queryClient = useQueryClient();
  const { addMessage } = useMessageStore();
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_current_tenant');

      if (error) throw error;
      return data?.[0] as Tenant;
    },
  });

  const updateTenantMutation = useMutation({
    mutationFn: async (updatedData: Partial<Tenant>) => {
      const { data, error } = await supabase
        .from('tenants')
        .update(updatedData)
        .eq('id', tenant?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-settings'] });
      addMessage({
        type: 'success',
        text: 'Church settings updated successfully',
        duration: 3000,
      });
    },
    onError: (error: Error) => {
      setError(error.message);
      setTimeout(() => setError(null), 5000);
    },
  });

  const uploadLogo = useMutation({
    mutationFn: async (file: File) => {
      if (!tenant?.id) {
        throw new Error('Tenant ID not found');
      }

      // First, try to delete any existing logo
      try {
        const { data: existingFiles } = await supabase.storage
          .from('tenant-logos')
          .list(tenant.id);

        if (existingFiles && existingFiles.length > 0) {
          await supabase.storage
            .from('tenant-logos')
            .remove(existingFiles.map(file => `${tenant.id}/${file.name}`));
        }
      } catch (error) {
        console.warn('Error cleaning up old logos:', error);
        // Continue with upload even if cleanup fails
      }

      // Upload new logo
      const fileExt = file.name.split('.').pop();
      const fileName = `${tenant.id}/${tenant.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('tenant-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('tenant-logos')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('tenants')
        .update({ profile_picture_url: publicUrl })
        .eq('id', tenant.id);

      if (updateError) throw updateError;

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-settings'] });
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
      addMessage({
        type: 'success',
        text: 'Logo updated successfully',
        duration: 3000,
      });
    },
    onError: (error: Error) => {
      setUploadError(error.message);
      addMessage({
        type: 'error',
        text: `Failed to upload logo: ${error.message}`,
        duration: 5000,
      });
      setTimeout(() => setUploadError(null), 3000);
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    uploadLogo.mutate(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const updatedData = {
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      contact_number: formData.get('contact_number') as string,
      email: formData.get('email') as string,
      website: formData.get('website') as string,
    };

    if (!updatedData.name) {
      setError('Church name is required');
      return;
    }

    try {
      await updateTenantMutation.mutateAsync(updatedData);
    } catch (error) {
      console.error('Error updating church settings:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Church Settings</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your church's information and configuration.
          </p>
        </div>
      </div>

      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
        <form onSubmit={handleSubmit}>
          <div className="px-4 py-5 sm:p-6">
            {/* Logo Upload */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700">
                Church Logo
              </label>
              <div className="mt-2 flex items-center space-x-6">
                <div className="relative">
                  {tenant?.profile_picture_url ? (
                    <img
                      src={tenant.profile_picture_url}
                      alt={tenant.name}
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center">
                      <Building2 className="h-12 w-12 text-primary-600" />
                    </div>
                  )}
                  <label
                    htmlFor="logo-upload"
                    className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50"
                  >
                    <Upload className="h-5 w-5 text-gray-600" />
                    <input
                      type="file"
                      id="logo-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileUpload}
                      ref={fileInputRef}
                    />
                  </label>
                </div>
                <div>
                  <p className="text-xs text-gray-500">
                    Upload a new logo (max 5MB)
                  </p>
                  {uploadError && (
                    <p className="mt-1 text-xs text-red-600">{uploadError}</p>
                  )}
                  {uploadSuccess && (
                    <p className="mt-1 text-xs text-green-600">
                      Logo updated successfully
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Church Information */}
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Church Name *
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <div className="relative flex items-stretch flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      defaultValue={tenant?.name}
                      className="block w-full rounded-md border-gray-300 pl-10 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <div className="relative flex items-stretch flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="address"
                      id="address"
                      defaultValue={tenant?.address || ''}
                      className="block w-full rounded-md border-gray-300 pl-10 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700">
                  Contact Number
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <div className="relative flex items-stretch flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="contact_number"
                      id="contact_number"
                      defaultValue={tenant?.contact_number || ''}
                      className="block w-full rounded-md border-gray-300 pl-10 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <div className="relative flex items-stretch flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      defaultValue={tenant?.email || ''}
                      className="block w-full rounded-md border-gray-300 pl-10 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                  Website
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <div className="relative flex items-stretch flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Globe className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="url"
                      name="website"
                      id="website"
                      defaultValue={tenant?.website || ''}
                      className="block w-full rounded-md border-gray-300 pl-10 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={updateTenantMutation.isPending}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {updateTenantMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="-ml-1 mr-2 h-5 w-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChurchSettings;