import { type TMenuConfig } from '@/components/menu';

export const MENU_SIDEBAR: TMenuConfig = [
  {
    title: 'Dashboard',
    icon: 'dashboard',
    path: '/dashboard'
  },
  {
    title: 'Members',
    icon: 'users',
    path: '/members'
  },
  {
    title: 'Finances',
    icon: 'finance',
    path: '/finances'
  },
  {
    title: 'Administration',
    icon: 'settings',
    children: [
      {
        title: 'Users',
        path: '/admin/users'
      },
      {
        title: 'Roles',
        path: '/admin/roles'
      },
      {
        title: 'Church Settings',
        path: '/admin/church-settings'
      }
    ]
  }
];

export const MENU_SIDEBAR_BOTTOM: TMenuConfig = [
  {
    title: 'Settings',
    icon: 'setting-2',
    path: '/settings'
  }
];
