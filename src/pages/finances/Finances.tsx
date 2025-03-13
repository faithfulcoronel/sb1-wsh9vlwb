import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import SubscriptionGate from '../../components/SubscriptionGate';

// Lazy load finance components
const FinancesDashboard = React.lazy(() => import('./FinancesDashboard'));
const TransactionList = React.lazy(() => import('./TransactionList'));
const TransactionAdd = React.lazy(() => import('./TransactionAdd'));
const BulkTransactionEntry = React.lazy(() => import('./BulkTransactionEntry'));
const BulkIncomeEntry = React.lazy(() => import('./BulkIncomeEntry'));
const BulkExpenseEntry = React.lazy(() => import('./BulkExpenseEntry'));
const BudgetList = React.lazy(() => import('./BudgetList'));
const BudgetAdd = React.lazy(() => import('./BudgetAdd'));
const BudgetEdit = React.lazy(() => import('./BudgetEdit'));
const BudgetProfile = React.lazy(() => import('./BudgetProfile'));
const Reports = React.lazy(() => import('./Reports'));

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
    </div>
  );
}

function Finances() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route index element={<FinancesDashboard />} />
        <Route path="transactions" element={<TransactionList />} />
        <Route path="transactions/add" element={
          <SubscriptionGate type="transaction">
            <TransactionAdd />
          </SubscriptionGate>
        } />
        <Route path="transactions/bulk" element={
          <SubscriptionGate type="transaction">
            <BulkTransactionEntry />
          </SubscriptionGate>
        } />
        <Route path="transactions/bulk-income" element={
          <SubscriptionGate type="transaction">
            <BulkIncomeEntry />
          </SubscriptionGate>
        } />
        <Route path="transactions/bulk-expense" element={
          <SubscriptionGate type="transaction">
            <BulkExpenseEntry />
          </SubscriptionGate>
        } />
        <Route path="budgets" element={<BudgetList />} />
        <Route path="budgets/add" element={<BudgetAdd />} />
        <Route path="budgets/:id/edit" element={<BudgetEdit />} />
        <Route path="budgets/:id" element={<BudgetProfile />} />
        <Route path="reports" element={<Reports />} />
      </Routes>
    </Suspense>
  );
}

export default Finances;