import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useCurrencyStore } from '../../stores/currencyStore';
import { formatCurrency } from '../../utils/currency';
import { parse, format, isValid } from 'date-fns';
import * as XLSX from 'xlsx';
import { Card, CardHeader, CardContent } from '../../components/ui2/card';
import { Input } from '../../components/ui2/input';
import { Button } from '../../components/ui2/button';
import { Select } from '../../components/ui2/select';
import { Badge } from '../../components/ui2/badge';
import { Tabs } from '../../components/ui2/tabs';
import { Combobox } from '../../components/ui2/combobox';
import {
  Plus,
  Minus,
  Download,
  Upload,
  ArrowLeft,
  Save,
  Loader2,
  Calculator,
  PieChart,
  Users,
  DollarSign,
} from 'lucide-react';

type BulkEntry = {
  budget_id: string;
  amount: number;
  category_id: string;
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
            .eq('tenant_id', currentTenant?.id)
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
    enabled: !!currentTenant?.id,
  });

  // Get expense categories
  const { data: categories } = useQuery({
    queryKey: ['categories', 'expense_transaction', currentTenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('tenant_id', currentTenant?.id)
        .eq('is_active', true)
        .eq('type', 'expense_transaction')
        .is('deleted_at', null)
        .order('sort_order');

      if (error) throw error;
      return data;
    },
    enabled: !!currentTenant?.id,
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
          tenant_id: currentTenant?.id,
          budget_id: entry.budget_id,
          amount: entry.amount,
          category_id: entry.category_id,
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
    
    const validEntries = entries.filter(entry => 
      entry.budget_id && 
      entry.amount > 0 && 
      entry.category_id && 
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
      category_id: '',
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

      const requiredHeaders = ['budget_id', 'amount', 'category_id', 'date'];
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

          if (!entry.category_id) {
            throw new Error(`Missing category_id in row ${index + 2}`);
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
      ['budget_id', 'amount', 'category_id', 'date', 'description'],
      ['budget-uuid', 1000, 'category-uuid', '2025-02-12', 'Office Supplies'],
      ['budget-uuid', 500, 'category-uuid', '2025-02-12', 'Electricity Bill'],
    ];
    const wsTransactions = XLSX.utils.aoa_to_sheet(transactionsData);

    // Add column widths
    wsTransactions['!cols'] = [
      { wch: 40 }, // budget_id
      { wch: 10 }, // amount
      { wch: 40 }, // category_id
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
      ['Category ID', 'Name', 'Description'],
      ...(categories?.map(category => [
        category.id,
        category.name,
        category.description || ''
      ]) || [])
    ];
    const wsCategories = XLSX.utils.aoa_to_sheet(categoriesData);

    // Add column widths
    wsCategories['!cols'] = [
      { wch: 40 }, // Category ID
      { wch: 20 }, // Name
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
      ['   - Refer to the "Categories Reference" sheet for valid category IDs'],
      ['   - Use the exact category IDs as shown'],
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

  // Calculate running totals
  const runningTotals = React.useMemo(() => {
    // Calculate total with proper decimal handling
    const total = Number(entries.reduce((sum, t) => {
      const amount = Number(t.amount) || 0;
      return Number((sum + amount).toFixed(2));
    }, 0));

    // Calculate category totals with proper decimal handling
    const categoryTotals: Record<string, number> = {};
    entries.forEach(t => {
      if (t.category_id && t.amount) {
        const amount = Number(t.amount) || 0;
        const currentTotal = categoryTotals[t.category_id] || 0;
        categoryTotals[t.category_id] = Number((currentTotal + amount).toFixed(2));
      }
    });

    // Calculate budget totals with proper decimal handling
    const budgetTotals: Record<string, number> = {};
    entries.forEach(t => {
      if (t.budget_id && t.amount) {
        const amount = Number(t.amount) || 0;
        const currentTotal = budgetTotals[t.budget_id] || 0;
        budgetTotals[t.budget_id] = Number((currentTotal + amount).toFixed(2));
      }
    });

    return {
      total,
      categoryTotals,
      budgetTotals
    };
  }, [entries]);

  // Convert budgets to Combobox options
  const budgetOptions = React.useMemo(() => 
    budgets?.map(b => ({
      value: b.id,
      label: `${b.name} (${formatCurrency(b.amount - (b.used_amount || 0), currency)} remaining)`
    })) || [],
    [budgets, currency]
  );

  // Convert categories to Combobox options
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

      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Bulk Expense Entry</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Add multiple expense transactions at once
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Button
            variant="outline"
            onClick={downloadSampleCSV}
            className="flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
          <Button
            variant="default"
            className="flex items-center"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </Button>
        </div>
      </div>

      {/* Running Totals */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
        {/* Overall Total */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calculator className="h-5 w-5 text-primary mr-2" />
                <h3 className="text-sm font-medium text-foreground">Running Total</h3>
              </div>
              <Badge variant="destructive">
                Expense
              </Badge>
            </div>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {formatCurrency(runningTotals.total || 0, currency)}
            </p>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center mb-4">
              <PieChart className="h-5 w-5 text-primary mr-2" />
              <h3 className="text-sm font-medium text-foreground">By Category</h3>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
              {Object.entries(runningTotals.categoryTotals).map(([categoryId, amount]) => {
                const category = categories?.find(c => c.id === categoryId);
                return (
                  <div key={categoryId} className="flex justify-between items-center py-1 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground truncate mr-2">
                      {category?.name || 'Unknown'}
                    </span>
                    <span className="text-sm font-medium text-foreground whitespace-nowrap">
                      {formatCurrency(amount || 0, currency)}
                    </span>
                  </div>
                );
              })}
              {Object.keys(runningTotals.categoryTotals).length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-2">
                  No categories yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Budget Breakdown */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center mb-4">
              <PieChart className="h-5 w-5 text-primary mr-2" />
              <h3 className="text-sm font-medium text-foreground">By Budget</h3>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
              {Object.entries(runningTotals.budgetTotals).map(([budgetId, amount]) => {
                const budget = budgets?.find(b => b.id === budgetId);
                return (
                  <div key={budgetId} className="flex justify-between items-center py-1 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground truncate mr-2">
                      {budget?.name || 'Unknown'}
                    </span>
                    <span className="text-sm font-medium text-foreground whitespace-nowrap">
                      {formatCurrency(amount || 0, currency)}
                    </span>
                  </div>
                );
              })}
              {Object.keys(runningTotals.budgetTotals).length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-2">
                  No budgets yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-destructive/15 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-destructive">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-lg bg-success/15 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-success">{success}</h3>
            </div>
          </div>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {entries.map((entry, index) => {
              const selectedBudget = budgets?.find(b => b.id === entry.budget_id);
              const remainingBudget = selectedBudget 
                ? selectedBudget.amount - selectedBudget.used_amount 
                : 0;

              return (
                <div key={index} className="space-y-4 pb-6 border-b border-border last:border-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-foreground">Entry #{index + 1}</h3>
                    {entries.length > 1 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveRow(index)}
                        className="flex items-center"
                      >
                        <Minus className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <Combobox
                        options={budgetOptions}
                        value={entry.budget_id}
                        onChange={(value) => handleInputChange(index, 'budget_id', value)}
                        placeholder="Select Budget"
                      />
                      {selectedBudget && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          Remaining: {formatCurrency(remainingBudget, currency)}
                        </p>
                      )}
                    </div>

                    <div>
                      <Input
                        type="number"
                        value={entry.amount || ''}
                        onChange={(e) => handleInputChange(index, 'amount', e.target.value)}
                        icon={<DollarSign className="h-4 w-4" />}
                        placeholder="Amount"
                        min={0}
                        max={remainingBudget}
                        step="0.01"
                      />
                    </div>

                    <div>
                      <Combobox
                        options={categoryOptions}
                        value={entry.category_id}
                        onChange={(value) => handleInputChange(index, 'category_id', value)}
                        placeholder="Select Category"
                      />
                    </div>

                    <div>
                      <Input
                        type="date"
                        value={entry.date}
                        onChange={(e) => handleInputChange(index, 'date', e.target.value)}
                      />
                    </div>

                    <div className="sm:col-span-2 lg:col-span-3">
                      <Input
                        placeholder="Description"
                        value={entry.description}
                        onChange={(e) => handleInputChange(index, 'description', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleAddRow}
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Entry
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
                  disabled={addBulkEntriesMutation.isPending}
                >
                  {addBulkEntriesMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
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

export default BulkExpenseEntry;