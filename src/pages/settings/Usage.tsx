import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Users, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Progress } from '../../components/ui/Progress';

type UsageStats = {
  members: {
    total: number;
    limit: number;
  };
  transactions: {
    total: number;
    limit: number;
  };
};

const TIER_LIMITS = {
  free: {
    members: 25,
    transactions: 1000,
  },
  basic: {
    members: 100,
    transactions: 5000,
  },
  advanced: {
    members: 250,
    transactions: 10000,
  },
  premium: {
    members: 1000,
    transactions: 50000,
  },
  enterprise: {
    members: -1, // Unlimited
    transactions: -1, // Unlimited
  },
};

function Usage() {
  const { data: usageStats, isLoading } = useQuery({
    queryKey: ['tenant-usage'],
    queryFn: async () => {
      // Get current tenant
      const { data: tenant } = await supabase.rpc('get_current_tenant');
      const currentTenant = tenant?.[0];
      
      if (!currentTenant) throw new Error('No tenant found');

      // Get member count
      const { count: memberCount } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', currentTenant.id)
        .is('deleted_at', null);

      // Get transaction count for current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: transactionCount } = await supabase
        .from('financial_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', currentTenant.id)
        .gte('date', startOfMonth.toISOString());

      const tier = (currentTenant.subscription_tier || 'free').toLowerCase();
      const limits = TIER_LIMITS[tier];

      return {
        members: {
          total: memberCount || 0,
          limit: limits.members,
        },
        transactions: {
          total: transactionCount || 0,
          limit: limits.transactions,
        },
      } as UsageStats;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!usageStats) {
    return null;
  }

  const getMeterColor = (used: number, limit: number) => {
    if (limit === -1) return 'primary';
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'danger';
    if (percentage >= 75) return 'warning';
    return 'success';
  };

  const getUsageStatus = (used: number, limit: number) => {
    if (limit === -1) return {
      icon: CheckCircle2,
      text: 'Unlimited',
      color: 'text-primary-600',
    };

    const percentage = (used / limit) * 100;
    if (percentage >= 90) return {
      icon: AlertCircle,
      text: 'Critical',
      color: 'text-red-600',
    };
    if (percentage >= 75) return {
      icon: AlertCircle,
      text: 'Warning',
      color: 'text-yellow-600',
    };
    return {
      icon: CheckCircle2,
      text: 'Good',
      color: 'text-green-600',
    };
  };

  const renderUsageMeter = (title: string, icon: React.ReactNode, used: number, limit: number) => {
    const { icon: StatusIcon, text: statusText, color } = getUsageStatus(used, limit);
    const meterColor = getMeterColor(used, limit);

    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {icon}
            <h3 className="ml-2 text-lg font-medium text-gray-900">{title}</h3>
          </div>
          <div className={`flex items-center ${color}`}>
            <StatusIcon className="h-5 w-5 mr-1" />
            <span className="text-sm font-medium">{statusText}</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Used</span>
            <span className="font-medium text-gray-900">
              {used.toLocaleString()} / {limit === -1 ? '∞' : limit.toLocaleString()}
            </span>
          </div>

          <Progress
            value={limit === -1 ? 50 : (used / limit) * 100}
            max={100}
            variant={meterColor}
            size="lg"
          />

          {limit !== -1 && (
            <div className="text-sm text-gray-500">
              {Math.max(limit - used, 0).toLocaleString()} remaining
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-base font-semibold leading-7 text-gray-900">Current Usage</h2>
      <p className="mt-1 text-sm leading-6 text-gray-500">
        Monitor your current usage against your plan limits.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {renderUsageMeter(
          'Member Profiles',
          <Users className="h-6 w-6 text-primary-600" />,
          usageStats.members.total,
          usageStats.members.limit
        )}

        {renderUsageMeter(
          'Monthly Transactions',
          <DollarSign className="h-6 w-6 text-primary-600" />,
          usageStats.transactions.total,
          usageStats.transactions.limit
        )}
      </div>
    </div>
  );
}

export default Usage;