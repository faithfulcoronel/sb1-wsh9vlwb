import * as React from 'react';
import { Crown, Users, DollarSign, Zap, Check, Headphones } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { Button } from './button';
import { Badge } from './badge';

interface PricingTier {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  memberLimit: number;
  transactionLimit: number;
  features: string[];
  isPopular?: boolean;
  icon?: React.ReactNode;
  isCustom?: boolean;
}

interface PricingTableProps {
  currentTier?: string;
  onUpgrade?: (tier: string, billingCycle: 'monthly' | 'annual') => void;
  billingCycle?: 'monthly' | 'annual';
  onBillingCycleChange?: (cycle: 'monthly' | 'annual') => void;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    memberLimit: 25,
    transactionLimit: 1000,
    features: [
      'Basic reports',
      '1 admin user',
      'Email support',
      'Basic member profiles',
      'Standard financial tracking'
    ],
    icon: <Zap className="h-6 w-6 text-primary" />
  },
  {
    name: 'Basic',
    monthlyPrice: 499,
    annualPrice: 4990, // ~17% discount
    memberLimit: 100,
    transactionLimit: 5000,
    features: [
      'Standard reports',
      '3 admin users',
      'Enhanced member profiles',
      'Advanced financial tracking',
      'Bulk data import/export'
    ],
    icon: <Users className="h-6 w-6 text-success" />
  },
  {
    name: 'Advanced',
    monthlyPrice: 999,
    annualPrice: 9990, // ~17% discount
    memberLimit: 250,
    transactionLimit: 10000,
    features: [
      'Advanced reports',
      '5 admin users',
      'Custom branding',
      'Complete member profiles',
      'Financial forecasting',
      'Ministry management'
    ],
    isPopular: true,
    icon: <Crown className="h-6 w-6 text-warning" />
  },
  {
    name: 'Premium',
    monthlyPrice: 1999,
    annualPrice: 19990, // ~17% discount
    memberLimit: 1000,
    transactionLimit: 50000,
    features: [
      'Full reporting suite',
      '10 admin users',
      'Role-based access control',
      'Advanced analytics',
      'Custom dashboards',
      'Audit logs'
    ],
    icon: <DollarSign className="h-6 w-6 text-info" />
  },
  {
    name: 'Custom',
    monthlyPrice: 0,
    annualPrice: 0,
    memberLimit: -1,
    transactionLimit: -1,
    features: [
      'Everything in Premium',
      'Unlimited members',
      'Unlimited transactions',
    ],
    icon: <Headphones className="h-6 w-6 text-primary" />,
    isCustom: true
  }
];

