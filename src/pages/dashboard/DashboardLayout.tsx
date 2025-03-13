import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Building2, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { Tabs } from '../../components/ui2/tabs';
import { Card, CardContent } from '../../components/ui2/card';
import { ScrollArea } from '../../components/ui2/scroll-area';

function DashboardLayout() {
  const location = useLocation();
  const { user } = useAuthStore();

  // Get associated member data
  const { data: memberData } = useQuery({
    queryKey: ['current-user-member', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;

      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name')
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

  const tabs = [
    { 
      id: 'church',
      label: 'Church Overview',
      icon: <Building2 className="h-5 w-5" />,
      content: location.pathname === '/dashboard/church' ? <Outlet /> : null
    },
    ...(memberData ? [{ 
      id: 'personal',
      label: 'Personal Overview',
      icon: <User className="h-5 w-5" />,
      content: location.pathname === '/dashboard/personal' ? <Outlet /> : null
    }] : []),
  ];

  const activeTab = location.pathname.includes('personal') ? 'personal' : 'church';

  const handleTabChange = (tabId: string) => {
    const path = `/dashboard/${tabId}`;
    if (location.pathname !== path) {
      window.history.pushState(null, '', path);
      // Trigger a navigation event to update React Router
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <ScrollArea orientation="horizontal">
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onChange={handleTabChange}
              variant="enclosed"
              size="sm"
            />
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}

export default DashboardLayout;