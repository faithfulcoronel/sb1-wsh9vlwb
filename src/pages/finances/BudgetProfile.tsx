import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { useCurrencyStore } from '../../stores/currencyStore';
import { formatCurrency } from '../../utils/currency';
import { Card, CardHeader, CardContent } from '../../components/ui2/card';
import { Button } from '../../components/ui2/button';
import { Badge } from '../../components/ui2/badge';
import { Progress } from '../../components/ui2/progress';
import {
  ArrowLeft,
  PiggyBank,
  Calendar,
  DollarSign,
  Loader2,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  BarChart3,
} from 'lucide-react';

type Budget = {
  id: string;
  name: string;
  amount: number;
  start_date: string;
  end_date: string;
  category_id: string;
  description: string | null;
  category: {
    name: string;
  };
};

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
  category: {
    name: string;
  };
};

function BudgetProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currency } = useCurrencyStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Get current tenant
  const { data: currentTenant } = useQuery({
    queryKey: ['current-tenant'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_current_tenant');
      if (error) throw error;
      return data?.[0];
    },
  });

  // Get budget data
  const { data: budget, isLoading: budgetLoading } = useQuery({
    queryKey: ['budget', id, currentTenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select(`
          *,
          category:category_id (
            name
          )
        `)
        .eq('id', id)
        .eq('tenant_id', currentTenant?.id)
        .single();

      if (error) throw error;
      return data as Budget;
    },
    enabled: !!id && !!currentTenant?.id,
  });

  // Get transactions for this budget
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['budget-transactions', id, currentTenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          member:member_id (
            first_name,
            last_name
          ),
          category:category_id (
            name
          )
        `)
        .eq('budget_id', id)
        .eq('tenant_id', currentTenant?.id)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!id && !!currentTenant?.id,
  });

  const filteredTransactions = transactions?.filter((transaction) => {
    const matchesSearch = 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.member && 
        `${transaction.member.first_name} ${transaction.member.last_name}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));
    
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || transaction.category_id === categoryFilter;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  const totalExpenses = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  const remainingBudget = budget ? budget.amount - totalExpenses : 0;
  const usagePercentage = budget ? (totalExpenses / budget.amount) * 100 : 0;

  if (budgetLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!budget) {
    return (
      <Card className="text-center py-8">
        <h3 className="text-lg font-medium text-foreground">Budget not found</h3>
      </Card>
    );
  }

  const today = new Date();
  const startDate = new Date(budget.start_date);
  const endDate = new Date(budget.end_date);
  const isActive = startDate <= today && endDate >= today;
  const isUpcoming = startDate > today;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/finances/budgets')}
          className="flex items-center"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Budgets
        </Button>
      </div>

      {/* Budget Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <PiggyBank className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-foreground">{budget.name}</h2>
                <p className="text-sm text-muted-foreground">{budget.category.name}</p>
              </div>
            </div>
            <Badge
              variant={
                isActive
                  ? 'success'
                  : isUpcoming
                  ? 'primary'
                  : 'secondary'
              }
            >
              {isActive ? 'Active' : isUpcoming ? 'Upcoming' : 'Expired'}
            </Badge>
          </div>
        </CardContent>

        <CardContent className="border-t border-border px-6 py-5">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-muted-foreground flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Budget Amount
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-foreground">
                {formatCurrency(budget.amount, currency)}
              </dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-muted-foreground flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Date Range
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}
              </dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-muted-foreground flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Budget Usage
              </dt>
              <dd className="mt-1">
                <div className="flex items-center">
                  <div className="flex-1">
                    <Progress
                      value={usagePercentage}
                      variant={
                        usagePercentage > 90
                          ? 'destructive'
                          : usagePercentage > 70
                          ? 'warning'
                          : 'success'
                      }
                    />
                  </div>
                  <span className="ml-2 text-sm font-medium text-foreground">
                    {usagePercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {formatCurrency(remainingBudget, currency)} remaining
                </div>
              </dd>
            </div>

            {budget.description && (
              <div className="sm:col-span-3">
                <dt className="text-sm font-medium text-muted-foreground">Description</dt>
                <dd className="mt-1 text-sm text-foreground">{budget.description}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Transactions Section */}
      <div className="mt-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h3 className="text-lg font-medium text-foreground flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Transaction History
            </h3>
          </div>
        </div>

        {transactionsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredTransactions && filteredTransactions.length > 0 ? (
          <Card className="mt-4">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {format(new Date(transaction.date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Badge
                        variant={transaction.type === 'income' ? 'success' : 'destructive'}
                        className="flex items-center space-x-1"
                      >
                        {transaction.type === 'income' ? (
                          <TrendingUp className="h-4 w-4 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 mr-1" />
                        )}
                        <span>{transaction.type}</span>
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {transaction.category.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {transaction.member
                        ? `${transaction.member.first_name} ${transaction.member.last_name}`
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      <span
                        className={
                          transaction.type === 'income'
                            ? 'text-success'
                            : 'text-destructive'
                        }
                      >
                        {formatCurrency(transaction.amount, currency)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : (
          <Card className="mt-4">
            <CardContent className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                {searchTerm || typeFilter !== 'all' || categoryFilter !== 'all'
                  ? 'No transactions found matching your search criteria'
                  : 'No transactions found for this budget'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default BudgetProfile;