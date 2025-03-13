import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useCurrencyStore } from '../../stores/currencyStore';
import { formatCurrency } from '../../utils/currency';
import { groupBy } from 'lodash-es';
import { Card } from '../../components/ui2/card';
import { Input } from '../../components/ui2/input';
import { Button } from '../../components/ui2/button';
import { DatePickerInput } from '../../components/ui2/date-picker';
import { Combobox } from '../../components/ui2/combobox';
import { Badge } from '../../components/ui2/badge';
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calculator,
  PieChart,
  Users,
} from 'lucide-react';

type Transaction = {
  id?: string;
  type: 'income' | 'expense';
  category_id: string;
  amount: number;
  description: string;
  date: string;
  member_id?: string;
  budget_id?: string;
  created_by?: string;
};

function BulkTransactionEntry() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currency } = useCurrencyStore();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');
  const [transactions, setTransactions] = useState<Partial<Transaction>[]>([{
    type: 'income',
    amount: 0,
    category_id: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  }]);

  // Get current tenant
  const { data: currentTenant } = useQuery({
    queryKey: ['current-tenant'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_current_tenant');
      if (error) throw error;
      return data?.[0];
    },
  });

  // Fetch members
  const { data: members } = useQuery({
    queryKey: ['members'],
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

  // Fetch budgets
  const { data: budgets } = useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('tenant_id', currentTenant?.id)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!currentTenant?.id,
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories', transactionType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('tenant_id', currentTenant?.id)
        .eq('is_active', true)
        .eq('type', transactionType === 'income' ? 'income_transaction' : 'expense_transaction')
        .is('deleted_at', null)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!currentTenant?.id,
  });

  const addTransactionsMutation = useMutation({
    mutationFn: async (transactions: Partial<Transaction>[]) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');

      const transactionsWithUser = transactions.map(t => ({
        ...t,
        type: transactionType,
        tenant_id: currentTenant?.id,
        created_by: user.id
      }));

      const { data, error } = await supabase
        .from('financial_transactions')
        .insert(transactionsWithUser)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['finance-stats'] });
      setSuccess('Transactions added successfully');
      setTransactions([{
        type: transactionType,
        amount: 0,
        category_id: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      }]);
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (error: Error) => {
      setError(error.message);
      setTimeout(() => setError(null), 5000);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validTransactions = transactions.filter(t => 
      t.amount && t.amount > 0 && 
      t.category_id && 
      t.date &&
      ((transactionType === 'income' && t.member_id) || 
       (transactionType === 'expense' && t.budget_id))
    );

    if (validTransactions.length === 0) {
      setError('Please fill in all required fields for at least one transaction');
      return;
    }

    try {
      await addTransactionsMutation.mutateAsync(validTransactions);
    } catch (error) {
      console.error('Error adding transactions:', error);
    }
  };

  const handleAddRow = (copyPrevious = true) => {
    const lastTransaction = transactions[transactions.length - 1];
    setTransactions([...transactions, {
      type: transactionType,
      amount: 0,
      category_id: copyPrevious ? lastTransaction.category_id : '',
      description: '',
      date: copyPrevious ? lastTransaction.date : new Date().toISOString().split('T')[0],
      member_id: copyPrevious ? lastTransaction.member_id : undefined,
      budget_id: copyPrevious ? lastTransaction.budget_id : undefined,
    }]);
  };

  const handleRemoveRow = (index: number) => {
    if (transactions.length > 1) {
      setTransactions(transactions.filter((_, i) => i !== index));
    }
  };

  const handleInputChange = (index: number, field: keyof Transaction, value: any) => {
    const newTransactions = [...transactions];
    newTransactions[index] = {
      ...newTransactions[index],
      [field]: field === 'amount' ? (value === '' ? 0 : Number(value)) : value,
    };
    setTransactions(newTransactions);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number, field: keyof Transaction) => {
    if (e.key === 'Tab' && !e.shiftKey && index === transactions.length - 1) {
      e.preventDefault();
      handleAddRow(true);
    }
  };

  const memberOptions = React.useMemo(() => 
    members?.map(m => ({
      value: m.id,
      label: `${m.first_name} ${m.last_name}`
    })) || [], 
    [members]
  );

  const budgetOptions = React.useMemo(() => 
    budgets?.map(b => ({
      value: b.id,
      label: `${b.name} (${formatCurrency(b.amount - (b.used_amount || 0), currency)} remaining)`
    })) || [],
    [budgets, currency]
  );

  const categoryOptions = React.useMemo(() => 
    categories?.map(c => ({
      value: c.id,
      label: c.name
    })) || [],
    [categories]
  );

  // Calculate running totals
  const runningTotals = useMemo(() => {
    // Calculate total with proper decimal handling
    const total = Number(transactions.reduce((sum, t) => {
      const amount = Number(t.amount) || 0;
      return Number((sum + amount).toFixed(2));
    }, 0));

    // Calculate category totals with proper decimal handling
    const categoryTotals: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.category_id && t.amount) {
        const amount = Number(t.amount) || 0;
        const currentTotal = categoryTotals[t.category_id] || 0;
        categoryTotals[t.category_id] = Number((currentTotal + amount).toFixed(2));
      }
    });

    // Calculate person totals with proper decimal handling
    const personTotals: Record<string, number> = {};
    transactions.forEach(t => {
      const personId = transactionType === 'income' ? t.member_id : t.budget_id;
      if (personId && t.amount) {
        const amount = Number(t.amount) || 0;
        const currentTotal = personTotals[personId] || 0;
        personTotals[personId] = Number((currentTotal + amount).toFixed(2));
      }
    });

    return {
      total,
      categoryTotals,
      personTotals
    };
  }, [transactions, transactionType]);

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
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

      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Bulk Transaction Entry</h1>
          <p className="mt-2 text-sm text-gray-700">
            Add multiple transactions at once
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex flex-col sm:items-end space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white rounded-lg shadow-sm p-1 border border-gray-200">
              <Button
                type="button"
                onClick={() => setTransactionType('income')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  transactionType === 'income'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <TrendingUp className={`h-4 w-4 mr-2 ${
                  transactionType === 'income' ? 'text-primary-600' : 'text-gray-400'
                }`} />
                Income
              </Button>
              <Button
                type="button"
                onClick={() => setTransactionType('expense')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  transactionType === 'expense'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <TrendingDown className={`h-4 w-4 mr-2 ${
                  transactionType === 'expense' ? 'text-primary-600' : 'text-gray-400'
                }`} />
                Expense
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Running Totals */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
        {/* Overall Total */}
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calculator className="h-5 w-5 text-primary mr-2" />
                <h3 className="text-sm font-medium text-gray-900">Running Total</h3>
              </div>
              <Badge variant={transactionType === 'income' ? 'success' : 'destructive'}>
                {transactionType === 'income' ? 'Income' : 'Expense'}
              </Badge>
            </div>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {formatCurrency(runningTotals.total || 0, currency)}
            </p>
          </div>
        </Card>

        {/* Category Breakdown */}
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <PieChart className="h-5 w-5 text-primary mr-2" />
              <h3 className="text-sm font-medium text-gray-900">By Category</h3>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
              {Object.entries(runningTotals.categoryTotals).map(([categoryId, amount]) => {
                const category = categories?.find(c => c.id === categoryId);
                return (
                  <div key={categoryId} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-600 truncate mr-2">
                      {category?.name || 'Unknown'}
                    </span>
                    <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                      {formatCurrency(amount || 0, currency)}
                    </span>
                  </div>
                );
              })}
              {Object.keys(runningTotals.categoryTotals).length === 0 && (
                <div className="text-sm text-gray-500 text-center py-2">
                  No categories yet
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Person Breakdown */}
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <Users className="h-5 w-5 text-primary mr-2" />
              <h3 className="text-sm font-medium text-gray-900">
                By {transactionType === 'income' ? 'Member' : 'Budget'}
              </h3>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
              {Object.entries(runningTotals.personTotals).map(([personId, amount]) => {
                const person = transactionType === 'income'
                  ? members?.find(m => m.id === personId)
                  : budgets?.find(b => b.id === personId);
                const label = transactionType === 'income'
                  ? person ? `${person.first_name} ${person.last_name}` : 'Unknown'
                  : person?.name || 'Unknown';
                return (
                  <div key={personId} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-600 truncate mr-2">
                      {label}
                    </span>
                    <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                      {formatCurrency(amount || 0, currency)}
                    </span>
                  </div>
                );
              })}
              {Object.keys(runningTotals.personTotals).length === 0 && (
                <div className="text-sm text-gray-500 text-center py-2">
                  No {transactionType === 'income' ? 'members' : 'budgets'} yet
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Error and Success messages */}
      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">{success}</h3>
            </div>
          </div>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {transactionType === 'income' ? 'Member' : 'Budget'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <DatePickerInput
                          value={transaction.date ? new Date(transaction.date) : undefined}
                          onChange={(date) => handleInputChange(
                            index,
                            'date',
                            date?.toISOString().split('T')[0]
                          )}
                          onKeyDown={(e) => handleKeyDown(e, index, 'date')}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Combobox
                          options={transactionType === 'income' ? memberOptions : budgetOptions}
                          value={transactionType === 'income' ? transaction.member_id : transaction.budget_id}
                          onChange={(value) => handleInputChange(
                            index,
                            transactionType === 'income' ? 'member_id' : 'budget_id',
                            value
                          )}
                          placeholder={transactionType === 'income' ? 'Select Member' : 'Select Budget'}
                          onKeyDown={(e) => handleKeyDown(e, index, transactionType === 'income' ? 'member_id' : 'budget_id')}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Combobox
                          options={categoryOptions}
                          value={transaction.category_id}
                          onChange={(value) => handleInputChange(index, 'category_id', value)}
                          placeholder="Select Category"
                          onKeyDown={(e) => handleKeyDown(e, index, 'category_id')}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Input
                          type="number"
                          value={transaction.amount || ''}
                          onChange={(e) => handleInputChange(index, 'amount', e.target.value)}
                          icon={<DollarSign className="h-4 w-4" />}
                          min={0}
                          step="0.01"
                          className='min-w-32'
                          onKeyDown={(e) => handleKeyDown(e, index, 'amount')}
                          onBlur={(e) => {
                            const value = Number(e.target.value);
                            if (!isNaN(value)) {
                              handleInputChange(index, 'amount', value);
                            }
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Input
                          value={transaction.description || ''}
                          className='min-w-32'
                          onChange={(e) => handleInputChange(index, 'description', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, index, 'description')}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRow(index)}
                          disabled={transactions.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-between">
              <Button
                type="button"
                onClick={() => handleAddRow(false)}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Row
              </Button>

              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/finances')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addTransactionsMutation.isPending}
                >
                  {addTransactionsMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="-ml-1 mr-2 h-5 w-5" />
                      Save All
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default BulkTransactionEntry;