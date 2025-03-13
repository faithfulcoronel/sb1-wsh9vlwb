import React from 'react';
import { Crown, Users, DollarSign, Zap, Check } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { Button } from './Button';
import { Badge } from './Badge';

interface PricingTier {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  memberLimit: number;
  transactionLimit: number;
  features: string[];
  isPopular?: boolean;
  icon?: React.ReactNode;
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
      'Priority email support',
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
      'Priority support',
      'Custom branding',
      'Complete member profiles',
      'Financial forecasting',
      'Attendance tracking',
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
      'Dedicated support',
      'Role-based access control',
      'Advanced analytics',
      'Custom dashboards',
      'API access',
      'Data backup',
      'Audit logs'
    ],
    icon: <DollarSign className="h-6 w-6 text-info" />
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
    const tiers = ['free', 'basic', 'advanced', 'premium'];
    return tiers.indexOf(tierName.toLowerCase());
  };

  const getButtonProps = (tier: PricingTier) => {
    const currentIndex = getTierIndex(currentTier || 'free');
    const selectedIndex = getTierIndex(tier.name.toLowerCase());
    const isCurrentTier = currentTier === tier.name.toLowerCase();
    const isDowngrade = selectedIndex < currentIndex;

    return {
      onClick: () => onUpgrade?.(tier.name.toLowerCase(), billingCycle),
      disabled: isCurrentTier,
      variant: isCurrentTier ? 'outline' : 'primary',
      className: `w-full justify-center ${isCurrentTier ? 'cursor-default' : ''}`,
      children: isCurrentTier ? 'Current Plan' : isDowngrade ? 'Downgrade' : 'Upgrade'
    };
  };

  return (
    <div className="space-y-8">
      {/* Billing Cycle Toggle */}
      {onBillingCycleChange && (
        <div className="flex justify-center">
          <div className="relative flex rounded-full bg-gray-100 dark:bg-gray-800 p-1">
            <button
              type="button"
              className={`
                flex items-center rounded-full px-4 py-2 text-sm font-medium
                ${billingCycle === 'monthly'
                  ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-gray-100'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
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
                  ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-gray-100'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
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

      {/* Pricing Tiers */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {pricingTiers.map((tier) => (
          <div
            key={tier.name}
            className={`
              relative flex flex-col
              rounded-xl
              bg-white dark:bg-gray-800
              shadow-sm dark:shadow-none
              border border-gray-200 dark:border-gray-700
              overflow-hidden
              transition-all duration-200
              hover:shadow-lg dark:hover:border-primary
              ${tier.isPopular ? 'ring-2 ring-primary dark:ring-primary' : ''}
            `}
          >
            {tier.isPopular && (
              <div className="absolute -top-3 left-0 right-0 mx-auto w-32">
                <Badge variant="primary" className="w-full justify-center">
                  Most Popular
                </Badge>
              </div>
            )}

            <div className="p-6">
              {/* Plan Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {tier.name}
                  </h3>
                </div>
                {tier.icon}
              </div>

              {/* Price */}
              <div className="mt-6 flex items-baseline gap-x-2">
                <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                  {formatCurrency(getPrice(tier), { code: 'PHP', symbol: '₱' })}
                </span>
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  /{billingCycle === 'monthly' ? 'month' : 'year'}
                </span>
              </div>

              {/* Annual Savings */}
              {billingCycle === 'annual' && tier.annualPrice > 0 && (
                <p className="mt-1 text-sm text-success dark:text-success">
                  Save {formatCurrency((tier.monthlyPrice * 12 - tier.annualPrice), { code: 'PHP', symbol: '₱' })} per year
                </p>
              )}

              {/* Limits */}
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-x-3 text-sm text-gray-600 dark:text-gray-300">
                  <Users className="h-5 w-5 flex-none text-primary dark:text-primary" />
                  {tier.memberLimit === -1 ? (
                    'Unlimited member profiles'
                  ) : (
                    <span>{tier.memberLimit.toLocaleString()} member profiles</span>
                  )}
                </div>
                <div className="flex items-center gap-x-3 text-sm text-gray-600 dark:text-gray-300">
                  <DollarSign className="h-5 w-5 flex-none text-primary dark:text-primary" />
                  {tier.transactionLimit === -1 ? (
                    'Unlimited transactions'
                  ) : (
                    <span>{tier.transactionLimit.toLocaleString()} transactions</span>
                  )}
                </div>
              </div>

              {/* Features */}
              <ul className="mt-8 space-y-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
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
                  className="mt-8"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}