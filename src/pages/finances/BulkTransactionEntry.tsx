import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import Select from 'react-select';
import { supabase } from '../../lib/supabase';
import { useCurrencyStore } from '../../stores/currencyStore';
import { formatCurrency } from '../../utils/currency';
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Plus,
  Minus,
  Trash2,
  Calculator,
  PieChart,
} from 'lucide-react';

type Transaction = {
  id?: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  member_id?: string;
  budget_id?: string;
  created_by?: string;
};

type Member = {
  id: string;
  first_name: string;
  last_name: string;
};

type Budget = {
  id: string;
  name: string;
  category: string;
  amount: number;
  used_amount: number;
};

type SelectOption = {
  value: string;
  label: string;
};

function BulkTransactionEntry() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currency } = useCurrencyStore();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');
  const [transactions, setTransactions] = useState<Partial<Transaction>[]>([{
    type: 'income', // This will be updated when we change transaction type
    amount: 0,
    category: 'tithe',
    description: '',
    date: new Date().toISOString().split('T')[0],
  }]);

  // Refs for handling keyboard navigation
  const tableRef = useRef<HTMLTableElement>(null);

  // Calculate running total
  const runningTotal = useMemo(() => 
    transactions.reduce((sum, t) => sum + (t.amount || 0), 0),
    [transactions]
  );

  // Calculate category totals
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.category && t.amount) {
        totals[t.category] = (totals[t.category] || 0) + t.amount;
      }
    });
    return totals;
  }, [transactions]);

  // Fetch members and budgets
  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name')
        .is('deleted_at', null)
        .order('first_name');

      if (error) throw error;
      return data as Member[];
    },
  });

  const { data: budgets } = useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Budget[];
    },
  });

  const memberOptions = useMemo(() => 
    members?.map(member => ({
      value: member.id,
      label: `${member.first_name} ${member.last_name}`
    })) || [],
    [members]
  );

  const budgetOptions = useMemo(() => 
    budgets?.map(budget => ({
      value: budget.id,
      label: `${budget.name} (${formatCurrency(budget.amount - budget.used_amount, currency)} remaining)`
    })) || [],
    [budgets, currency]
  );

  const categoryOptions = {
    income: [
      { value: 'tithe', label: 'Tithe' },
      { value: 'first_fruit_offering', label: 'First Fruit Offering' },
      { value: 'love_offering', label: 'Love Offering' },
      { value: 'mission_offering', label: 'Mission Offering' },
      { value: 'mission_pledge', label: 'Mission Pledge' },
      { value: 'building_offering', label: 'Building Offering' },
      { value: 'lot_offering', label: 'Lot Offering' },
      { value: 'other', label: 'Other' }
    ],
    expense: [
      { value: 'ministry_expense', label: 'Ministry Expense' },
      { value: 'payroll', label: 'Payroll' },
      { value: 'utilities', label: 'Utilities' },
      { value: 'maintenance', label: 'Maintenance' },
      { value: 'events', label: 'Events' },
      { value: 'missions', label: 'Missions' },
      { value: 'education', label: 'Education' },
      { value: 'other', label: 'Other' }
    ]
  };

  const addTransactionsMutation = useMutation({
    mutationFn: async (transactions: Partial<Transaction>[]) => {
      // Get current user ID first
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');

      // Prepare transactions with user ID and correct type
      const transactionsWithUser = transactions.map(t => ({
        ...t,
        type: transactionType, // Use the current transaction type
        created_by: user.id
      }));

      // Insert all transactions
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
        category: transactionType === 'income' ? 'tithe' : 'ministry_expense',
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
      t.category && 
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

  const handleAddRow = () => {
    const lastTransaction = transactions[transactions.length - 1];
    setTransactions([...transactions, {
      type: transactionType,
      amount: 0,
      category: lastTransaction.category,
      description: '',
      date: lastTransaction.date,
      member_id: transactionType === 'income' ? lastTransaction.member_id : undefined,
      budget_id: transactionType === 'expense' ? lastTransaction.budget_id : undefined,
    }]);
  };

  const handleRemoveRow = (index: number) => {
    if (transactions.length > 1) {
      setTransactions(transactions.filter((_, i) => i !== index));
    }
  };

  const handleInputChange = (
    index: number,
    field: keyof Transaction,
    value: string | number | SelectOption | null
  ) => {
    const newTransactions = [...transactions];
    if (value && typeof value === 'object' && 'value' in value) {
      newTransactions[index] = {
        ...newTransactions[index],
        [field]: value.value,
      };
    } else {
      newTransactions[index] = {
        ...newTransactions[index],
        [field]: field === 'amount' ? Number(value) : value,
      };
    }
    setTransactions(newTransactions);
  };

  // Handle transaction type change
  const handleTransactionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as 'income' | 'expense';
    setTransactionType(newType);
    
    // Update all existing transactions with the new type and appropriate category
    setTransactions(transactions.map(t => ({
      type: newType,
      amount: t.amount || 0,
      category: newType === 'income' ? 'tithe' : 'ministry_expense',
      description: t.description || '',
      date: t.date || new Date().toISOString().split('T')[0],
      member_id: newType === 'income' ? t.member_id : undefined,
      budget_id: newType === 'expense' ? t.budget_id : undefined,
    })));
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    index: number,
    field: keyof Transaction
  ) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      
      if (e.shiftKey) {
        // Handle Shift+Tab - move to previous input
        const row = (e.target as HTMLElement).closest('tr');
        if (!row) return;

        const inputs = Array.from(row.querySelectorAll('input, .react-select__input'));
        const currentIndex = inputs.indexOf(e.target as HTMLElement);
        
        if (currentIndex > 0) {
          // Move to previous input in the same row
          const prevInput = inputs[currentIndex - 1];
          if (prevInput) {
            (prevInput as HTMLElement).focus();
          }
        } else if (index > 0) {
          // Move to last input of previous row
          const prevRow = row.previousElementSibling;
          if (prevRow) {
            const prevInputs = Array.from(prevRow.querySelectorAll('input, .react-select__input'));
            const lastInput = prevInputs[prevInputs.length - 1];
            if (lastInput) {
              (lastInput as HTMLElement).focus();
            }
          }
        }
      } else {
        // Handle Tab/Enter - move to next input
        const row = (e.target as HTMLElement).closest('tr');
        if (!row) return;

        const inputs = Array.from(row.querySelectorAll('input, .react-select__input'));
        const currentIndex = inputs.indexOf(e.target as HTMLElement);
        
        if (currentIndex < inputs.length - 1) {
          // Move to next input in the same row
          const nextInput = inputs[currentIndex + 1];
          if (nextInput) {
            (nextInput as HTMLElement).focus();
          }
        } else if (index === transactions.length - 1) {
          // Last input of last row - create new row and focus its first input
          handleAddRow();
          setTimeout(() => {
            const newRow = tableRef.current?.querySelector('tr:last-child');
            if (newRow) {
              const categorySelect = newRow.querySelector('.react-select__input');
              if (categorySelect) {
                (categorySelect as HTMLElement).focus();
              }
            }
          }, 0);
        } else {
          // Move to first input of next row
          const nextRow = row.nextElementSibling;
          if (nextRow) {
            const categorySelect = nextRow.querySelector('.react-select__input');
            if (categorySelect) {
              (categorySelect as HTMLElement).focus();
            }
          }
        }
      }
    }
  };

  const selectStyles = {
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
    menu: (base: any) => ({ ...base, zIndex: 9999 }),
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
          <h1 className="text-2xl font-semibold text-gray-900">Bulk Transaction Entry</h1>
          <p className="mt-2 text-sm text-gray-700">
            Enter multiple {transactionType} transactions at once
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calculator className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              Total: {formatCurrency(runningTotal, currency)}
            </span>
          </div>
          <select
            value={transactionType}
            onChange={handleTransactionTypeChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
      </div>

      {/* Category Totals */}
      <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <PieChart className="h-5 w-5 mr-2 text-gray-400" />
            Category Totals
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(categoryTotals).map(([category, total]) => (
              <div key={category} className="bg-gray-50 px-4 py-3 rounded-lg">
                <dt className="text-sm font-medium text-gray-500">
                  {categoryOptions[transactionType].find(opt => opt.value === category)?.label || category}
                </dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">
                  {formatCurrency(total, currency)}
                </dd>
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-md bg-green-50 p-4">
          <div className="flex">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">{success}</h3>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8">
        <div className="overflow-x-auto">
          <table ref={tableRef} className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                  Date
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  {transactionType === 'income' ? 'Member' : 'Budget'}
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Category
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Amount
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Description
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {transactions.map((transaction, index) => (
                <tr key={index}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                    <input
                      type="date"
                      value={transaction.date || ''}
                      onChange={(e) => handleInputChange(index, 'date', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index, 'date')}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      required
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    {transactionType === 'income' ? (
                      <Select
                        value={memberOptions.find(option => option.value === transaction.member_id)}
                        onChange={(option) => handleInputChange(index, 'member_id', option)}
                        options={memberOptions}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        isSearchable
                        required
                        placeholder="Select Member"
                        menuPortalTarget={document.body}
                        styles={selectStyles}
                      />
                    ) : (
                      <Select
                        value={budgetOptions.find(option => option.value === transaction.budget_id)}
                        onChange={(option) => handleInputChange(index, 'budget_id', option)}
                        options={budgetOptions}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        isSearchable
                        required
                        placeholder="Select Budget"
                        menuPortalTarget={document.body}
                        styles={selectStyles}
                      />
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <Select
                      value={categoryOptions[transactionType].find(option => option.value === transaction.category)}
                      onChange={(option) => handleInputChange(index, 'category', option)}
                      options={categoryOptions[transactionType]}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      isSearchable
                      required
                      placeholder="Select Category"
                      menuPortalTarget={document.body}
                      styles={selectStyles}
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <div className="relative rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                        <span className="text-gray-500 sm:text-sm">{currency.symbol}</span>
                      </div>
                      <input
                        type="number"
                        value={transaction.amount || ''}
                        onChange={(e) => handleInputChange(index, 'amount', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index, 'amount')}
                        className="block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <input
                      type="text"
                      value={transaction.description || ''}
                      onChange={(e) => handleInputChange(index, 'description', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index, 'description')}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="Enter description..."
                    />
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(index)}
                      className="text-red-600 hover:text-red-900"
                      disabled={transactions.length === 1}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </button>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => {
                setTransactions([{
                  type: transactionType,
                  amount: 0,
                  category: transactionType === 'income' ? 'tithe' : 'ministry_expense',
                  description: '',
                  date: new Date().toISOString().split('T')[0],
                }]);
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Clear All
            </button>
            <button
              type="submit"
              disabled={addTransactionsMutation.isPending}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
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
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default BulkTransactionEntry;