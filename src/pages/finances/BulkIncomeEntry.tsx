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
  member_id: string;
  amount: number;
  category: string;
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
    category: 'tithe',
    description: '',
    date: new Date().toISOString().split('T')[0],
    envelope_number: '',
  }]);

  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name, envelope_number')
        .order('last_name');

      if (error) throw error;
      return data as Member[];
    },
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

        // Create the transaction without the envelope_number field
        return {
          type: 'income' as const,
          member_id: memberId,
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
      setSuccess('Successfully added bulk entries');
      setEntries([{
        member_id: '',
        amount: 0,
        category: 'tithe',
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
      member_id: '',
      amount: 0,
      category: 'tithe',
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

      const requiredHeaders = ['amount', 'category', 'date'];
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
      ['member_id', 'amount', 'category', 'date', 'description', 'envelope_number'],
      ['member-uuid', 1000, 'tithe', '2025-02-12', 'Sunday Tithe', '001'],
      ['member-uuid', 500, 'love_offering', '2025-02-12', 'Love Offering', '002'],
    ];
    const wsTransactions = XLSX.utils.aoa_to_sheet(transactionsData);

    // Add column widths
    wsTransactions['!cols'] = [
      { wch: 40 }, // member_id
      { wch: 10 }, // amount
      { wch: 15 }, // category
      { wch: 12 }, // date
      { wch: 30 }, // description
      { wch: 15 }, // envelope_number
    ];

    XLSX.utils.book_append_sheet(wb, wsTransactions, 'Transactions Template');

    // Member Reference sheet with actual member data
    const membersData = [
      ['member_id', 'first_name', 'last_name', 'envelope_number', 'valid_categories'],
      ...members.map(member => [
        member.id,
        member.first_name,
        member.last_name,
        member.envelope_number || '',
        'tithe, first_fruit_offering, love_offering, mission_offering, mission_pledge, building_offering, lot_offering, other'
      ])
    ];
    const wsMembers = XLSX.utils.aoa_to_sheet(membersData);

    // Add column widths
    wsMembers['!cols'] = [
      { wch: 40 }, // member_id
      { wch: 15 }, // first_name
      { wch: 15 }, // last_name
      { wch: 15 }, // envelope_number
      { wch: 100 }, // valid_categories
    ];

    XLSX.utils.book_append_sheet(wb, wsMembers, 'Member Reference');

    // Categories Reference sheet
    const categoriesData = [
      ['Category Code', 'Description'],
      ['tithe', 'Regular tithe contributions'],
      ['first_fruit_offering', 'First fruit offerings'],
      ['love_offering', 'Love offerings'],
      ['mission_offering', 'Mission offerings'],
      ['mission_pledge', 'Mission pledges'],
      ['building_offering', 'Building fund offerings'],
      ['lot_offering', 'Lot acquisition offerings'],
      ['other', 'Other types of income'],
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
      ['   - Refer to the "Categories Reference" sheet for valid category codes'],
      ['   - Use the exact category codes as shown'],
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

    // Add some basic formatting
    wsInstructions['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];

    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

    // Save the file
    XLSX.writeFile(wb, 'bulk-income-template.xlsx');
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
          <h1 className="text-2xl font-semibold text-gray-900">Bulk Income Entry</h1>
          <p className="mt-2 text-sm text-gray-700">
            Add multiple income transactions at once
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
            {entries.map((entry, index) => (
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
                    <label htmlFor={`member-${index}`} className="block text-sm font-medium text-gray-700">
                      Member
                    </label>
                    <select
                      id={`member-${index}`}
                      value={entry.member_id}
                      onChange={(e) => handleInputChange(index, 'member_id', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    >
                      <option value="">Select a member</option>
                      {members?.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.first_name} {member.last_name}
                          {member.envelope_number && ` (Envelope #${member.envelope_number})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor={`envelope-${index}`} className="block text-sm font-medium text-gray-700">
                      Envelope Number
                    </label>
                    <input
                      type="text"
                      id={`envelope-${index}`}
                      value={entry.envelope_number || ''}
                      onChange={(e) => handleInputChange(index, 'envelope_number', e.target.value)}
                      pattern="[0-9]*"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="e.g., 001"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Enter either Member or Envelope Number
                    </p>
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
                      <option value="tithe">Tithe</option>
                      <option value="first_fruit_offering">First Fruit Offering</option>
                      <option value="love_offering">Love Offering</option>
                      <option value="mission_offering">Mission Offering</option>
                      <option value="mission_pledge">Mission Pledge</option>
                      <option value="building_offering">Building Offering</option>
                      <option value="lot_offering">Lot Offering</option>
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
            ))}

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

export default BulkIncomeEntry;