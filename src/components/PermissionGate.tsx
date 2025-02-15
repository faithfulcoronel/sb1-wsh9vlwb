import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

type PermissionGateProps = {
  permission?: string;
  role?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

function PermissionGate({ permission, role, children, fallback = null }: PermissionGateProps) {
  const { hasPermission, hasRole, isLoading } = usePermissions();

  if (isLoading) {
    return null;
  }

  const hasAccess = 
    (permission ? hasPermission(permission) : true) &&
    (role ? hasRole(role) : true);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

export default PermissionGate;