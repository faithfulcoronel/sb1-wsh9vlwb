import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FeatureFlag = {
  key: string;
  enabled: boolean;
  description: string;
  tier?: 'free' | 'basic' | 'advanced' | 'premium' | 'enterprise';
};

interface FeatureState {
  features: Record<string, FeatureFlag>;
  setFeature: (key: string, enabled: boolean) => void;
  setFeatures: (features: Record<string, FeatureFlag>) => void;
  isEnabled: (key: string) => boolean;
  reset: () => void;
}

const defaultFeatures: Record<string, FeatureFlag> = {
  // Member Management Features
  'member.bulk-import': {
    key: 'member.bulk-import',
    enabled: false,
    description: 'Allow bulk import of members',
    tier: 'basic'
  },
  'member.export': {
    key: 'member.export',
    enabled: false,
    description: 'Allow exporting member data',
    tier: 'basic'
  },
  'member.advanced-profile': {
    key: 'member.advanced-profile',
    enabled: false,
    description: 'Enable advanced member profile fields',
    tier: 'advanced'
  },

  // Financial Features
  'finance.bulk-transactions': {
    key: 'finance.bulk-transactions',
    enabled: false,
    description: 'Allow bulk transaction entry',
    tier: 'basic'
  },
  'finance.advanced-reports': {
    key: 'finance.advanced-reports',
    enabled: false,
    description: 'Enable advanced financial reports',
    tier: 'advanced'
  },
  'finance.forecasting': {
    key: 'finance.forecasting',
    enabled: false,
    description: 'Enable financial forecasting',
    tier: 'premium'
  },

  // Administrative Features
  'admin.audit-logs': {
    key: 'admin.audit-logs',
    enabled: false,
    description: 'Enable audit logging',
    tier: 'premium'
  },
  'admin.custom-roles': {
    key: 'admin.custom-roles',
    enabled: false,
    description: 'Allow custom role creation',
    tier: 'advanced'
  },

  // API Access
  'api.access': {
    key: 'api.access',
    enabled: false,
    description: 'Enable API access',
    tier: 'premium'
  },

  // Support Features
  'support.priority': {
    key: 'support.priority',
    enabled: false,
    description: 'Enable priority support',
    tier: 'basic'
  },
  'support.dedicated': {
    key: 'support.dedicated',
    enabled: false,
    description: 'Enable dedicated support',
    tier: 'premium'
  }
};

export const useFeatureStore = create<FeatureState>()(
  persist(
    (set, get) => ({
      features: defaultFeatures,
      setFeature: (key, enabled) =>
        set((state) => ({
          features: {
            ...state.features,
            [key]: { ...state.features[key], enabled }
          }
        })),
      setFeatures: (features) => set({ features }),
      isEnabled: (key) => get().features[key]?.enabled ?? false,
      reset: () => set({ features: defaultFeatures })
    }),
    {
      name: 'feature-flags',
      partialize: (state) => ({ features: state.features })
    }
  )
);