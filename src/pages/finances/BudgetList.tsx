import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { useCurrencyStore } from '../../stores/currencyStore';
import { formatCurrency } from '../../utils/currency';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/Pagination';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  PiggyBank,
  Loader2,
} from 'lucide-react';

type Budget = {
  id: string;
  name: string;
  amount: number;
  used_amount: number;
  category: string;
  start_date: string;
  end_date: string;
  description?: string;
};

function BudgetList() {
  const navigate = useNavigate();
  const { currency } = useCurrencyStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: budgets, isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      // Get all budgets
      const { data: budgets, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .order('start_date', { ascending: false });

      if (budgetsError) throw budgetsError;

      // Get transactions for each budget to calculate used amount
      const budgetsWithUsage = await Promise.all(
        (budgets || []).map(async (budget) => {
          const { data: transactions, error: transactionsError } = await supabase
            .from('financial_transactions')
            .select('amount')
            .eq('budget_id', budget.id)
            .eq('type', 'expense');

          if (transactionsError) throw transactionsError;

          const used_amount = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

          return {
            ...budget,
            used_amount,
          };
        })
      );

      return budgetsWithUsage as Budget[];
    },
  });

  const today = new Date();

  const filteredBudgets = budgets?.filter((budget) => {
    const matchesSearch = 
      budget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      budget.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || budget.category === categoryFilter;
    
    const startDate = new Date(budget.start_date);
    const endDate = new Date(budget.end_date);
    const isActive = startDate <= today && endDate >= today;
    const isUpcoming = startDate > today;
    const isExpired = endDate < today;

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && isActive) ||
      (statusFilter === 'upcoming' && isUpcoming) ||
      (statusFilter === 'expired' && isExpired);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const { 
    currentPage,
    itemsPerPage,
    totalPages,
    startIndex,
    endIndex,
    handlePageChange,
    handleItemsPerPageChange,
  } = usePagination({
    totalItems: filteredBudgets?.length || 0,
  });

  const paginatedBudgets = filteredBudgets?.slice(startIndex, endIndex);

  const categories = Array.from(
    new Set(budgets?.map((b) => b.category) || [])
  ).sort();

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/finances')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Finances
        </button>
      </div>

      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Budgets</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all budget allocations and their current status.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            to="/finances/budgets/add"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Budget
          </Link>
        </div>
      </div>

      <div className="mt-6 sm:flex sm:items-center sm:justify-between">
        <div className="relative max-w-xs">
          <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="Search budgets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="mt-4 sm:mt-0 sm:flex sm:space-x-4">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              className="block w-full rounded-md border border-gray-300 pl-10 pr-10 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div className="relative mt-4 sm:mt-0">
            <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              className="block w-full rounded-md border border-gray-300 pl-10 pr-10 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {formatStatus(category)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : paginatedBudgets && paginatedBudgets.length > 0 ? (
        <>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedBudgets.map((budget) => {
              const startDate = new Date(budget.start_date);
              const endDate = new Date(budget.end_date);
              const isActive = startDate <= today && endDate >= today;
              const isUpcoming = startDate > today;
              const percentage = ((budget.used_amount || 0) / budget.amount) * 100;

              return (
                <Link
                  key={budget.id}
                  to={`/finances/budgets/${budget.id}`}
                  className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
                >
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <PiggyBank className="h-6 w-6 text-primary-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="truncate text-sm font-medium text-gray-500">
                            {budget.name}
                          </dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">
                              {formatCurrency(budget.amount, currency)}
                            </div>
                            <div className="ml-2">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  isActive
                                    ? 'bg-green-100 text-green-800'
                                    : isUpcoming
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {isActive ? 'Active' : isUpcoming ? 'Upcoming' : 'Expired'}
                              </span>
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Used: {formatCurrency(budget.used_amount || 0, currency)}</span>
                        <span>{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="mt-1 relative">
                        <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                          <div
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                              percentage > 90
                                ? 'bg-red-500'
                                : percentage > 70
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="mt-4 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Start Date:</span>
                          <span>{format(startDate, 'MMM d, yyyy')}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span>End Date:</span>
                          <span>{format(endDate, 'MMM d, yyyy')}</span>
                        </div>
                      </div>

                      {budget.description && (
                        <div className="mt-4 text-sm text-gray-600">
                          <p className="line-clamp-2">{budget.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={itemsPerPage}
              totalItems={filteredBudgets?.length || 0}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>
        </>
      ) : (
        <div className="text-center py-8 bg-white shadow sm:rounded-lg mt-8">
          <p className="text-sm text-gray-500">
            {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
              ? 'No budgets found matching your search criteria'
              : 'No budgets found. Add your first budget by clicking the "Add Budget" button above.'}
          </p>
        </div>
      )}
    </div>
  );
}

export default BudgetList;