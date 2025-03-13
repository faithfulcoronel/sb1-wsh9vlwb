import React from 'react';
import { useFeatureStore, type FeatureFlag } from '../stores/featureStore';
import { Switch } from './ui/Switch';
import { AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface FeatureListProps {
  filter?: string;
  onlyToggleable?: boolean;
  showDescription?: boolean;
}

function FeatureList({ filter, onlyToggleable = false, showDescription = true }: FeatureListProps) {
  const { features, setFeature } = useFeatureStore();

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

  const filteredFeatures = React.useMemo(() => {
    return Object.values(features).filter(feature => {
      if (filter && !feature.key.startsWith(filter)) return false;
      if (onlyToggleable && !feature.tier) return false;
      return true;
    });
  }, [features, filter, onlyToggleable]);

  const isFeatureAvailable = (feature: FeatureFlag) => {
    if (!feature.tier || !tenant?.subscription_tier) return true;
    
    const tiers = ['free', 'basic', 'advanced', 'premium', 'enterprise'];
    const featureTierIndex = tiers.indexOf(feature.tier);
    const currentTierIndex = tiers.indexOf(tenant.subscription_tier.toLowerCase());
    
    return currentTierIndex >= featureTierIndex;
  };

  return (
    <div className="space-y-4">
      {filteredFeatures.map((feature) => {
        const isAvailable = isFeatureAvailable(feature);

        return (
          <div
            key={feature.key}
            className={`
              flex items-center justify-between p-4 rounded-lg border
              ${isAvailable ? 'bg-white' : 'bg-gray-50'}
              ${feature.enabled ? 'border-primary-200' : 'border-gray-200'}
            `}
          >
            <div className="flex-1 mr-4">
              <div className="flex items-center">
                <span className="font-medium text-gray-900">
                  {feature.key.split('.').pop()?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                {feature.tier && (
                  <span className={`
                    ml-2 px-2 py-0.5 text-xs font-medium rounded-full
                    ${isAvailable 
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-gray-100 text-gray-600'
                    }
                  `}>
                    {feature.tier.toUpperCase()}
                  </span>
                )}
                {!isAvailable && (
                  <Lock className="h-4 w-4 text-gray-400 ml-2" />
                )}
              </div>
              {showDescription && (
                <p className="mt-1 text-sm text-gray-500">{feature.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {feature.enabled ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-400" />
              )}
              <Switch
                checked={feature.enabled}
                onChange={(checked) => setFeature(feature.key, checked)}
                disabled={!isAvailable}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default FeatureList;