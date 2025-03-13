import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import Users from './Users';
import UserForm from './UserForm';
import Roles from './Roles';
import RoleForm from './RoleForm';
import DatabaseManagement from './DatabaseManagement';
import ChurchSettings from './ChurchSettings';
import Categories from './Categories';

function Admin() {
  const { hasPermission, isAdmin } = usePermissions();

  // Check if user has access to any admin features
  const hasAccess = hasPermission('user.view') || 
                   hasPermission('role.view') || 
                   hasPermission('database.view') ||
                   isAdmin();

  if (!hasAccess) {
    return (
      <div className="text-center py-8">
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          You don't have permission to access this section
        </h3>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="users" element={<Users />} />
      <Route path="users/new" element={<UserForm />} />
      <Route path="users/:id/edit" element={<UserForm />} />
      <Route path="roles" element={<Roles />} />
      <Route path="roles/new" element={<RoleForm />} />
      <Route path="roles/:id/edit" element={<RoleForm />} />
      <Route path="databases" element={<DatabaseManagement />} />
      <Route path="settings" element={<ChurchSettings />} />
      <Route path="categories" element={<Categories />} />
      <Route path="*" element={<Navigate to="/admin/users" replace />} />
    </Routes>
  );
}

export default Admin;