import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { stripe } from '../../lib/stripe';
import { PricingTable } from '../../components/ui2/pricing-table';
import { Crown, CreditCard, Calendar, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui2/card';
import { Button } from '../../components/ui2/button';
import { useMessageStore } from '../../components/MessageHandler';
import Usage from './Usage';

function Subscription() {
  const queryClient = useQueryClient();
  const { addMessage } = useMessageStore();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_current_tenant');

      if (error) throw error;
      return data?.[0];
    },
  });

  const createPaymentSession = async (tier: string, cycle: 'monthly' | 'annual') => {
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        tier,
        cycle,
        tenantId: tenant?.id,
        returnUrl: window.location.origin + '/settings/subscription'
      }
    });

    if (error) throw error;
    return data.sessionId;
  };

  const upgradeMutation = useMutation({
    mutationFn: async ({ tier, cycle }: { tier: string; cycle: 'monthly' | 'annual' }) => {
      setIsProcessing(true);
      try {
        // For free tier, directly update subscription
        if (tier.toLowerCase() === 'free') {
          const { data, error } = await supabase
            .rpc('update_tenant_subscription', {
              p_subscription_tier: tier.toLowerCase(),
              p_billing_cycle: cycle
            });

          if (error) throw error;
          return data;
        }

        // For paid tiers, create Stripe checkout session
        const sessionId = await createPaymentSession(tier, cycle);
        const stripeInstance = await stripe;
        if (!stripeInstance) {
          throw new Error('Failed to load Stripe');
        }

        // Redirect to Stripe checkout
        const { error: stripeError } = await stripeInstance.redirectToCheckout({
          sessionId
        });

        if (stripeError) {
          throw stripeError;
        }
      } finally {
        setIsProcessing(false);
      }
    },
    onError: (error: Error) => {
      addMessage({
        type: 'error',
        text: error.message,
        duration: 5000,
      });
      setShowUpgradeModal(false);
    }
  });

  const handleUpgrade = (tier: string, cycle: 'monthly' | 'annual') => {
    setSelectedTier(tier);
    setBillingCycle(cycle);
    setShowUpgradeModal(true);
  };

  const confirmUpgrade = async () => {
    if (!selectedTier) return;
    try {
      await upgradeMutation.mutateAsync({
        tier: selectedTier,
        cycle: billingCycle
      });
    } catch (error) {
      console.error('Error upgrading subscription:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Current Subscription */}
      <div>
        <h2 className="text-base font-semibold leading-7 text-foreground">Current Subscription</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Review and manage your subscription details.
        </p>

        <dl className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Card className="bg-background">
            <CardContent className="p-6">
              <dt className="flex items-center text-sm font-medium text-muted-foreground">
                <Crown className="h-5 w-5 text-primary mr-2" />
                Current Plan
              </dt>
              <dd className="mt-2">
                <span className="text-3xl font-medium tracking-tight text-foreground">
                  {tenant?.subscription_tier || 'Free'}
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  ({tenant?.subscription_status || 'active'})
                </span>
              </dd>
            </CardContent>
          </Card>

          <Card className="bg-background">
            <CardContent className="p-6">
              <dt className="flex items-center text-sm font-medium text-muted-foreground">
                <CreditCard className="h-5 w-5 text-primary mr-2" />
                Billing Cycle
              </dt>
              <dd className="mt-2">
                <span className="text-3xl font-medium tracking-tight text-foreground">
                  {tenant?.billing_cycle === 'annual' ? 'Annual' : 'Monthly'}
                </span>
              </dd>
            </CardContent>
          </Card>

          <Card className="bg-background">
            <CardContent className="p-6">
              <dt className="flex items-center text-sm font-medium text-muted-foreground">
                <Calendar className="h-5 w-5 text-primary mr-2" />
                Next Billing Date
              </dt>
              <dd className="mt-2">
                <span className="text-3xl font-medium tracking-tight text-foreground">
                  {tenant?.subscription_end_date
                    ? new Date(tenant.subscription_end_date).toLocaleDateString()
                    : 'N/A'}
                </span>
              </dd>
            </CardContent>
          </Card>
        </dl>

        {/* Usage Warning */}
        {tenant?.subscription_tier === 'free' && (
          <Card className="mt-6 bg-warning/10">
            <CardContent className="p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-warning" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-warning">
                    You're on the Free Plan
                  </h3>
                  <div className="mt-2 text-sm text-warning/90">
                    <p>
                      Upgrade to a paid plan to unlock more features and increase your member and transaction limits.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Usage Section */}
      <Usage />

      {/* Available Plans */}
      <div>
        <h2 className="text-base font-semibold leading-7 text-foreground">Available Plans</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Choose the plan that best fits your church's needs.
        </p>

        <div className="mt-6">
          <PricingTable
            currentTier={tenant?.subscription_tier}
            onUpgrade={handleUpgrade}
            billingCycle={billingCycle}
            onBillingCycleChange={setBillingCycle}
          />
        </div>
      </div>
    </div>
  );
}

export default Subscription;