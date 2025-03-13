import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { UserCog, Shield, Building2, Tag } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { Card } from '../../components/ui/Card';

// Import admin pages
import Users from './Users';
import Roles from './Roles';
import ChurchSettings from './ChurchSettings';
import Categories from './Categories';

function Administration() {
  const location = useLocation();
  const { hasPermission } = usePermissions();

  // Define admin tabs with updated paths
  const adminTabs = [
    {
      id: 'users',
      label: 'Users',
      icon: <UserCog className="h-5 w-5" />,
      href: '/settings/administration/users',
      show: () => hasPermission('user.view')
    },
    {
      id: 'roles',
      label: 'Roles',
      icon: <Shield className="h-5 w-5" />,
      href: '/settings/administration/roles',
      show: () => hasPermission('role.view')
    },
    {
      id: 'church',
      label: 'Church Settings',
      icon: <Building2 className="h-5 w-5" />,
      href: '/settings/administration/church',
      show: () => hasPermission('user.view')
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: <Tag className="h-5 w-5" />,
      href: '/settings/administration/categories',
      show: () => hasPermission('user.view')
    }
  ].filter(tab => !tab.show || tab.show());

  const currentPath = location.pathname;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Sidebar */}
      <div className="w-full lg:w-64 flex-shrink-0">
        <Card>
          <nav className="p-2 space-y-1">
            {adminTabs.map((tab) => (
              <Link
                key={tab.id}
                to={tab.href}
                className={`
                  flex items-center px-3 py-2 text-sm font-medium rounded-md
                  transition-colors duration-200
                  ${currentPath.startsWith(tab.href)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                {React.cloneElement(tab.icon, {
                  className: `mr-3 h-5 w-5 ${
                    currentPath.startsWith(tab.href)
                      ? 'text-primary-500'
                      : 'text-gray-400'
                  }`
                })}
                {tab.label}
              </Link>
            ))}
          </nav>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <Card>
          <div className="p-6">
            <Routes>
              <Route path="users/*" element={<Users />} />
              <Route path="roles/*" element={<Roles />} />
              <Route path="church" element={<ChurchSettings />} />
              <Route path="categories" element={<Categories />} />
              <Route path="*" element={<Navigate to={adminTabs[0]?.href.split('/').pop() || 'users'} replace />} />
            </Routes>
          </div>
        </Card>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-50">
        <div className="grid grid-cols-4 gap-1 p-2">
          {adminTabs.map((tab) => (
            <Link
              key={tab.id}
              to={tab.href}
              className={`
                flex flex-col items-center justify-center p-2 rounded-md
                transition-colors duration-200
                ${currentPath.startsWith(tab.href)
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              {React.cloneElement(tab.icon, {
                className: `h-5 w-5 ${
                  currentPath.startsWith(tab.href)
                    ? 'text-primary-500'
                    : 'text-gray-400'
                }`
              })}
              <span className="text-xs mt-1">{tab.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Administration;