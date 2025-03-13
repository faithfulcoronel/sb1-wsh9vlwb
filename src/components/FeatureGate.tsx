import React from 'react';
import { useFeatureStore, type FeatureFlag } from '../stores/featureStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function FeatureGate({ feature, children, fallback = null }: FeatureGateProps) {
  const isEnabled = useFeatureStore((state) => state.isEnabled(feature));
  const featureConfig = useFeatureStore((state) => state.features[feature]);

  // Get current tenant subscription
  const { data: tenant } = useQuery({
    queryKey: ['tenant-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_current_tenant');

      if (error) throw error;
      return data?.[0];
    },
  });

  // Check if feature is available for current subscription tier
  const isTierAllowed = React.useMemo(() => {
    if (!featureConfig?.tier || !tenant?.subscription_tier) return true;
    
    const tiers = ['free', 'basic', 'advanced', 'premium', 'enterprise'];
    const featureTierIndex = tiers.indexOf(featureConfig.tier);
    const currentTierIndex = tiers.indexOf(tenant.subscription_tier.toLowerCase());
    
    return currentTierIndex >= featureTierIndex;
  }, [featureConfig?.tier, tenant?.subscription_tier]);

  if (!isEnabled || !isTierAllowed) {
    return fallback;
  }

  return <>{children}</>;
}

export default FeatureGate;