import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useMessageStore } from '../../components/MessageHandler';
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  UserPlus,
} from 'lucide-react';

type UserFormData = {
  email: string;
  password: string;
  roles: string[];
  first_name: string;
  last_name: string;
};

const UserForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addMessage } = useMessageStore();
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    roles: [],
    first_name: '',
    last_name: '',
  });

  // Get current tenant
  const { data: currentTenant } = useQuery({
    queryKey: ['current-tenant'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_current_tenant');
      if (error) throw error;
      return data?.[0];
    },
  });

  // Fetch user data if editing
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      if (!id) return null;

      // Get user details using the secure function
      const { data, error: userError } = await supabase.rpc('manage_user', {
        operation: 'get',
        target_user_id: id
      });

      if (userError) throw userError;
      if (!data) throw new Error('User not found');

      // Get user roles
      const { data: rolesData, error: rolesError } = await supabase.rpc('get_user_roles_with_permissions', {
        target_user_id: id
      });

      if (rolesError) throw rolesError;

      return {
        ...data,
        roles: rolesData?.map(r => r.role_name) || [],
      };
    },
    enabled: !!id,
  });

  // Fetch available roles
  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        email: userData.email,
        password: '',
        roles: userData.roles || [],
        first_name: userData.raw_user_meta_data?.first_name || '',
        last_name: userData.raw_user_meta_data?.last_name || '',
      });
    }
  }, [userData]);

  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      if (!currentTenant?.id) {
        throw new Error('No tenant found');
      }

      // Create user with proper tenant and role assignment
      const { data: newUser, error } = await supabase.rpc('handle_user_creation', {
        p_email: data.email,
        p_password: data.password,
        p_tenant_id: currentTenant.id,
        p_roles: data.roles,
        p_first_name: data.first_name,
        p_last_name: data.last_name,
        p_admin_role: data.roles.includes('admin') ? 'tenant_admin' : 'member'
      });

      if (error) throw error;
      return newUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-users'] });
      addMessage({
        type: 'success',
        text: 'User created successfully',
        duration: 3000,
      });
      navigate('/admin/users');
    },
    onError: (error: Error) => {
      addMessage({
        type: 'error',
        text: error.message,
        duration: 5000,
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      if (!id) return;

      const { error: updateError } = await supabase.rpc('manage_user', {
        operation: 'update',
        target_user_id: id,
        user_data: {
          password: data.password || undefined,
          roles: data.roles,
        }
      });

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-users'] });
      addMessage({
        type: 'success',
        text: 'User updated successfully',
        duration: 3000,
      });
      navigate('/admin/users');
    },
    onError: (error: Error) => {
      addMessage({
        type: 'error',
        text: error.message,
        duration: 5000,
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id && !formData.email) {
      addMessage({
        type: 'error',
        text: 'Email is required',
        duration: 5000,
      });
      return;
    }

    if (!id && !formData.password) {
      addMessage({
        type: 'error',
        text: 'Password is required for new users',
        duration: 5000,
      });
      return;
    }

    if (!id && formData.password.length < 6) {
      addMessage({
        type: 'error',
        text: 'Password must be at least 6 characters long',
        duration: 5000,
      });
      return;
    }

    try {
      if (id) {
        await updateUserMutation.mutateAsync(formData);
      } else {
        await createUserMutation.mutateAsync(formData);
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  if (userLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/users')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Users
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {id ? 'Edit User' : 'Create New User'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {id
              ? 'Update user details and role assignments'
              : 'Add a new user to the system'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="border-t border-gray-200">
          <div className="px-4 py-5 sm:px-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address {!id && '*'}
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required={!id}
                  disabled={!!id}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-100"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  type="text"
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  {id ? 'New Password (optional)' : 'Password *'}
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required={!id}
                  minLength={6}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder={id ? 'Leave blank to keep current password' : '••••••'}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Roles
                </label>
                <div className="mt-2 space-y-2">
                  {roles?.map((role) => (
                    <div key={role.id} className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id={`role-${role.id}`}
                          type="checkbox"
                          checked={formData.roles.includes(role.name)}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              roles: e.target.checked
                                ? [...prev.roles, role.name]
                                : prev.roles.filter((name) => name !== role.name),
                            }));
                          }}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label
                          htmlFor={`role-${role.id}`}
                          className="font-medium text-gray-700"
                        >
                          {role.name}
                        </label>
                        {role.description && (
                          <p className="text-gray-500">{role.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/admin/users')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createUserMutation.isPending || updateUserMutation.isPending}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {createUserMutation.isPending || updateUserMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    Saving...
                  </>
                ) : id ? (
                  <>
                    <Save className="-ml-1 mr-2 h-5 w-5" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <UserPlus className="-ml-1 mr-2 h-5 w-5" />
                    Create User
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;