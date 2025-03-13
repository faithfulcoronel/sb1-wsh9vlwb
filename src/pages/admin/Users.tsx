import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import PermissionGate from '../../components/PermissionGate';
import { usePermissions } from '../../hooks/usePermissions';
import { useMessageStore } from '../../components/MessageHandler';
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Search,
  Filter,
} from 'lucide-react';

type User = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  roles: any[];
};

function Users() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const { addMessage } = useMessageStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Get current tenant ID
  const { data: currentTenant } = useQuery({
    queryKey: ['current-tenant'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_current_tenant');

      if (error) throw error;
      return data?.[0];
    },
  });

  // Get users for current tenant
  const { data: users, isLoading } = useQuery({
    queryKey: ['tenant-users', currentTenant?.id],
    queryFn: async () => {
      if (!currentTenant?.id) return [];

      const { data: users, error } = await supabase
        .rpc('get_tenant_users', { p_tenant_id: currentTenant.id });

      if (error) throw error;

      // Get roles for each user
      const usersWithRoles = await Promise.all(
        users.map(async (user) => {
          const { data: roles, error: rolesError } = await supabase
            .rpc('get_user_roles_with_permissions', { target_user_id: user.id });

          if (rolesError) throw rolesError;

          return {
            ...user,
            roles: roles || [],
          };
        })
      );

      return usersWithRoles;
    },
    enabled: !!currentTenant?.id && hasPermission('user.view'),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc('manage_user', {
        operation: 'delete',
        target_user_id: userId
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-users'] });
      addMessage({
        type: 'success',
        text: 'User deleted successfully',
        duration: 3000,
      });
      setUserToDelete(null);
    },
    onError: (error: Error) => {
      addMessage({
        type: 'error',
        text: 'Failed to delete user',
        duration: 5000,
      });
      console.error('Error deleting user:', error);
      setUserToDelete(null);
    },
  });

  const handleDelete = async (user: User) => {
    setUserToDelete(user);
    addMessage({
      type: 'warning',
      text: `Are you sure you want to delete ${user.email}?`,
      duration: 0, // Don't auto-dismiss
    });
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      try {
        await deleteUserMutation.mutateAsync(userToDelete.id);
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleEdit = (user: User) => {
    navigate(`/admin/users/${user.id}/edit`);
  };

  const filteredUsers = users?.filter((user) => {
    if (!user) return false;

    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all users in your church including their roles and permissions.
          </p>
        </div>
        <PermissionGate permission="user.create">
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Link
              to="/admin/users/new"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Link>
          </div>
        </PermissionGate>
      </div>

      <div className="mt-6">
        <div className="relative max-w-xs">
          <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : filteredUsers && filteredUsers.length > 0 ? (
        <div className="mt-8 flex flex-col">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Email
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Roles
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Created At
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Last Sign In
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {user.email}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex flex-wrap gap-1">
                            {user.roles.map((ur, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                              >
                                {ur.role_name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {user.last_sign_in_at
                            ? new Date(user.last_sign_in_at).toLocaleDateString()
                            : 'Never'}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex justify-end space-x-2">
                            <PermissionGate permission="user.edit">
                              <button
                                className="text-primary-600 hover:text-primary-900"
                                onClick={() => handleEdit(user)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                            </PermissionGate>
                            <PermissionGate permission="user.delete">
                              <button
                                className="text-red-600 hover:text-red-900"
                                onClick={() => handleDelete(user)}
                                disabled={deleteUserMutation.isPending}
                              >
                                {deleteUserMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </PermissionGate>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-white shadow sm:rounded-lg mt-8">
          <p className="text-sm text-gray-500">
            {searchTerm
              ? 'No users found matching your search criteria'
              : 'No users found. Add your first user by clicking the "Add User" button above.'}
          </p>
        </div>
      )}

      {/* Confirmation Dialog */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Delete User
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete {userToDelete.email}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteUserMutation.isPending}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {deleteUserMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;