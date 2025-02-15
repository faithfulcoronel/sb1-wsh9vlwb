import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useCurrencyStore } from '../../stores/currencyStore';
import { formatCurrency } from '../../utils/currency';
import { parse, format, isValid } from 'date-fns';
import * as XLSX from 'xlsx';
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Upload,
  Plus,
  Minus,
  Download,
} from 'lucide-react';

type BulkEntry = {
  budget_id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
};

type Budget = {
  id: string;
  name: string;
  category: string;
  amount: number;
  used_amount: number;
};

function BulkExpenseEntry() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currency } = useCurrencyStore();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [entries, setEntries] = useState<BulkEntry[]>([{
    budget_id: '',
    amount: 0,
    category: 'ministry_expense',
    description: '',
    date: new Date().toISOString().split('T')[0],
  }]);

  const { data: budgets } = useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const today = new Date().toISOString();
      
      // Get active budgets
      const { data: budgets, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
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

      return budgetsWithUsage as Budget[];
    },
  });

  const addBulkEntriesMutation = useMutation({
    mutationFn: async (entries: BulkEntry[]) => {
      const user = (await supabase.auth.getUser()).data.user;

      // Process entries sequentially to validate budget limits
      const processedEntries = await Promise.all(entries.map(async (entry, index) => {
        // Get current budget usage
        const budget = budgets?.find(b => b.id === entry.budget_id);
        if (!budget) {
          throw new Error(`Budget not found for entry #${index + 1}`);
        }

        const remainingBudget = budget.amount - budget.used_amount;
        if (entry.amount > remainingBudget) {
          throw new Error(
            `Entry #${index + 1} amount (${formatCurrency(entry.amount, currency)}) ` +
            `exceeds remaining budget for ${budget.name} ` +
            `(${formatCurrency(remainingBudget, currency)})`
          );
        }

        return {
          type: 'expense' as const,
          budget_id: entry.budget_id,
          amount: entry.amount,
          category: entry.category,
          description: entry.description || '',
          date: entry.date,
          created_by: user?.id,
        };
      }));

      const { data, error } = await supabase
        .from('financial_transactions')
        .insert(processedEntries)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['finance-stats'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setSuccess('Successfully added bulk entries');
      setEntries([{
        budget_id: '',
        amount: 0,
        category: 'ministry_expense',
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
    
    const validEntries = entries.filter(entry => 
      entry.budget_id && 
      entry.amount > 0 && 
      entry.category && 
      entry.date
    );

    if (validEntries.length === 0) {
      setError('Please fill in all required fields for at least one entry');
      return;
    }

    try {
      await addBulkEntriesMutation.mutateAsync(validEntries);
    } catch (error) {
      console.error('Error adding bulk entries:', error);
    }
  };

  const handleAddRow = () => {
    setEntries([...entries, {
      budget_id: '',
      amount: 0,
      category: 'ministry_expense',
      description: '',
      date: new Date().toISOString().split('T')[0],
    }]);
  };

  const handleRemoveRow = (index: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((_, i) => i !== index));
    }
  };

  const handleInputChange = (index: number, field: keyof BulkEntry, value: string | number) => {
    const newEntries = [...entries];
    newEntries[index] = {
      ...newEntries[index],
      [field]: field === 'amount' ? Number(value) : value,
    };
    setEntries(newEntries);
  };

  const parseDate = (dateStr: string): string | null => {
    const formats = [
      'yyyy-MM-dd',    // 2025-02-12
      'MM/dd/yyyy',    // 02/12/2025
      'M/d/yyyy',      // 2/12/2025
      'dd/MM/yyyy',    // 12/02/2025
      'MM-dd-yyyy',    // 02-12-2025
      'yyyy/MM/dd',    // 2025/02/12
    ];

    for (const formatStr of formats) {
      const parsedDate = parse(dateStr, formatStr, new Date());
      if (isValid(parsedDate)) {
        return format(parsedDate, 'yyyy-MM-dd');
      }
    }

    return null;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const rows = text.split('\n');
      const headers = rows[0].split(',').map(h => h.trim().toLowerCase());

      const requiredHeaders = ['budget_id', 'amount', 'category', 'date'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

      if (missingHeaders.length > 0) {
        throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
      }

      const parsedEntries: BulkEntry[] = rows.slice(1)
        .filter(row => row.trim())
        .map((row, index) => {
          const values = row.split(',').map(v => v.trim());
          const entry: any = {};
          
          headers.forEach((header, i) => {
            if (header === 'amount') {
              const amount = parseFloat(values[i]);
              if (isNaN(amount)) {
                throw new Error(`Invalid amount in row ${index + 2}: ${values[i]}`);
              }
              entry[header] = amount;
            } else if (header === 'date') {
              const parsedDate = parseDate(values[i]);
              if (!parsedDate) {
                throw new Error(`Invalid date format in row ${index + 2}: ${values[i]}`);
              }
              entry[header] = parsedDate;
            } else {
              entry[header] = values[i];
            }
          });

          if (!entry.budget_id) {
            throw new Error(`Missing budget_id in row ${index + 2}`);
          }

          if (!entry.category) {
            throw new Error(`Missing category in row ${index + 2}`);
          }

          return entry;
        });

      setEntries(parsedEntries);
      setSuccess('CSV file successfully loaded');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error parsing CSV file');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadSampleCSV = () => {
    const wb = XLSX.utils.book_new();

    // Transactions sheet (template)
    const transactionsData = [
      ['budget_id', 'amount', 'category', 'date', 'description'],
      ['budget-uuid', 1000, 'ministry_expense', '2025-02-12', 'Office Supplies'],
      ['budget-uuid', 500, 'utilities', '2025-02-12', 'Electricity Bill'],
    ];
    const wsTransactions = XLSX.utils.aoa_to_sheet(transactionsData);

    // Add column widths
    wsTransactions['!cols'] = [
      { wch: 40 }, // budget_id
      { wch: 10 }, // amount
      { wch: 15 }, // category
      { wch: 12 }, // date
      { wch: 30 }, // description
    ];

    XLSX.utils.book_append_sheet(wb, wsTransactions, 'Transactions Template');

    // Budget Reference sheet
    const budgetData = [
      ['budget_id', 'name', 'category', 'amount', 'used_amount', 'remaining'],
      ...budgets?.map(budget => [
        budget.id,
        budget.name,
        budget.category,
        budget.amount,
        budget.used_amount,
        budget.amount - budget.used_amount
      ]) || []
    ];
    const wsBudgets = XLSX.utils.aoa_to_sheet(budgetData);

    // Add column widths
    wsBudgets['!cols'] = [
      { wch: 40 }, // budget_id
      { wch: 20 }, // name
      { wch: 15 }, // category
      { wch: 12 }, // amount
      { wch: 12 }, // used_amount
      { wch: 12 }, // remaining
    ];

    XLSX.utils.book_append_sheet(wb, wsBudgets, 'Budget Reference');

    // Categories Reference sheet
    const categoriesData = [
      ['Category Code', 'Description'],
      ['ministry_expense', 'General ministry expenses'],
      ['payroll', 'Staff and employee salaries'],
      ['utilities', 'Utility bills'],
      ['maintenance', 'Building and equipment maintenance'],
      ['events', 'Church events and programs'],
      ['missions', 'Mission work and outreach'],
      ['education', 'Educational programs'],
      ['other', 'Other expenses'],
    ];
    const wsCategories = XLSX.utils.aoa_to_sheet(categoriesData);

    // Add column widths
    wsCategories['!cols'] = [
      { wch: 20 }, // Category Code
      { wch: 40 }, // Description
    ];

    XLSX.utils.book_append_sheet(wb, wsCategories, 'Categories Reference');

    // Instructions sheet
    const instructionsData = [
      ['Bulk Expense Entry Instructions'],
      [''],
      ['1. Transaction Data Format:'],
      ['   - Use the "Transactions Template" sheet for your data entry'],
      ['   - All columns except description are required'],
      ['   - Dates should be in YYYY-MM-DD format'],
      ['   - Amounts should be numbers without currency symbols'],
      [''],
      ['2. Budget Information:'],
      ['   - Refer to the "Budget Reference" sheet for valid budget IDs'],
      ['   - The Budget Reference sheet shows current budget usage'],
      ['   - Expenses cannot exceed remaining budget amounts'],
      [''],
      ['3. Categories:'],
      ['   - Refer to the "Categories Reference" sheet for valid category codes'],
      ['   - Use the exact category codes as shown'],
      [''],
      ['4. Tips:'],
      ['   - Save your file as .xlsx format'],
      ['   - Verify all required fields are filled before importing'],
      ['   - Double-check budget IDs and amounts'],
      ['   - Copy budget IDs exactly as shown in the Budget Reference sheet'],
    ];
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);

    // Add column width
    wsInstructions['!cols'] = [{ wch: 80 }];

    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

    // Save the file
    XLSX.writeFile(wb, 'bulk-expense-template.xlsx');
  };

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

      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Bulk Expense Entry</h1>
          <p className="mt-2 text-sm text-gray-700">
            Add multiple expense transactions at once
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={downloadSampleCSV}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Sample CSV
          </button>
          <label className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 cursor-pointer">
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-4">
          <div className="flex">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">{success}</h3>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {entries.map((entry, index) => {
              const selectedBudget = budgets?.find(b => b.id === entry.budget_id);
              const remainingBudget = selectedBudget 
                ? selectedBudget.amount - selectedBudget.used_amount 
                : 0;

              return (
                <div key={index} className="mb-6 pb-6 border-b border-gray-200 last:border-0 last:mb-0 last:pb-0">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Entry #{index + 1}</h3>
                    {entries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(index)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <Minus className="h-4 w-4 mr-1" />
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label htmlFor={`budget-${index}`} className="block text-sm font-medium text-gray-700">
                        Budget *
                      </label>
                      <select
                        id={`budget-${index}`}
                        value={entry.budget_id}
                        onChange={(e) => handleInputChange(index, 'budget_id', e.target.value)}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      >
                        <option value="">Select a budget</option>
                        {budgets?.map((budget) => (
                          <option 
                            key={budget.id} 
                            value={budget.id}
                            disabled={budget.amount <= budget.used_amount}
                          >
                            {budget.name} ({formatStatus(budget.category)}) - 
                            {formatCurrency(budget.amount - budget.used_amount, currency)} remaining
                          </option>
                        ))}
                      </select>
                      {selectedBudget && (
                        <p className="mt-1 text-sm text-gray-500">
                          Remaining: {formatCurrency(remainingBudget, currency)}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor={`amount-${index}`} className="block text-sm font-medium text-gray-700">
                        Amount *
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">{currency.symbol}</span>
                        </div>
                        <input
                          type="number"
                          id={`amount-${index}`}
                          value={entry.amount || ''}
                          onChange={(e) => handleInputChange(index, 'amount', e.target.value)}
                          required
                          min="0"
                          max={remainingBudget}
                          step="0.01"
                          className="mt-1 block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor={`category-${index}`} className="block text-sm font-medium text-gray-700">
                        Category *
                      </label>
                      <select
                        id={`category-${index}`}
                        value={entry.category}
                        onChange={(e) => handleInputChange(index, 'category', e.target.value)}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      >
                        <option value="ministry_expense">Ministry Expense</option>
                        <option value="payroll">Payroll</option>
                        <option value="utilities">Utilities</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="events">Events</option>
                        <option value="missions">Missions</option>
                        <option value="education">Education</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor={`date-${index}`} className="block text-sm font-medium text-gray-700">
                        Date *
                      </label>
                      <input
                        type="date"
                        id={`date-${index}`}
                        value={entry.date}
                        onChange={(e) => handleInputChange(index, 'date', e.target.value)}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                    </div>

                    <div className="sm:col-span-2 lg:col-span-3">
                      <label htmlFor={`description-${index}`} className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <input
                        type="text"
                        id={`description-${index}`}
                        value={entry.description}
                        onChange={(e) => handleInputChange(index, 'description', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        placeholder="Enter description..."
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={handleAddRow}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Entry
              </button>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/finances')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addBulkEntriesMutation.isPending}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {addBulkEntriesMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="-ml-1 mr-2 h-5 w-5" />
                      Save All Entries
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default BulkExpenseEntry;