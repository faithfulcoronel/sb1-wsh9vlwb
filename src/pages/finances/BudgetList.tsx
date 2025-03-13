// src/pages/finances/BudgetList.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { useCurrencyStore } from '../../stores/currencyStore';
import { formatCurrency } from '../../utils/currency';
import { Card, CardHeader, CardContent } from '../../components/ui2/card';
import { Button } from '../../components/ui2/button';
import { Input } from '../../components/ui2/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui2/select';
import { Badge } from '../../components/ui2/badge';
import { Progress } from '../../components/ui2/progress';
import { useMessageStore } from '../../components/MessageHandler';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  PiggyBank,
  Loader2,
  Edit2,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui2/alert-dialog';

function BudgetList() {
  const navigate = useNavigate();
  const { currency } = useCurrencyStore();
  const queryClient = useQueryClient();
  const { addMessage } = useMessageStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);

  // Get current tenant
  const { data: currentTenant } = useQuery({
    queryKey: ['current-tenant'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_current_tenant');
      if (error) throw error;
      return data?.[0];
    },
  });

  // Get budget categories
  const { data: categories } = useQuery({
    queryKey: ['categories', 'budget', currentTenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('tenant_id', currentTenant?.id)
        .eq('is_active', true)
        .eq('type', 'budget')
        .is('deleted_at', null)
        .order('sort_order');

      if (error) throw error;
      return data;
    },
    enabled: !!currentTenant?.id,
  });

  // Get budgets with transaction counts
  const { data: budgets, isLoading } = useQuery({
    queryKey: ['budgets', currentTenant?.id],
    queryFn: async () => {
      const { data: budgets, error: budgetsError } = await supabase
        .from('budgets')
        .select(`
          *,
          category:category_id (
            name
          )
        `)
        .eq('tenant_id', currentTenant?.id)
        .order('start_date', { ascending: false });

      if (budgetsError) throw budgetsError;

      // Get transaction counts for each budget
      const budgetsWithUsage = await Promise.all(
        (budgets || []).map(async (budget) => {
          const { data: transactions, error: transactionsError } = await supabase
            .from('financial_transactions')
            .select('amount')
            .eq('budget_id', budget.id)
            .eq('type', 'expense');

          if (transactionsError) throw transactionsError;

          const used_amount = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
          const transaction_count = transactions?.length || 0;

          return {
            ...budget,
            used_amount,
            transaction_count
          };
        })
      );

      return budgetsWithUsage;
    },
    enabled: !!currentTenant?.id,
  });

  // Delete budget mutation
  const deleteBudgetMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      addMessage({
        type: 'success',
        text: 'Budget deleted successfully',
        duration: 3000,
      });
      setDeletingBudgetId(null);
    },
    onError: (error: Error) => {
      addMessage({
        type: 'error',
        text: error.message,
        duration: 5000,
      });
      setDeletingBudgetId(null);
    },
  });

  const handleDelete = (budget: any) => {
    if (budget.transaction_count > 0) {
      addMessage({
        type: 'error',
        text: 'Cannot delete budget with existing transactions',
        duration: 5000,
      });
      return;
    }
    setDeletingBudgetId(budget.id);
  };

  const today = new Date();

  const filteredBudgets = budgets?.filter((budget) => {
    const matchesSearch = 
      budget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      budget.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      budget.category?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || budget.category_id === categoryFilter;
    
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/finances')}
          className="flex items-center"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Finances
        </Button>
      </div>

      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-foreground">Budgets</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A list of all budget allocations and their current status.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link to="/finances/budgets/add">
            <Button
              variant="default"
              className="flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Budget
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-6 sm:flex sm:items-center sm:justify-between">
        <div className="relative max-w-xs">
          <Input
            placeholder="Search budgets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search />}
          />
        </div>

        <div className="mt-4 sm:mt-0 sm:flex sm:space-x-4">
          <div className="relative">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative mt-4 sm:mt-0">
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredBudgets && filteredBudgets.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBudgets.map((budget) => {
            const startDate = new Date(budget.start_date);
            const endDate = new Date(budget.end_date);
            const isActive = startDate <= today && endDate >= today;
            const isUpcoming = startDate > today;
            const percentage = ((budget.used_amount || 0) / budget.amount) * 100;

            return (
              <Card
                key={budget.id}
                className="h-full hover:shadow-lg transition-shadow duration-200"
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex-shrink-0">
                      <PiggyBank className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate(`/finances/budgets/${budget.id}/edit`);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {budget.transaction_count === 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDelete(budget);
                          }}
                          disabled={deletingBudgetId === budget.id}
                        >
                          {deletingBudgetId === budget.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <Link to={`/finances/budgets/${budget.id}`}>
                      <dl>
                        <dt className="truncate text-sm font-medium text-muted-foreground">
                          {budget.name}
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-foreground">
                            {formatCurrency(budget.amount, currency)}
                          </div>
                          <div className="ml-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                isActive
                                  ? 'bg-success/10 text-success'
                                  : isUpcoming
                                  ? 'bg-primary/10 text-primary'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {isActive ? 'Active' : isUpcoming ? 'Upcoming' : 'Expired'}
                            </span>
                          </div>
                        </dd>
                      </dl>

                      <div className="mt-4">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Used: {formatCurrency(budget.used_amount || 0, currency)}</span>
                          <span>{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="mt-1 relative">
                          <Progress
                            value={percentage}
                            variant={
                              percentage > 90
                                ? 'destructive'
                                : percentage > 70
                                ? 'warning'
                                : 'success'
                            }
                          />
                        </div>

                        <div className="mt-4 text-sm text-muted-foreground">
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
                          <div className="mt-4 text-sm text-muted-foreground">
                            <p className="line-clamp-2">{budget.description}</p>
                          </div>
                        )}
                      </div>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="mt-6">
          <CardContent className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                ? 'No budgets found matching your search criteria'
                : 'No budgets found. Add your first budget by clicking the "Add Budget" button above.'}
            </p>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!deletingBudgetId} onOpenChange={() => setDeletingBudgetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle variant="danger">
              Delete Budget
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this budget? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingBudgetId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                try {
                  await deleteBudgetMutation.mutateAsync(deletingBudgetId!);
                } catch (error) {
                  console.error('Error deleting budget:', error);
                }
              }}
            >
              {deleteBudgetMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default BudgetList;
