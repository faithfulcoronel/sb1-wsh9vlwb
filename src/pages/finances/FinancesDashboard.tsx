import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useCurrencyStore } from '../../stores/currencyStore';
import { formatCurrency } from '../../utils/currency';
import {
  Plus,
  Upload,
  PiggyBank,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Loader2,
  ChevronDown,
} from 'lucide-react';

function FinancesDashboard() {
  const { currency } = useCurrencyStore();
  const [showBulkDropdown, setShowBulkDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowBulkDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['finance-stats'],
    queryFn: async () => {
      // Get current month's transactions
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const { data: transactions, error: transactionsError } = await supabase
        .from('financial_transactions')
        .select('type, amount')
        .gte('date', firstDayOfMonth.toISOString())
        .lte('date', lastDayOfMonth.toISOString());

      if (transactionsError) throw transactionsError;

      const monthlyIncome = transactions
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const monthlyExpenses = transactions
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Get active budgets count
      const { data: activeBudgets, error: budgetsError } = await supabase
        .from('budgets')
        .select('id')
        .gte('end_date', today.toISOString())
        .lte('start_date', today.toISOString());

      if (budgetsError) throw budgetsError;

      return {
        monthlyIncome,
        monthlyExpenses,
        activeBudgets: activeBudgets?.length || 0,
      };
    },
  });

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Finances</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage church finances, track income and expenses, and monitor budgets.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex flex-wrap gap-3 items-center justify-end">
          <Link
            to="/finances/transactions/add"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Link>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowBulkDropdown(!showBulkDropdown)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <Upload className="h-4 w-4 mr-2" />
              Bulk Entry
              <ChevronDown className={`ml-2 h-4 w-4 transition-transform duration-200 ${showBulkDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showBulkDropdown && (
              <div className="absolute right-0 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                <Link
                  to="/finances/transactions/bulk"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowBulkDropdown(false)}
                >
                  Bulk Transaction Entry
                </Link>
                <Link
                  to="/finances/transactions/bulk-income"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowBulkDropdown(false)}
                >
                  Bulk Income Entry
                </Link>
                <Link
                  to="/finances/transactions/bulk-expense"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowBulkDropdown(false)}
                >
                  Bulk Expense Entry
                </Link>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Link
              to="/finances/budgets/add"
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <PiggyBank className="h-4 w-4 mr-2" />
              Add Budget
            </Link>
            <Link
              to="/finances/reports"
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <FileText className="h-4 w-4 mr-2" />
              Reports
            </Link>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="mt-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Monthly Income
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {formatCurrency(stats?.monthlyIncome || 0, currency)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link
                    to="/finances/transactions"
                    className="font-medium text-primary-700 hover:text-primary-900"
                  >
                    View all income
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingDown className="h-6 w-6 text-red-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Monthly Expenses
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {formatCurrency(stats?.monthlyExpenses || 0, currency)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link
                    to="/finances/transactions"
                    className="font-medium text-primary-700 hover:text-primary-900"
                  >
                    View all expenses
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <PiggyBank className="h-6 w-6 text-primary-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Active Budgets
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {stats?.activeBudgets || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link
                    to="/finances/budgets"
                    className="font-medium text-primary-700 hover:text-primary-900"
                  >
                    View all budgets
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Financial Summary
              </h3>
              <div className="mt-4">
                {stats && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Monthly Balance</span>
                        <span className={stats.monthlyIncome - stats.monthlyExpenses >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(Math.abs(stats.monthlyIncome - stats.monthlyExpenses), currency)}
                          {stats.monthlyIncome - stats.monthlyExpenses < 0 && ' (Deficit)'}
                        </span>
                      </div>
                      <div className="mt-1">
                        <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                          <div
                            style={{ width: `${Math.min((stats.monthlyIncome / (stats.monthlyExpenses || 1)) * 100, 100)}%` }}
                            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                              stats.monthlyIncome >= stats.monthlyExpenses
                                ? 'bg-green-500'
                                : 'bg-red-500'
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Income Breakdown</h4>
                        <p className="mt-1 text-2xl font-semibold text-green-600">
                          {formatCurrency(stats.monthlyIncome, currency)}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Expense Breakdown</h4>
                        <p className="mt-1 text-2xl font-semibold text-red-600">
                          {formatCurrency(stats.monthlyExpenses, currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <h3 className="text-lg font-medium text-gray-900">Quick Links</h3>
                  </div>
                </div>
                <div className="mt-5 space-y-4">
                  <Link
                    to="/finances/transactions"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                  >
                    View All Transactions
                  </Link>
                  <Link
                    to="/finances/budgets"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                  >
                    Manage Budgets
                  </Link>
                  <Link
                    to="/finances/reports"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                  >
                    Generate Reports
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <h3 className="text-lg font-medium text-gray-900">Bulk Operations</h3>
                  </div>
                </div>
                <div className="mt-5 space-y-4">
                  <Link
                    to="/finances/transactions/bulk"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                  >
                    Bulk Transaction Entry
                  </Link>
                  <Link
                    to="/finances/transactions/bulk-income"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                  >
                    Bulk Income Entry
                  </Link>
                  <Link
                    to="/finances/transactions/bulk-expense"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                  >
                    Bulk Expense Entry
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FinancesDashboard;