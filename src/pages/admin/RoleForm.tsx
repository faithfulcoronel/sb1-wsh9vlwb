import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useMessageStore } from '../../components/MessageHandler';
import {
  Save,
  Loader2,
  ArrowLeft,
  Shield,
} from 'lucide-react';

type Permission = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  module: string;
};

type Role = {
  id: string;
  name: string;
  description: string | null;
  permissions: {
    permission: Permission;
  }[];
};

function RoleForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addMessage } = useMessageStore();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  });

  // Fetch role data if editing
  const { data: role, isLoading: roleLoading } = useQuery({
    queryKey: ['role', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('roles')
        .select(`
          *,
          permissions:role_permissions (
            permission:permissions (
              id,
              code,
              name,
              description,
              module
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Role;
    },
    enabled: !!id,
  });

  // Fetch all available permissions
  const { data: permissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('module, name');

      if (error) throw error;
      return data as Permission[];
    },
  });

  // Group permissions by module
  const groupedPermissions = permissions?.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>) ?? {};

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description || '',
        permissions: role.permissions.map((rp) => rp.permission.id),
      });
    }
  }, [role]);

  const createRoleMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Create the role
      const { data: newRole, error: roleError } = await supabase
        .from('roles')
        .insert([{
          name: data.name.toLowerCase(),
          description: data.description || null,
        }])
        .select()
        .single();

      if (roleError) throw roleError;

      // Get current user for created_by field
      const currentUser = (await supabase.auth.getUser()).data.user;

      // Assign permissions to the role
      if (data.permissions.length > 0) {
        const permissionAssignments = data.permissions.map((permissionId) => ({
          role_id: newRole.id,
          permission_id: permissionId,
          created_by: currentUser?.id,
        }));

        const { error: permissionsError } = await supabase
          .from('role_permissions')
          .insert(permissionAssignments);

        if (permissionsError) throw permissionsError;
      }

      return newRole;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      addMessage({
        type: 'success',
        text: 'Role created successfully',
        duration: 3000,
      });
      navigate('/admin/roles');
    },
    onError: (error: Error) => {
      addMessage({
        type: 'error',
        text: error.message,
        duration: 5000,
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!id) return;

      // Get current user for created_by field
      const currentUser = (await supabase.auth.getUser()).data.user;

      // Update role details
      const { error: roleError } = await supabase
        .from('roles')
        .update({
          name: data.name.toLowerCase(),
          description: data.description || null,
        })
        .eq('id', id);

      if (roleError) throw roleError;

      // Update role permissions
      // First, remove existing permissions
      const { error: deleteError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', id);

      if (deleteError) throw deleteError;

      // Then add new permissions
      if (data.permissions.length > 0) {
        const permissionAssignments = data.permissions.map((permissionId) => ({
          role_id: id,
          permission_id: permissionId,
          created_by: currentUser?.id,
        }));

        const { error: permissionsError } = await supabase
          .from('role_permissions')
          .insert(permissionAssignments);

        if (permissionsError) throw permissionsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      addMessage({
        type: 'success',
        text: 'Role updated successfully',
        duration: 3000,
      });
      navigate('/admin/roles');
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
    
    if (!formData.name) {
      addMessage({
        type: 'error',
        text: 'Role name is required',
        duration: 5000,
      });
      return;
    }

    try {
      if (id) {
        await updateRoleMutation.mutateAsync(formData);
      } else {
        await createRoleMutation.mutateAsync(formData);
      }
    } catch (error) {
      console.error('Error saving role:', error);
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((id) => id !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  const handleModuleToggle = (module: string) => {
    const modulePermissionIds = groupedPermissions[module].map((p) => p.id);
    const allModulePermissionsSelected = modulePermissionIds.every((id) =>
      formData.permissions.includes(id)
    );

    setFormData((prev) => ({
      ...prev,
      permissions: allModulePermissionsSelected
        ? prev.permissions.filter((id) => !modulePermissionIds.includes(id))
        : [...new Set([...prev.permissions, ...modulePermissionIds])],
    }));
  };

  if (roleLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/roles')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Roles
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {id ? 'Edit Role' : 'Create New Role'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {id
              ? 'Update role details and permission assignments'
              : 'Define a new role and assign permissions'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="border-t border-gray-200">
          <div className="px-4 py-5 sm:px-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Role Name *
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Permissions
                </label>
                <div className="mt-4 space-y-6">
                  {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
                    <div key={module} className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`module-${module}`}
                          checked={modulePermissions.every((p) =>
                            formData.permissions.includes(p.id)
                          )}
                          onChange={() => handleModuleToggle(module)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor={`module-${module}`}
                          className="ml-3 text-sm font-medium text-gray-700"
                        >
                          {module.charAt(0).toUpperCase() + module.slice(1)}
                        </label>
                      </div>
                      <div className="ml-7 space-y-2">
                        {modulePermissions.map((permission) => (
                          <div key={permission.id} className="flex items-start">
                            <div className="flex items-center h-5">
                              <input
                                type="checkbox"
                                id={`permission-${permission.id}`}
                                checked={formData.permissions.includes(permission.id)}
                                onChange={() => handlePermissionToggle(permission.id)}
                                className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label
                                htmlFor={`permission-${permission.id}`}
                                className="font-medium text-gray-700"
                              >
                                {permission.name}
                              </label>
                              {permission.description && (
                                <p className="text-gray-500">
                                  {permission.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/admin/roles')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {createRoleMutation.isPending || updateRoleMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="-ml-1 mr-2 h-5 w-5" />
                    {id ? 'Save Changes' : 'Create Role'}
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

export default RoleForm;