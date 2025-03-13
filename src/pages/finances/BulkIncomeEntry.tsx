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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui2/select';
import { DatePickerInput } from '../../components/ui2/date-picker';
import { Combobox } from '../../components/ui2/combobox';
import { Badge } from '../../components/ui2/badge';
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
  member_id: string;
  amount: number;
  category_id: string;
  description: string;
  date: string;
  envelope_number?: string;
};

type Member = {
  id: string;
  first_name: string;
  last_name: string;
  envelope_number?: string;
};

function BulkIncomeEntry() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currency } = useCurrencyStore();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [entries, setEntries] = useState<BulkEntry[]>([{
    member_id: '',
    amount: 0,
    category_id: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    envelope_number: '',
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

  // Get members
  const { data: members } = useQuery({
    queryKey: ['members', currentTenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name, envelope_number')
        .eq('tenant_id', currentTenant?.id)
        .is('deleted_at', null)
        .order('last_name');

      if (error) throw error;
      return data as Member[];
    },
    enabled: !!currentTenant?.id,
  });

  // Get income categories
  const { data: categories } = useQuery({
    queryKey: ['categories', 'income_transaction', currentTenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('tenant_id', currentTenant?.id)
        .eq('is_active', true)
        .eq('type', 'income_transaction')
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

      // Process entries sequentially to handle envelope number lookups
      const processedEntries = await Promise.all(entries.map(async (entry, index) => {
        let memberId = entry.member_id;

        // If no member_id but envelope_number is provided, look up the member
        if (!memberId && entry.envelope_number) {
          const { data: members, error: lookupError } = await supabase
            .from('members')
            .select('id')
            .eq('tenant_id', currentTenant?.id)
            .eq('envelope_number', entry.envelope_number.trim());

          if (lookupError) {
            throw new Error(`Error looking up member with envelope number: ${entry.envelope_number}`);
          }

          if (!members || members.length === 0) {
            throw new Error(`No member found with envelope number: ${entry.envelope_number} (Entry #${index + 1})`);
          }

          if (members.length > 1) {
            throw new Error(`Multiple members found with envelope number: ${entry.envelope_number} (Entry #${index + 1})`);
          }

          memberId = members[0].id;
        }

        if (!memberId) {
          throw new Error(`Either member or envelope number must be provided (Entry #${index + 1})`);
        }

        return {
          type: 'income' as const,
          tenant_id: currentTenant?.id,
          member_id: memberId,
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
      setSuccess('Successfully added bulk entries');
      setEntries([{
        member_id: '',
        amount: 0,
        category_id: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        envelope_number: '',
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
      (entry.member_id || entry.envelope_number) && // Allow either member_id or envelope_number
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
      member_id: '',
      amount: 0,
      category_id: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      envelope_number: '',
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

      // Update required headers to make member_id optional if envelope_number is present
      const hasEnvelopeNumber = headers.includes('envelope_number');
      const hasMemberId = headers.includes('member_id');

      if (!hasMemberId && !hasEnvelopeNumber) {
        throw new Error('Either member_id or envelope_number column must be present');
      }

      const requiredHeaders = ['amount', 'category_id', 'date'];
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
            } else if (header === 'envelope_number') {
              // Validate envelope number format
              const envelopeNumber = values[i].trim();
              if (envelopeNumber && !/^\d+$/.test(envelopeNumber)) {
                throw new Error(`Invalid envelope number format in row ${index + 2}: ${envelopeNumber}. Must contain only digits.`);
              }
              entry[header] = envelopeNumber;
            } else {
              entry[header] = values[i];
            }
          });

          // Validate that either member_id or envelope_number is present
          if (!entry.member_id && !entry.envelope_number) {
            throw new Error(`Either member_id or envelope_number must be provided in row ${index + 2}`);
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

  const downloadSampleCSV = async () => {
    // Get actual member data
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, first_name, last_name, envelope_number')
      .order('last_name');

    if (membersError) {
      console.error('Error fetching members:', membersError);
      return;
    }

    const wb = XLSX.utils.book_new();

    // Transactions sheet (template)
    const transactionsData = [
      ['member_id', 'amount', 'category_id', 'date', 'description', 'envelope_number'],
      ['member-uuid', 1000, 'category-uuid', '2025-02-12', 'Sunday Tithe', '001'],
      ['member-uuid', 500, 'category-uuid', '2025-02-12', 'Love Offering', '002'],
    ];
    const wsTransactions = XLSX.utils.aoa_to_sheet(transactionsData);

    // Add column widths
    wsTransactions['!cols'] = [
      { wch: 40 }, // member_id
      { wch: 10 }, // amount
      { wch: 40 }, // category_id
      { wch: 12 }, // date
      { wch: 30 }, // description
      { wch: 15 }, // envelope_number
    ];

    XLSX.utils.book_append_sheet(wb, wsTransactions, 'Transactions Template');

    // Member Reference sheet with actual member data
    const membersData = [
      ['member_id', 'first_name', 'last_name', 'envelope_number'],
      ...members.map(member => [
        member.id,
        member.first_name,
        member.last_name,
        member.envelope_number || '',
      ])
    ];
    const wsMembers = XLSX.utils.aoa_to_sheet(membersData);

    // Add column widths
    wsMembers['!cols'] = [
      { wch: 40 }, // member_id
      { wch: 15 }, // first_name
      { wch: 15 }, // last_name
      { wch: 15 }, // envelope_number
    ];

    XLSX.utils.book_append_sheet(wb, wsMembers, 'Member Reference');

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
      ['Bulk Income Entry Instructions'],
      [''],
      ['1. Transaction Data Format:'],
      ['   - Use the "Transactions Template" sheet for your data entry'],
      ['   - All columns except description are required'],
      ['   - Dates should be in YYYY-MM-DD format'],
      ['   - Amounts should be numbers without currency symbols'],
      [''],
      ['2. Member Information:'],
      ['   - Refer to the "Member Reference" sheet for valid member IDs and envelope numbers'],
      ['   - You can match members by either member_id or envelope_number'],
      ['   - The Member Reference sheet contains actual member data from the system'],
      [''],
      ['3. Categories:'],
      ['   - Refer to the "Categories Reference" sheet for valid category IDs'],
      ['   - Use the exact category IDs as shown'],
      [''],
      ['4. Tips:'],
      ['   - Save your file as .xlsx format'],
      ['   - Verify all required fields are filled before importing'],
      ['   - Double-check member IDs and envelope numbers'],
      ['   - Copy member IDs exactly as shown in the Member Reference sheet'],
    ];
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);

    // Add column width
    wsInstructions['!cols'] = [{ wch: 80 }];

    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

    // Save the file
    XLSX.writeFile(wb, 'bulk-income-template.xlsx');
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

    // Calculate member totals with proper decimal handling
    const memberTotals: Record<string, number> = {};
    entries.forEach(t => {
      const memberId = t.member_id;
      if (memberId && t.amount) {
        const amount = Number(t.amount) || 0;
        const currentTotal = memberTotals[memberId] || 0;
        memberTotals[memberId] = Number((currentTotal + amount).toFixed(2));
      }
    });

    return {
      total,
      categoryTotals,
      memberTotals
    };
  }, [entries]);

  // Convert members to Combobox options
  const memberOptions = React.useMemo(() => 
    members?.map(m => ({
      value: m.id,
      label: `${m.first_name} ${m.last_name}${m.envelope_number ? ` (${m.envelope_number})` : ''}`
    })) || [], 
    [members]
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
          <h1 className="text-2xl font-semibold text-foreground">Bulk Income Entry</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Add multiple income transactions at once
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
              <Badge variant="success">
                Income
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

        {/* Member Breakdown */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center mb-4">
              <Users className="h-5 w-5 text-primary mr-2" />
              <h3 className="text-sm font-medium text-foreground">By Member</h3>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
              {Object.entries(runningTotals.memberTotals).map(([memberId, amount]) => {
                const member = members?.find(m => m.id === memberId);
                return (
                  <div key={memberId} className="flex justify-between items-center py-1 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground truncate mr-2">
                      {member ? `${member.first_name} ${member.last_name}` : 'Unknown'}
                    </span>
                    <span className="text-sm font-medium text-foreground whitespace-nowrap">
                      {formatCurrency(amount || 0, currency)}
                    </span>
                  </div>
                );
              })}
              {Object.keys(runningTotals.memberTotals).length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-2">
                  No members yet
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
            {entries.map((entry, index) => (
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
                      options={memberOptions}
                      value={entry.member_id}
                      onChange={(value) => handleInputChange(index, 'member_id', value)}
                      placeholder="Select Member"
                    />
                  </div>

                  <div>
                    <Input
                      placeholder="Envelope Number"
                      value={entry.envelope_number || ''}
                      onChange={(e) => handleInputChange(index, 'envelope_number', e.target.value)}
                      helperText="Optional if member is selected"
                    />
                  </div>

                  <div>
                    <Input
                      type="number"
                      value={entry.amount || ''}
                      onChange={(e) => handleInputChange(index, 'amount', e.target.value)}
                      icon={<DollarSign className="h-4 w-4" />}
                      placeholder="Amount"
                      min={0}
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
                    <DatePickerInput
                      value={entry.date ? new Date(entry.date) : undefined}
                      onChange={(date) => handleInputChange(
                        index,
                        'date',
                        date?.toISOString().split('T')[0] || ''
                      )}
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
            ))}

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

export default BulkIncomeEntry;