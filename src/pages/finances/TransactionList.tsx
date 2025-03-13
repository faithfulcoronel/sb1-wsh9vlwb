import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useCurrencyStore } from '../../stores/currencyStore';
import { formatCurrency } from '../../utils/currency';
import { DataGrid } from '../../components/ui2/data-grid';
import { Button } from '../../components/ui2/button';
import { Badge } from '../../components/ui2/badge';
import { Card, CardContent } from '../../components/ui2/card';
import { SubscriptionGate } from '../../components/SubscriptionGate';
import { TransactionFilters, TransactionFilter } from '../../components/filters/TransactionFilters';
import {
  Plus,
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  Loader2,
  Calendar,
  DollarSign,
  Users,
  PiggyBank,
  Tag,
} from 'lucide-react';

type Transaction = {
  id: string;
  type: 'income' | 'expense';
  category_id: string;
  amount: number;
  description: string;
  date: string;
  member?: {
    first_name: string;
    last_name: string;
  };
  budget?: {
    name: string;
  };
  category?: {
    name: string;
  };
};

function TransactionList() {
  const navigate = useNavigate();
  const { currency } = useCurrencyStore();
  const [filters, setFilters] = useState<TransactionFilter>({
    searchTerm: '',
    typeFilter: 'all',
    categoryFilter: 'all',
    dateRange: {
      start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    },
    amountRange: {
      min: '',
      max: '',
    },
    entityFilter: '',
  });

  // Get current tenant
  const { data: currentTenant } = useQuery({
    queryKey: ['current-tenant'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_current_tenant');
      if (error) throw error;
      return data?.[0];
    },
  });

  // Get transactions with category info
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', currentTenant?.id, filters.dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          member:member_id (
            first_name,
            last_name
          ),
          budget:budget_id (
            name
          ),
          category:category_id (
            name
          )
        `)
        .eq('tenant_id', currentTenant?.id)
        .gte('date', filters.dateRange.start)
        .lte('date', filters.dateRange.end)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!currentTenant?.id,
  });

  // Get categories
  const { data: categories } = useQuery({
    queryKey: ['categories', currentTenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('tenant_id', currentTenant?.id)
        .eq('is_active', true)
        .in('type', ['income_transaction', 'expense_transaction'])
        .is('deleted_at', null)
        .order('sort_order');

      if (error) throw error;
      return data;
    },
    enabled: !!currentTenant?.id,
  });

  const activeFilters = [
    filters.typeFilter !== 'all' && {
      id: 'type',
      label: filters.typeFilter === 'income' ? 'Income' : 'Expense',
      icon: filters.typeFilter === 'income' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />,
      onRemove: () => handleFilterChange({ typeFilter: 'all' }),
    },
    filters.categoryFilter !== 'all' && {
      id: 'category',
      label: categories?.find(c => c.id === filters.categoryFilter)?.name || 'Unknown Category',
      icon: <Tag className="h-4 w-4" />,
      onRemove: () => handleFilterChange({ categoryFilter: 'all' }),
    },
    (filters.amountRange.min || filters.amountRange.max) && {
      id: 'amount',
      label: `${filters.amountRange.min ? `Min: ${formatCurrency(parseFloat(filters.amountRange.min), currency)}` : ''} ${
        filters.amountRange.max ? `Max: ${formatCurrency(parseFloat(filters.amountRange.max), currency)}` : ''
      }`.trim(),
      icon: <DollarSign className="h-4 w-4" />,
      onRemove: () => handleFilterChange({ amountRange: { min: '', max: '' } }),
    },
    filters.entityFilter && {
      id: 'entity',
      label: `Entity: ${filters.entityFilter}`,
      icon: <Users className="h-4 w-4" />,
      onRemove: () => handleFilterChange({ entityFilter: '' }),
    },
  ].filter(Boolean);

  const handleFilterChange = (newFilters: Partial<TransactionFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      typeFilter: 'all',
      categoryFilter: 'all',
      dateRange: {
        start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
      },
      amountRange: {
        min: '',
        max: '',
      },
      entityFilter: '',
    });
  };

  // Filter and calculate totals
  const { filteredData, totals } = React.useMemo(() => {
    const filtered = (transactions || []).filter((transaction) => {
      const matchesSearch = 
        transaction.description.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        transaction.category?.name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (transaction.member && 
          `${transaction.member.first_name} ${transaction.member.last_name}`
            .toLowerCase()
            .includes(filters.searchTerm.toLowerCase())) ||
        (transaction.budget?.name &&
          transaction.budget.name.toLowerCase().includes(filters.searchTerm.toLowerCase()));
      
      const matchesType = filters.typeFilter === 'all' || transaction.type === filters.typeFilter;
      const matchesCategory = filters.categoryFilter === 'all' || transaction.category_id === filters.categoryFilter;
      
      const matchesAmount = 
        (!filters.amountRange.min || transaction.amount >= parseFloat(filters.amountRange.min)) &&
        (!filters.amountRange.max || transaction.amount <= parseFloat(filters.amountRange.max));

      const matchesEntity = !filters.entityFilter || (
        (transaction.member && 
          `${transaction.member.first_name} ${transaction.member.last_name}`
            .toLowerCase()
            .includes(filters.entityFilter.toLowerCase())) ||
        (transaction.budget?.name &&
          transaction.budget.name.toLowerCase().includes(filters.entityFilter.toLowerCase()))
      );
      
      return matchesSearch && matchesType && matchesCategory && matchesAmount && matchesEntity;
    });

    // Calculate totals
    const totalIncome = filtered.reduce((sum, t) => 
      t.type === 'income' ? sum + t.amount : sum, 0
    );
    const totalExpenses = filtered.reduce((sum, t) => 
      t.type === 'expense' ? sum + t.amount : sum, 0
    );

    return {
      filteredData: filtered,
      totals: {
        income: totalIncome,
        expenses: totalExpenses,
        balance: totalIncome - totalExpenses
      }
    };
  }, [transactions, filters]);

  const columns = [
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => format(new Date(row.original.date), 'MMM d, yyyy'),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge
          variant={row.original.type === 'income' ? 'success' : 'destructive'}
          className="flex items-center space-x-1"
        >
          {row.original.type === 'income' ? (
            <TrendingUp className="h-4 w-4 mr-1" />
          ) : (
            <TrendingDown className="h-4 w-4 mr-1" />
          )}
          <span>{row.original.type}</span>
        </Badge>
      ),
    },
    {
      accessorKey: 'category.name',
      header: 'Category',
    },
    {
      accessorKey: 'description',
      header: 'Description',
    },
    {
      id: 'entity',
      header: 'Member/Budget',
      cell: ({ row }) => {
        const transaction = row.original;
        return (
          <div className="flex items-center">
            {transaction.type === 'income' ? (
              transaction.member && (
                <>
                  <Users className="h-4 w-4 text-muted-foreground mr-1" />
                  {transaction.member.first_name} {transaction.member.last_name}
                </>
              )
            ) : (
              transaction.budget?.name && (
                <>
                  <PiggyBank className="h-4 w-4 text-muted-foreground mr-1" />
                  {transaction.budget.name}
                </>
              )
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <div className="text-right font-medium">
          <span
            className={
              row.original.type === 'income'
                ? 'text-success'
                : 'text-destructive'
            }
          >
            {formatCurrency(row.original.amount, currency)}
          </span>
        </div>
      ),
      footer: () => (
        <div className="text-right font-medium">
          <div className="text-success">
            +{formatCurrency(totals.income, currency)}
          </div>
          <div className="text-destructive">
            -{formatCurrency(totals.expenses, currency)}
          </div>
          <div className={totals.balance >= 0 ? 'text-success' : 'text-destructive'}>
            {formatCurrency(Math.abs(totals.balance), currency)}
            {totals.balance >= 0 ? ' (Net Income)' : ' (Net Loss)'}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/finances')}
          className="flex items-center"
        >
          <ChevronLeft className="h-5 w-5 mr-2" />
          Back to Finances
        </Button>
      </div>

      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-foreground">Transactions</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A list of all financial transactions including income and expenses.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <SubscriptionGate type="transaction">
            <Button
              variant="default"
              onClick={() => navigate('/finances/transactions/add')}
              className="flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </SubscriptionGate>
        </div>
      </div>

      {/* Filters */}
      <TransactionFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={resetFilters}
        activeFilters={activeFilters}
      />

      {/* Transaction List */}
      <div className="mt-6">
        <DataGrid
          columns={columns}
          data={filteredData}
          loading={isLoading}
          toolbar={
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/finances/transactions/bulk')}
              >
                Bulk Entry
              </Button>
            </div>
          }
          pagination={{
            pageSize: 10,
            pageSizeOptions: [5, 10, 20, 50, 100],
          }}
          exportOptions={{
            enabled: true,
            fileName: 'transactions',
            pdf: true,
            excel: true,
          }}
        />
      </div>
    </div>
  );
}

export default TransactionList;