import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import Select from 'react-select';
import { supabase } from '../../lib/supabase';
import { useMessageStore } from '../../components/MessageHandler';
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  UserPlus,
} from 'lucide-react';

type UserFormData = {
  email: string;
  password: string;
  roles: string[];
  member_id?: string;
};

type Member = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
};

type SelectOption = {
  value: string;
  label: string;
};

function UserForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addMessage } = useMessageStore();
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    roles: [],
    member_id: undefined,
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

      // Get associated member
      const { data: members, error: memberError } = await supabase
        .from('members')
        .select('id, first_name, last_name, email')
        .eq('email', data.email);

      if (memberError) throw memberError;

      const member = members?.[0];

      return {
        ...data,
        roles: rolesData?.map(r => r.role_id) || [],
        member_id: member?.id,
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

  // Fetch available members
  const { data: availableMembers, isLoading: membersLoading } = useQuery({
    queryKey: ['available-members', id],
    queryFn: async () => {
      const { data: members, error } = await supabase
        .from('members')
        .select('id, first_name, last_name, email')
        .is('deleted_at', null)
        .not('email', 'is', null)
        .order('first_name');

      if (error) throw error;

      // Get all users
      const { data: users } = await supabase.rpc('manage_user', {
        operation: 'get'
      });

      // Create a set of emails that are already assigned to users
      const userEmails = new Set((users as any[])?.map(u => u.email.toLowerCase()));
      
      // If editing, remove current user's email from the exclusion list
      if (id && userData?.email) {
        userEmails.delete(userData.email.toLowerCase());
      }

      // Filter out members that already have users
      return members.filter(m => m.email && !userEmails.has(m.email.toLowerCase()));
    },
  });

  React.useEffect(() => {
    if (userData) {
      setFormData({
        email: userData.email,
        password: '',
        roles: userData.roles || [],
        member_id: userData.member_id,
      });
    }
  }, [userData]);

  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      // Get member's email if member_id is provided
      let email = data.email;
      if (data.member_id) {
        const { data: members, error: memberError } = await supabase
          .from('members')
          .select('email')
          .eq('id', data.member_id);

        if (memberError) throw memberError;
        if (!members || members.length === 0) throw new Error('Selected member not found');
        if (!members[0].email) throw new Error('Selected member has no email address');
        email = members[0].email;
      }

      // Create user using the secure function
      const { data: newUser, error: createError } = await supabase.rpc('manage_user', {
        operation: 'create',
        user_data: {
          email,
          password: data.password,
          roles: data.roles,
        }
      });

      if (createError) throw createError;
      return newUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
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

      // Update user using the secure function
      const { data: updatedUser, error: updateError } = await supabase.rpc('manage_user', {
        operation: 'update',
        target_user_id: id,
        user_data: {
          password: data.password || undefined,
          roles: data.roles,
        }
      });

      if (updateError) throw updateError;
      return updatedUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
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
    
    if (!id && !formData.email && !formData.member_id) {
      addMessage({
        type: 'error',
        text: 'Please provide either an email or select a member',
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

  // Show loading state
  if (userLoading || membersLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const memberOptions: SelectOption[] = availableMembers?.map(member => ({
    value: member.id,
    label: `${member.first_name} ${member.last_name} (${member.email})`,
  })) || [];

  // If editing, add the current member to the options if it exists
  if (id && userData?.member_id) {
    const currentMember = availableMembers?.find(m => m.id === userData.member_id);
    if (currentMember && !memberOptions.some(opt => opt.value === currentMember.id)) {
      memberOptions.unshift({
        value: currentMember.id,
        label: `${currentMember.first_name} ${currentMember.last_name} (${currentMember.email})`,
      });
    }
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
              {!id && (
                <>
                  <div className="sm:col-span-2">
                    <label htmlFor="member" className="block text-sm font-medium text-gray-700">
                      Assign to Member
                    </label>
                    <div className="mt-1">
                      <Select
                        id="member"
                        value={memberOptions.find(opt => opt.value === formData.member_id)}
                        onChange={(option) => {
                          const member = availableMembers?.find(m => m.id === option?.value);
                          setFormData(prev => ({
                            ...prev,
                            member_id: option?.value,
                            email: member?.email || prev.email,
                          }));
                        }}
                        options={memberOptions}
                        isClearable
                        isSearchable
                        placeholder="Select a member to assign this user account to..."
                        className="react-select-container"
                        classNamePrefix="react-select"
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Optional. If selected, the member's email will be used for the user account.
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address {!formData.member_id && '*'}
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required={!formData.member_id}
                      disabled={!!formData.member_id}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-100"
                      placeholder="user@example.com"
                    />
                  </div>
                </>
              )}

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
                          checked={formData.roles.includes(role.id)}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              roles: e.target.checked
                                ? [...prev.roles, role.id]
                                : prev.roles.filter((id) => id !== role.id),
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
                ) : (
                  <>
                    {id ? (
                      <Save className="-ml-1 mr-2 h-5 w-5" />
                    ) : (
                      <UserPlus className="-ml-1 mr-2 h-5 w-5" />
                    )}
                    {id ? 'Save Changes' : 'Create User'}
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

export default UserForm;