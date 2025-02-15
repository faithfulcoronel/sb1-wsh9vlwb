import React from 'react';
import { Routes, Route } from 'react-router-dom';
import FinancesDashboard from './FinancesDashboard';
import TransactionList from './TransactionList';
import TransactionAdd from './TransactionAdd';
import BulkTransactionEntry from './BulkTransactionEntry';
import BulkIncomeEntry from './BulkIncomeEntry';
import BulkExpenseEntry from './BulkExpenseEntry';
import BudgetList from './BudgetList';
import BudgetAdd from './BudgetAdd';
import BudgetProfile from './BudgetProfile';
import Reports from './Reports';

function Finances() {
  return (
    <Routes>
      <Route index element={<FinancesDashboard />} />
      <Route path="transactions" element={<TransactionList />} />
      <Route path="transactions/add" element={<TransactionAdd />} />
      <Route path="transactions/bulk" element={<BulkTransactionEntry />} />
      <Route path="transactions/bulk-income" element={<BulkIncomeEntry />} />
      <Route path="transactions/bulk-expense" element={<BulkExpenseEntry />} />
      <Route path="budgets" element={<BudgetList />} />
      <Route path="budgets/add" element={<BudgetAdd />} />
      <Route path="budgets/:id" element={<BudgetProfile />} />
      <Route path="reports" element={<Reports />} />
    </Routes>
  );
}

export default Finances;