export function PricingTable({ 
  currentTier, 
  onUpgrade, 
  billingCycle = 'monthly',
  onBillingCycleChange 
}: PricingTableProps) {
  const getPrice = (tier: PricingTier) => {
    return billingCycle === 'monthly' ? tier.monthlyPrice : tier.annualPrice;
  };

  const getTierIndex = (tierName: string): number => {
    const tiers = ['free', 'basic', 'advanced', 'premium', 'custom'];
    return tiers.indexOf(tierName.toLowerCase());
  };

  const getButtonProps = (tier: PricingTier) => {
    if (tier.isCustom) {
      return {
        onClick: () => window.location.href = 'mailto:sales@stewardtrack.com',
        variant: 'outline' as const,
        className: 'w-full justify-center',
        children: 'Contact Us'
      };
    }

    const currentIndex = getTierIndex(currentTier || 'free');
    const selectedIndex = getTierIndex(tier.name.toLowerCase());
    const isCurrentTier = currentTier === tier.name.toLowerCase();
    const isDowngrade = selectedIndex < currentIndex;

    return {
      onClick: () => onUpgrade?.(tier.name.toLowerCase(), billingCycle),
      disabled: isCurrentTier,
      variant: isCurrentTier 
        ? 'outline' as const
        : isDowngrade 
          ? 'secondary' as const 
          : 'primary' as const,
      className: `w-full justify-center ${isCurrentTier ? 'cursor-default' : ''}`,
      children: isCurrentTier ? 'Current Plan' : isDowngrade ? 'Downgrade' : 'Upgrade'
    };
  };

  // Split tiers into two rows
  const firstRowTiers = pricingTiers.slice(0, 3);
  const secondRowTiers = pricingTiers.slice(3);

  return (
    <div className="space-y-8">
      {/* Billing Cycle Toggle */}
      {onBillingCycleChange && (
        <div className="flex justify-center">
          <div className="relative flex rounded-full bg-muted p-1">
            <button
              type="button"
              className={`
                flex items-center rounded-full px-4 py-2 text-sm font-medium
                ${billingCycle === 'monthly'
                  ? 'bg-background shadow text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
              onClick={() => onBillingCycleChange('monthly')}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`
                flex items-center rounded-full px-4 py-2 text-sm font-medium
                ${billingCycle === 'annual'
                  ? 'bg-background shadow text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
              onClick={() => onBillingCycleChange('annual')}
            >
              Annual
              <Badge variant="success" className="ml-2">
                Save 17%
              </Badge>
            </button>
          </div>
        </div>
      )}

      {/* First Row - Free, Basic, Advanced */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {firstRowTiers.map((tier) => (
          <PricingCard 
            key={tier.name} 
            tier={tier} 
            currentTier={currentTier}
            billingCycle={billingCycle}
            onUpgrade={onUpgrade}
          />
        ))}
      </div>

      {/* Second Row - Premium and Custom */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {secondRowTiers.map((tier) => (
          <PricingCard 
            key={tier.name} 
            tier={tier} 
            currentTier={currentTier}
            billingCycle={billingCycle}
            onUpgrade={onUpgrade}
          />
        ))}
      </div>
    </div>
  );
}

interface PricingCardProps {
  tier: PricingTier;
  currentTier?: string;
  billingCycle: 'monthly' | 'annual';
  onUpgrade?: (tier: string, billingCycle: 'monthly' | 'annual') => void;
}

function PricingCard({ tier, currentTier, billingCycle, onUpgrade }: PricingCardProps) {
  const getPrice = (tier: PricingTier) => {
    return billingCycle === 'monthly' ? tier.monthlyPrice : tier.annualPrice;
  };

  const getTierIndex = (tierName: string): number => {
    const tiers = ['free', 'basic', 'advanced', 'premium', 'custom'];
    return tiers.indexOf(tierName.toLowerCase());
  };

  const getButtonProps = (tier: PricingTier) => {
    if (tier.isCustom) {
      return {
        onClick: () => window.location.href = 'mailto:sales@stewardtrack.com',
        variant: 'outline' as const,
        className: 'w-full justify-center',
        children: 'Contact Us'
      };
    }

    const currentIndex = getTierIndex(currentTier || 'free');
    const selectedIndex = getTierIndex(tier.name.toLowerCase());
    const isCurrentTier = currentTier === tier.name.toLowerCase();
    const isDowngrade = selectedIndex < currentIndex;

    return {
      onClick: () => onUpgrade?.(tier.name.toLowerCase(), billingCycle),
      disabled: isCurrentTier,
      variant: isCurrentTier 
        ? 'outline' as const
        : isDowngrade 
          ? 'secondary' as const 
          : 'primary' as const,
      className: `w-full justify-center ${isCurrentTier ? 'cursor-default' : ''}`,
      children: isCurrentTier ? 'Current Plan' : isDowngrade ? 'Downgrade' : 'Upgrade'
    };
  };

  return (
    <div
      className={`
        relative flex flex-col
        rounded-xl
        bg-card text-card-foreground
        shadow-sm dark:shadow-none
        border border-border
        overflow-hidden
        transition-all duration-200
        hover:shadow-lg dark:hover:border-primary
        ${tier.isPopular ? 'ring-2 ring-primary dark:ring-primary' : ''}
      `}
    >
      

      <div className="p-6">
        {tier.isPopular && (
          <div className="absolute mt-1 left-0 right-0 mx-auto w-32">
            <Badge variant="success" className="w-full justify-center">
              Most Popular
            </Badge>
          </div>
        )}
        {/* Plan Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-foreground">
              {tier.name}
            </h3>
          </div>
          {tier.icon}
        </div>

        {/* Price */}
        {!tier.isCustom && (
          <div className="mt-6 flex items-baseline gap-x-2">
            <span className="text-4xl font-bold tracking-tight text-foreground">
              {formatCurrency(getPrice(tier), { code: 'PHP', symbol: '₱' })}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">
              /{billingCycle === 'monthly' ? 'month' : 'year'}
            </span>
          </div>
        )}

        {/* Annual Savings */}
        {!tier.isCustom && billingCycle === 'annual' && tier.annualPrice > 0 && (
          <p className="mt-1 text-sm text-success dark:text-success">
            Save {formatCurrency((tier.monthlyPrice * 12 - tier.annualPrice), { code: 'PHP', symbol: '₱' })} per year
          </p>
        )}

        {/* Limits */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center gap-x-3 text-sm text-muted-foreground">
            <Users className="h-5 w-5 flex-none text-primary dark:text-primary" />
            {tier.memberLimit === -1 ? (
              'Unlimited member profiles'
            ) : (
              <span>{tier.memberLimit.toLocaleString()} member profiles</span>
            )}
          </div>
          <div className="flex items-center gap-x-3 text-sm text-muted-foreground">
            <DollarSign className="h-5 w-5 flex-none text-primary dark:text-primary" />
            {tier.transactionLimit === -1 ? (
              'Unlimited transactions'
            ) : (
              <span>{tier.transactionLimit.toLocaleString()} transactions</span>
            )}
          </div>
        </div>

        {/* Features */}
        <ul className="mt-8 space-y-3 text-sm leading-6 text-muted-foreground">
          {tier.features.map((feature) => (
            <li key={feature} className="flex gap-x-3">
              <Check className="h-5 w-5 flex-none text-primary dark:text-primary" />
              {feature}
            </li>
          ))}
        </ul>

        {/* Action Button */}
        {onUpgrade && (
          <Button
            {...getButtonProps(tier)}
            className="mt-8 bg-primary text-white"
          />
        )}
      </div>
    </div>
  );
}