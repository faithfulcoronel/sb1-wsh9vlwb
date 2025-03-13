import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useMessageStore } from '../components/MessageHandler';

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

export function useSubscriptionLimits() {
  const { addMessage } = useMessageStore();

  const { data: limits } = useQuery({
    queryKey: ['subscription-limits'],
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
          used: memberCount || 0,
          limit: limits.members,
          remaining: limits.members === -1 ? -1 : Math.max(0, limits.members - (memberCount || 0)),
        },
        transactions: {
          used: transactionCount || 0,
          limit: limits.transactions,
          remaining: limits.transactions === -1 ? -1 : Math.max(0, limits.transactions - (transactionCount || 0)),
        },
      };
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const checkMemberLimit = () => {
    if (!limits) return true;

    if (limits.members.limit === -1) return true;
    
    if (limits.members.remaining <= 0) {
      addMessage({
        type: 'error',
        text: `You have reached your member limit (${limits.members.limit}). Please upgrade your subscription to add more members.`,
        duration: 5000,
      });
      return false;
    }

    if (limits.members.remaining <= 5) {
      addMessage({
        type: 'warning',
        text: `You are approaching your member limit. Only ${limits.members.remaining} slots remaining.`,
        duration: 5000,
      });
    }

    return true;
  };

  const checkTransactionLimit = () => {
    if (!limits) return true;

    if (limits.transactions.limit === -1) return true;
    
    if (limits.transactions.remaining <= 0) {
      addMessage({
        type: 'error',
        text: `You have reached your monthly transaction limit (${limits.transactions.limit}). Please upgrade your subscription to add more transactions.`,
        duration: 5000,
      });
      return false;
    }

    if (limits.transactions.remaining <= 50) {
      addMessage({
        type: 'warning',
        text: `You are approaching your monthly transaction limit. Only ${limits.transactions.remaining} transactions remaining.`,
        duration: 5000,
      });
    }

    return true;
  };

  return {
    limits,
    checkMemberLimit,
    checkTransactionLimit,
  };
}