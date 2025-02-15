import React from 'react';
import { Link, useLocation, Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { usePermissions } from '../hooks/usePermissions';
import PermissionGate from './PermissionGate';
import {
  Home,
  Users,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  ChevronDown,
  Shield,
  UserCog,
  Database,
} from 'lucide-react';

function Layout() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const location = useLocation();
  const { user, signOut } = useAuthStore();
  const { hasPermission, isAdmin } = usePermissions();
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: Home,
      permission: null 
    },
    { 
      name: 'Members', 
      href: '/members', 
      icon: Users,
      permission: 'member.view' 
    },
    { 
      name: 'Finances', 
      href: '/finances', 
      icon: DollarSign,
      permission: 'finance.view' 
    },
    { 
      name: 'Settings', 
      href: '/settings', 
      icon: Settings,
      permission: null 
    },
  ];

  const adminNavigation = [
    {
      name: 'Users',
      href: '/admin/users',
      icon: UserCog,
      permission: 'user.view'
    },
    {
      name: 'Roles',
      href: '/admin/roles',
      icon: Shield,
      permission: 'role.view'
    },
    {
      name: 'Databases',
      href: '/admin/databases',
      icon: Database,
      permission: 'database.view'
    }
  ];

  // Check if any admin menu items are accessible
  const hasAdminAccess = adminNavigation.some(item => 
    !item.permission || hasPermission(item.permission) || isAdmin()
  );

  const renderNavLink = (item: typeof navigation[0]) => (
    <PermissionGate
      key={item.name}
      permission={item.permission}
    >
      <Link
        to={item.href}
        onClick={() => setSidebarOpen(false)}
        className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${
          location.pathname.startsWith(item.href)
            ? 'bg-primary-100 text-primary-600'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        {React.createElement(item.icon, {
          className: `mr-3 h-5 w-5 flex-shrink-0 ${
            location.pathname.startsWith(item.href)
              ? 'text-primary-600'
              : 'text-gray-400 group-hover:text-gray-500'
          }`,
        })}
        {item.name}
      </Link>
    </PermissionGate>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 flex-shrink-0 items-center px-4">
            <h1 className="text-xl font-bold text-primary-600">Church Admin</h1>
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto">
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigation.map(renderNavLink)}

              {/* Admin Section */}
              {hasAdminAccess && (
                <div className="relative">
                  <div
                    className="relative mt-6 flex items-center px-2"
                    aria-hidden="true"
                  >
                    <div className="flex-grow border-t border-gray-200" />
                    <span className="mx-2 flex items-center text-sm font-medium text-gray-500">
                      Admin
                    </span>
                    <div className="flex-grow border-t border-gray-200" />
                  </div>

                  {adminNavigation.map(renderNavLink)}
                </div>
              )}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
          <div className="flex h-16 flex-shrink-0 items-center px-4">
            <h1 className="text-xl font-bold text-primary-600">Church Admin</h1>
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto">
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigation.map(renderNavLink)}

              {/* Admin Section */}
              {hasAdminAccess && (
                <div className="relative">
                  <div
                    className="relative mt-6 flex items-center px-2"
                    aria-hidden="true"
                  >
                    <div className="flex-grow border-t border-gray-200" />
                    <span className="mx-2 flex items-center text-sm font-medium text-gray-500">
                      Admin
                    </span>
                    <div className="flex-grow border-t border-gray-200" />
                  </div>

                  {adminNavigation.map(renderNavLink)}
                </div>
              )}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content wrapper */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-40 flex h-16 flex-shrink-0 bg-white shadow">
          <button
            type="button"
            className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 justify-end px-4">
            <div className="ml-4 flex items-center md:ml-6">
              {/* Profile dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  className="flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  onClick={() => setProfileOpen(!profileOpen)}
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-medium">
                        {user?.email?.[0].toUpperCase()}
                      </span>
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-700 hidden sm:block">
                      {user?.email}
                    </span>
                    <ChevronDown
                      className={`ml-2 h-5 w-5 text-gray-400 transition-transform duration-200 ${
                        profileOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <Link
                      to="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Settings className="mr-3 h-5 w-5 text-gray-400" />
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        signOut();
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="mr-3 h-5 w-5 text-gray-400" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;