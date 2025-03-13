import React, { useState, useMemo } from 'react';
import { Link, useLocation, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { usePermissions } from '../hooks/usePermissions';
import PermissionGate from './PermissionGate';
import ChurchBranding from './ChurchBranding';
import { Button } from './ui2/button';
import { Input } from './ui2/input';
import { Separator } from './ui2/separator';
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './ui2/dropdown-menu';
import { Avatar } from './ui2/avatar';
import { Badge } from './ui2/badge';
import {
  Home,
  Users,
  DollarSign,
  Settings as SettingsIcon,
  LogOut,
  Menu as MenuIcon2,
  Building2,
  Crown,
  Sparkles,
  ChevronDown,
  ChevronRight,
  UserCog,
  Shield,
  Database,
  FileText,
  Bell,
  User,
  Key,
  CreditCard,
  HelpCircle,
  Search,
  Church,
} from 'lucide-react';

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { hasPermission } = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Get associated member data
  const { data: memberData } = useQuery({
    queryKey: ['current-user-member', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;

      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name, profile_picture_url')
        .eq('email', user.email)
        .is('deleted_at', null)
        .single();

      if (error) {
        console.error('Error fetching member data:', error);
        return null;
      }

      return data;
    },
    enabled: !!user?.email,
  });

  // Get current tenant subscription
  const { data: tenant } = useQuery({
    queryKey: ['tenant-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_current_tenant');
      if (error) throw error;
      return data?.[0];
    },
  });

  const navigation = [
    { 
      name: 'Dashboard', 
      icon: Home,
      permission: null,
      submenu: [
        {
          name: 'Church Overview',
          href: '/dashboard/church',
          icon: Building2,
        },
        {
          name: 'Personal Overview',
          href: '/dashboard/personal',
          icon: User,
        }
      ]
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
      permission: 'finance.view',
      submenu: [
        {
          name: 'Overview',
          href: '/finances',
          icon: FileText,
        },
        {
          name: 'Transactions',
          href: '/finances/transactions',
          icon: DollarSign,
        },
        {
          name: 'Budgets',
          href: '/finances/budgets',
          icon: FileText,
        },
        {
          name: 'Reports',
          href: '/finances/reports',
          icon: FileText,
        },
      ]
    },
  ];

  // Filter navigation items based on search term
  const filteredNavigation = useMemo(() => {
    if (!searchTerm) return navigation;

    const searchLower = searchTerm.toLowerCase();
    
    return navigation.filter(item => {
      // Check if main item matches
      const mainItemMatches = item.name.toLowerCase().includes(searchLower);
      
      // Check if any submenu items match
      const submenuMatches = item.submenu?.some(
        subitem => subitem.name.toLowerCase().includes(searchLower)
      );

      // Show item if either main item or any submenu items match
      return mainItemMatches || submenuMatches;
    }).map(item => {
      // If item has submenu, filter submenu items too
      if (item.submenu) {
        return {
          ...item,
          submenu: item.submenu.filter(
            subitem => subitem.name.toLowerCase().includes(searchLower)
          )
        };
      }
      return item;
    });
  }, [navigation, searchTerm]);

  const handleLogout = async () => {
    await useAuthStore.getState().signOut();
    navigate('/login');
  };

  // Check if current route is a settings page
  const isSettingsPage = location.pathname.startsWith('/settings');

  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* StewardTrack Logo */}
        <div className="flex-shrink-0 h-16 flex items-center justify-center px-4 bg-gray-900">
          <div className="flex items-center space-x-2">
            <img src="/logo_long.svg" alt="StewardTrack Logo with anme" />
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-4">
          <Input
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="h-4 w-4" />}
            className="bg-gray-800 border-gray-700 text-gray-300 placeholder-gray-500 focus:border-primary focus:ring-primary"
          />
        </div>

        <Separator className="bg-gray-800" />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          {filteredNavigation.map((item) => (
            <PermissionGate
              key={item.name}
              permission={item.permission}
            >
              {item.submenu ? (
                <div>
                  <button
                    onClick={() => setOpenSubmenu(openSubmenu === item.name ? null : item.name)}
                    className={`
                      w-full group flex items-center rounded-lg px-3 py-2 text-sm font-medium
                      transition-colors duration-200
                      ${location.pathname.startsWith(item.href)
                        ? 'bg-primary text-white'
                        : openSubmenu === item.name
                        ? 'bg-gray-800 text-gray-300'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }
                    `}
                  >
                    <div className="flex items-center flex-1">
                      <item.icon className={`
                        h-5 w-5 flex-shrink-0 transition-colors
                        ${location.pathname.startsWith(item.href)
                          ? 'text-white'
                          : 'text-gray-400 group-hover:text-white'
                        }
                      `} />
                      <span className="ml-3">{item.name}</span>
                    </div>
                    <ChevronRight className={`
                      h-4 w-4 transition-transform duration-200
                      ${openSubmenu === item.name ? 'rotate-90' : ''}
                      ${location.pathname.startsWith(item.href)
                        ? 'text-white'
                        : 'text-gray-400 group-hover:text-white'
                      }
                    `} />
                  </button>
                  {openSubmenu === item.name && item.submenu.length > 0 && (
                    <div className="ml-8 mt-2 space-y-1">
                      {item.submenu.map((subitem) => (
                        <Link
                          key={subitem.name}
                          to={subitem.href}
                          className={`
                            group flex items-center rounded-lg px-3 py-2 text-sm font-medium
                            transition-colors duration-200
                            ${location.pathname === subitem.href
                              ? 'bg-primary text-white'
                              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                            }
                          `}
                        >
                          <subitem.icon className={`
                            mr-3 h-4 w-4 flex-shrink-0 transition-colors
                            ${location.pathname === subitem.href
                              ? 'text-white'
                              : 'text-gray-400 group-hover:text-white'
                            }
                          `} />
                          {subitem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to={item.href}
                  className={`
                    group flex items-center rounded-lg px-3 py-2 text-sm font-medium
                    transition-colors duration-200
                    ${location.pathname.startsWith(item.href)
                      ? 'bg-primary text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }
                  `}
                >
                  <item.icon className={`
                    mr-3 h-5 w-5 flex-shrink-0 transition-colors
                    ${location.pathname.startsWith(item.href)
                      ? 'text-white'
                      : 'text-gray-400 group-hover:text-white'
                    }
                  `} />
                  {item.name}
                </Link>
              )}
            </PermissionGate>
          ))}

          {/* No results message */}
          {filteredNavigation.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">
              No menu items found
            </div>
          )}
        </nav>

        {/* Bottom Section - Fixed */}
        <div className="flex-shrink-0 border-t border-gray-800 p-4 space-y-4">
          {/* Subscribe Button */}
          <Link to="/settings/subscription" aria-label="Manage Subscription">
            <div
              className={`
                relative overflow-hidden rounded-xl group transition-all duration-300
                hover:shadow-2xl hover:-translate-y-1 hover:scale-105
                ${tenant?.subscription_tier === 'free'
                  ? 'bg-gradient-to-r from-primary-600 to-primary-400'
                  : 'bg-gradient-to-r from-primary-700 to-primary-500'
                }
              `}
            >
              {/* Animated Background Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-30 blur-lg animate-pulse" />

              {/* Subtle Hover Glow */}
              <div className="absolute inset-0 bg-white dark:bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300" />

              {/* Button Content */}
              <div className="relative px-5 py-3 flex items-center justify-between z-10">
                {/* Left Side: Icon + Text */}
                <div className="flex items-center space-x-3">
                  <Crown
                    className={`
                      h-5 w-5 text-white transition-all
                      ${tenant?.subscription_tier === 'free' ? 'animate-pulse' : ''}
                    `}
                  />
                  <div>
                    <p className="text-white font-semibold tracking-wide">
                      {tenant?.subscription_tier === 'free' ? 'Subscribe Now' : 'Upgrade Plan'}
                    </p>
                    <p className="text-xs text-white/80">
                      {tenant?.subscription_tier === 'free' ? 'Unlock premium features' : 'Explore more features'}
                    </p>
                  </div>
                </div>

                {/* Right Side: Sparkles Icon */}
                <Sparkles className="h-5 w-5 text-white opacity-75 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Animated Top Glow for Free Plan */}
              {tenant?.subscription_tier === 'free' && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-white to-yellow-400 animate-[shimmer_2s_infinite_linear]" />
              )}
            </div>
          </Link>


          {/* Settings Button - Updated with active state */}
          <Button
            variant="ghost"
            className={`
              w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800
              ${isSettingsPage ? 'bg-primary text-white' : ''}
            `}
            onClick={() => navigate('/settings')}
          >
            <SettingsIcon className={`h-5 w-5 mr-2 ${isSettingsPage ? 'text-white' : ''}`} />
            Settings
            {tenant?.subscription_tier === 'free' && (
              <Badge variant="primary" size="sm" className="ml-auto">
                Free
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-h-screen lg:pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-40 flex h-16 flex-shrink-0 bg-white border-b shadow-sm">
          <Button
            variant="ghost"
            className="border-r px-4 text-gray-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <MenuIcon2 className="h-6 w-6" />
          </Button>

          {/* Tenant Branding - Added pl-6 for spacing */}
          <div className="flex-1 pl-6 flex items-center">
            <ChurchBranding />
          </div>

          <div className="flex items-center px-4">
            <div className="ml-4 flex items-center md:ml-6">
              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex max-w-xs items-center rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="flex items-center gap-2">
                      {memberData?.profile_picture_url ? (
                        <Avatar
                          src={memberData.profile_picture_url}
                          alt={`${memberData.first_name} ${memberData.last_name}`}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary-light flex items-center justify-center">
                          <span className="text-primary font-medium">
                            {memberData ? memberData.first_name[0] : user.email[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="hidden md:flex md:items-center">
                        <span className="text-sm font-medium text-gray-900">
                          {memberData ? `${memberData.first_name} ${memberData.last_name}` : user.email}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 text-gray-500" aria-hidden="true" />
                      </div>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {memberData && (
                    <DropdownMenuItem onClick={() => navigate(`/members/${memberData.id}`)}>
                      <User className="mr-2 h-4 w-4" />
                      <span>View Profile</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 bg-white">
          <div className="px-8 py-6">
            <Outlet />
          </div>
        </main>

        <footer className="bg-white border-t py-4 px-6 lg:pl-64">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between">
            {/* Copyright & Developer Info */}
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Steward Track. All rights reserved. Developed by{" "}
              <a href="https://cortanatechsolutions.com" className="hover:text-gray-700" target="_blank" rel="noopener noreferrer">
                Cortanatech Solutions, Inc.
              </a>
            </p>

            {/* Legal Links */}
            <nav className="flex items-center gap-x-4 mt-2 sm:mt-0" aria-label="Footer Navigation">
              <Link to="/settings/privacy" className="text-sm text-gray-500 hover:text-gray-700">
                Privacy Policy
              </Link>
              <Link to="/settings/terms" className="text-sm text-gray-500 hover:text-gray-700">
                Terms of Service
              </Link>
            </nav>
          </div>
        </footer>

      </div>
    </div>
  );
}

export default Layout;