import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useWelcomeStore } from '../stores/welcomeStore';
import { WelcomeModal } from '../components/WelcomeModal';
import ChurchDashboard from './dashboard/ChurchDashboard';
import PersonalDashboard from './dashboard/PersonalDashboard';

function Dashboard() {
  const [showWelcome, setShowWelcome] = React.useState(false);
  const { hasSeenWelcome, setHasSeenWelcome } = useWelcomeStore();

  // Get current tenant
  const { data: currentTenant } = useQuery({
    queryKey: ['current-tenant'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_current_tenant');
      if (error) throw error;
      return data?.[0];
    },
  });

  React.useEffect(() => {
    if (currentTenant && !hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, [currentTenant, hasSeenWelcome]);

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    setHasSeenWelcome(true);
  };

  return (
    <>
      <Routes>
        <Route index element={<Navigate to="/dashboard/church" replace />} />
        <Route path="church" element={<ChurchDashboard />} />
        <Route path="personal" element={<PersonalDashboard />} />
      </Routes>

      {/* Welcome Modal */}
      {currentTenant && (
        <WelcomeModal
          isOpen={showWelcome}
          onClose={handleCloseWelcome}
          churchName={currentTenant.name}
        />
      )}
    </>
  );
}

export default Dashboard;