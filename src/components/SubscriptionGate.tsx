import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSubscriptionLimits } from '../hooks/useSubscriptionLimits';
import { AlertTriangle, Crown } from 'lucide-react';

type SubscriptionGateProps = {
  type: 'member' | 'transaction';
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

function SubscriptionGate({ type, children, fallback = null }: SubscriptionGateProps) {
  const { limits, checkMemberLimit, checkTransactionLimit } = useSubscriptionLimits();
  const [isAllowed, setIsAllowed] = useState<boolean>(true);

useEffect(() => {
  if (!limits) return;

  setIsAllowed(type === 'member' ? checkMemberLimit() : checkTransactionLimit());
}, [limits, type]);

  if (!isAllowed) {
    return (
      <div className="rounded-lg bg-yellow-50 p-6">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              {type === 'member' ? 'Member Limit Reached' : 'Transaction Limit Reached'}
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                You have reached your {type === 'member' ? 'member' : 'monthly transaction'} limit.
                Please upgrade your subscription to continue adding {type === 'member' ? 'members' : 'transactions'}.
              </p>
            </div>
            <div className="mt-4">
              <div className="-mx-2 -my-1.5 flex">
                <Link
                  to="/settings/subscription"
                  className="rounded-md bg-yellow-50 px-2 py-1.5 text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-yellow-50"
                >
                  <Crown className="inline-block h-4 w-4 mr-1" />
                  Upgrade Plan
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default SubscriptionGate;

export { SubscriptionGate }