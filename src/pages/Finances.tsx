import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Card, CardContent } from '../components/ui2/card';
import { Loader2 } from 'lucide-react';
import { SubscriptionGate } from '../components/SubscriptionGate';

// Lazy load finance components
const FinancesDashboard = React.lazy(() => import('./finances/FinancesDashboard'));
const TransactionList = React.lazy(() => import('./finances/TransactionList'));
const TransactionAdd = React.lazy(() => import('./finances/TransactionAdd'));
const BulkTransactionEntry = React.lazy(() => import('./finances/BulkTransactionEntry'));
const BulkIncomeEntry = React.lazy(() => import('./finances/BulkIncomeEntry'));
const BulkExpenseEntry = React.lazy(() => import('./finances/BulkExpenseEntry'));
const BudgetList = React.lazy(() => import('./finances/BudgetList'));
const BudgetAdd = React.lazy(() => import('./finances/BudgetAdd'));
const BudgetProfile = React.lazy(() => import('./finances/BudgetProfile'));
const Reports = React.lazy(() => import('./finances/Reports'));

function LoadingSpinner() {
  return (
    <Card>
      <CardContent className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </CardContent>
    </Card>
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
        <Route path="budgets/:id" element={<BudgetProfile />} />
        <Route path="reports" element={<Reports />} />
      </Routes>
    </Suspense>
  );
}

export default Finances;