import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useCurrencyStore } from '../../stores/currencyStore';
import { formatCurrency } from '../../utils/currency';
import { Card, CardHeader, CardContent } from '../../components/ui2/card';
import { Input } from '../../components/ui2/input';
import { Button } from '../../components/ui2/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui2/select';
import { DatePickerInput } from '../../components/ui2/date-picker';
import { Combobox } from '../../components/ui2/combobox';
import {
  ArrowLeft,
  Save,
  Loader2,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

type Transaction = {
  type: 'income' | 'expense';
  category_id: string;
  amount: number;
  description: string;
  date: string;
  budget_id?: string;
  member_id?: string;
};

function TransactionAdd() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currency } = useCurrencyStore();
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Transaction>({
    type: 'income',
    category_id: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
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

  // Get budgets
  const { data: budgets } = useQuery({
    queryKey: ['budgets', currentTenant?.id],
    queryFn: async () => {
      const today = new Date().toISOString();
      
      // Get active budgets
      const { data: budgets, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .eq('tenant_id', currentTenant?.id)
        .lte('start_date', today)
        .gte('end_date', today);

      if (budgetsError) throw budgetsError;

      // Get used amounts for each budget
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

      return budgetsWithUsage;
    },
    enabled: !!currentTenant?.id,
  });

  // Get members
  const { data: members } = useQuery({
    queryKey: ['members', currentTenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name')
        .eq('tenant_id', currentTenant?.id)
        .is('deleted_at', null)
        .order('last_name');

      if (error) throw error;
      return data;
    },
    enabled: !!currentTenant?.id,
  });

  // Get categories based on transaction type
  const { data: categories } = useQuery({
    queryKey: ['categories', formData.type, currentTenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('tenant_id', currentTenant?.id)
        .eq('is_active', true)
        .eq('type', `${formData.type}_transaction`)
        .is('deleted_at', null)
        .order('sort_order');

      if (error) throw error;
      return data;
    },
    enabled: !!currentTenant?.id,
  });

  const addTransactionMutation = useMutation({
    mutationFn: async (data: Transaction) => {
      const { data: newTransaction, error } = await supabase
        .from('financial_transactions')
        .insert([{
          ...data,
          tenant_id: currentTenant?.id,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return newTransaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['finance-stats'] });
      navigate('/finances/transactions');
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category_id || !formData.amount || !formData.description || !formData.date) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.type === 'income' && !formData.member_id) {
      setError('Please select a member for income transactions');
      return;
    }

    if (formData.type === 'expense' && !formData.budget_id) {
      setError('Please select a budget for expense transactions');
      return;
    }

    try {
      await addTransactionMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const handleInputChange = (
    field: keyof Transaction,
    value: string | number
  ) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value,
      };

      // Clear category when changing type
      if (field === 'type') {
        newData.category_id = '';
      }

      // Clear member/budget when changing type
      if (field === 'type') {
        if (value === 'income') {
          delete newData.budget_id;
        } else {
          delete newData.member_id;
        }
      }

      return newData;
    });
  };

  const budgetOptions = React.useMemo(() => 
    budgets?.map(b => ({
      value: b.id,
      label: `${b.name} (${formatCurrency(b.amount - (b.used_amount || 0), currency)} remaining)`
    })) || [], 
    [budgets, currency]
  );

  const memberOptions = React.useMemo(() => 
    members?.map(m => ({
      value: m.id,
      label: `${m.first_name} ${m.last_name}`
    })) || [], 
    [members]
  );

  const categoryOptions = React.useMemo(() => 
    categories?.map(c => ({
      value: c.id,
      label: c.name
    })) || [],
    [categories]
  );

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

      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium text-foreground">Add New Transaction</h3>
          <p className="text-sm text-muted-foreground">
            Record a new financial transaction
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2 text-success" />
                        Income
                      </div>
                    </SelectItem>
                    <SelectItem value="expense">
                      <div className="flex items-center">
                        <TrendingDown className="h-4 w-4 mr-2 text-destructive" />
                        Expense
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Combobox
                  options={categoryOptions}
                  value={formData.category_id}
                  onChange={(value) => handleInputChange('category_id', value)}
                  placeholder="Select Category"
                />
              </div>

              <div>
                <Input
                  type="number"
                  value={formData.amount || ''}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  icon={<DollarSign className="h-4 w-4" />}
                  placeholder="Amount"
                  min={0}
                  step="0.01"
                />
              </div>

              <div>
                <DatePickerInput
                  value={formData.date ? new Date(formData.date) : undefined}
                  onChange={(date) => handleInputChange(
                    'date',
                    date?.toISOString().split('T')[0] || ''
                  )}
                  placeholder="Date"
                />
              </div>

              {formData.type === 'expense' ? (
                <div>
                  <Combobox
                    options={budgetOptions}
                    value={formData.budget_id}
                    onChange={(value) => handleInputChange('budget_id', value)}
                    placeholder="Select Budget"
                  />
                </div>
              ) : (
                <div>
                  <Combobox
                    options={memberOptions}
                    value={formData.member_id}
                    onChange={(value) => handleInputChange('member_id', value)}
                    placeholder="Select Member"
                  />
                </div>
              )}

              <div className="sm:col-span-2">
                <Input
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/15 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-destructive">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/finances')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addTransactionMutation.isPending}
              >
                {addTransactionMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Add Transaction
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default TransactionAdd;