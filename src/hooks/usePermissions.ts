import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useMessageStore } from '../components/MessageHandler';

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
};

export function usePermissions() {
  const { user } = useAuthStore();
  const { addMessage } = useMessageStore();

  // Get user roles and permissions in a single query
  const { data: userData, isLoading } = useQuery({
    queryKey: ['user-permissions', user?.id],
    queryFn: async () => {
      if (!user) return { roles: [], permissions: [] };

      try {
        // First get user roles with permissions
        const { data: userRoles, error: rolesError } = await supabase
          .rpc('get_user_roles_with_permissions', { target_user_id: user.id });

        if (rolesError) {
          console.error('Error fetching roles:', rolesError);
          addMessage({
            type: 'error',
            text: 'Failed to fetch user roles. Please try again later.',
            duration: 5000,
          });
          return { roles: [], permissions: [] };
        }

        // Extract unique permissions from all roles
        const uniquePermissions = new Map<string, Permission>();
        userRoles?.forEach((role) => {
          const permissions = role.permissions || [];
          permissions.forEach((permission: Permission) => {
            uniquePermissions.set(permission.code, permission);
          });
        });

        return {
          roles: userRoles || [],
          permissions: Array.from(uniquePermissions.values()),
        };
      } catch (error) {
        console.error('Error in usePermissions:', error);
        addMessage({
          type: 'error',
          text: 'An error occurred while fetching permissions',
          duration: 5000,
        });
        return { roles: [], permissions: [] };
      }
    },
    enabled: !!user,
    retry: 1,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const hasPermission = (permissionCode: string) => {
    if (isLoading || !userData) return false;
    return userData.permissions.some((p) => p.code === permissionCode);
  };

  const hasRole = (roleName: string) => {
    if (isLoading || !userData) return false;
    return userData.roles.some((r) => r.role_name.toLowerCase() === roleName.toLowerCase());
  };

  const isAdmin = () => {
    return hasRole('admin');
  };

  return {
    permissions: userData?.permissions || [],
    roles: userData?.roles || [],
    hasPermission,
    hasRole,
    isAdmin,
    isLoading,
  };
}