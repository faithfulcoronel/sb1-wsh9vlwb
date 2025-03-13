// src/pages/Settings.tsx
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Settings as SettingsIcon, CreditCard, BarChart3, History, Shield } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { Container } from '../components/ui/Container';
import { Card, CardHeader, CardContent } from '../components/ui2/card';
import { Tabs } from '../components/ui2/tabs';

// Import settings pages
import GeneralSettings from './settings/GeneralSettings';
import Subscription from './settings/Subscription';
import Usage from './settings/Usage';
import AuditLog from './settings/AuditLog';
import Privacy from './settings/Privacy';
import Terms from './settings/Terms';
import Administration from './admin/Administration';

function Settings() {
  const location = useLocation();
  const { hasPermission } = usePermissions();

  // Define main tabs
  const mainTabs = [
    {
      id: 'general',
      label: 'General',
      icon: <SettingsIcon className="h-5 w-5" />,
      href: '/settings'
    },
    {
      id: 'usage',
      label: 'Usage',
      icon: <BarChart3 className="h-5 w-5" />,
      href: '/settings/usage'
    },
    {
      id: 'subscription',
      label: 'Subscription',
      icon: <CreditCard className="h-5 w-5" />,
      href: '/settings/subscription'
    },
    {
      id: 'administration',
      label: 'Administration',
      icon: <Shield className="h-5 w-5" />,
      href: '/settings/administration',
      show: () => hasPermission('user.view') || hasPermission('role.view')
    },
    {
      id: 'audit-log',
      label: 'Audit Log',
      icon: <History className="h-5 w-5" />,
      href: '/settings/audit-log'
    }
  ].filter(tab => !tab.show || tab.show());

  // Get current active tab
  const currentPath = location.pathname;
  const activeMainTab = mainTabs.find(tab => 
    tab.href === '/settings' 
      ? currentPath === '/settings'
      : currentPath.startsWith(tab.href)
  )?.id || 'general';

  return (
    <Container>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Tabs
                tabs={mainTabs.map(tab => ({
                  id: tab.id,
                  label: tab.label,
                  icon: tab.icon
                }))}
                activeTab={activeMainTab}
                onChange={(tabId) => {
                  const tab = mainTabs.find(t => t.id === tabId);
                  if (tab) {
                    window.history.pushState(null, '', tab.href);
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }
                }}
                variant="enclosed"
                size="sm"
              />
            </div>

            {/* Routes */}
            <div className="mt-6">
              <Routes>
                <Route index element={<GeneralSettings />} />
                <Route path="subscription" element={<Subscription />} />
                <Route path="usage" element={<Usage />} />
                <Route path="audit-log" element={<AuditLog />} />
                <Route path="privacy" element={<Privacy />} />
                <Route path="terms" element={<Terms />} />
                <Route path="administration/*" element={<Administration />} />
                <Route path="*" element={<Navigate to="/settings" replace />} />
              </Routes>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}

export default Settings;
