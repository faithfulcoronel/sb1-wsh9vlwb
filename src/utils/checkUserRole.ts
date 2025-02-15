import { supabase } from '../lib/supabase';

export async function checkUserRoles() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.log('No user logged in');
    return;
  }

  // Get user roles
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select(`
      role:roles (
        id,
        name,
        description
      )
    `)
    .eq('user_id', user.id);

  if (rolesError) {
    console.error('Error fetching roles:', rolesError);
    return;
  }

  console.log('User Roles:', userRoles?.map(ur => ur.role));

  // Get role permissions
  if (userRoles?.length) {
    const roleIds = userRoles.map(ur => ur.role.id);
    const { data: permissions, error: permissionsError } = await supabase
      .from('role_permissions')
      .select(`
        permission:permissions (
          id,
          code,
          name,
          description,
          module
        )
      `)
      .in('role_id', roleIds);

    if (permissionsError) {
      console.error('Error fetching permissions:', permissionsError);
      return;
    }

    console.log('User Permissions:', permissions?.map(rp => rp.permission));
  }
}