import { useFeatureStore, type FeatureFlag } from '../stores/featureStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useFeatures() {
  const { setFeatures, features, isEnabled, setFeature } = useFeatureStore();

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

  // Enable/disable features based on subscription tier
  React.useEffect(() => {
    if (!tenant?.subscription_tier) return;

    const tiers = ['free', 'basic', 'advanced', 'premium', 'enterprise'];
    const currentTierIndex = tiers.indexOf(tenant.subscription_tier.toLowerCase());

    // Update feature flags based on subscription tier
    Object.entries(features).forEach(([key, feature]) => {
      if (!feature.tier) return;

      const featureTierIndex = tiers.indexOf(feature.tier);
      const shouldBeEnabled = currentTierIndex >= featureTierIndex;

      if (feature.enabled !== shouldBeEnabled) {
        setFeature(key, shouldBeEnabled);
      }
    });
  }, [tenant?.subscription_tier, features, setFeature]);

  return {
    features,
    isEnabled,
    setFeature,
    setFeatures
  };
}