import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Select } from '../ui/Select';
import { Tag, Loader2 } from 'lucide-react';

interface CategoryFilterProps {
  value: string;
  onChange: (value: string) => void;
  transactionType?: string;
}

export function CategoryFilter({ value, onChange, transactionType }: CategoryFilterProps) {
  // Fetch categories from database
  const { data: categories, isLoading } = useQuery({
    queryKey: ['transaction-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_enum_values', { enum_name: 'financial_transaction_category' });

      if (error) throw error;
      return data as string[];
    },
  });

  // Filter and format categories based on transaction type
  const categoryOptions = React.useMemo(() => {
    if (!categories) return [{ value: 'all', label: 'All Categories' }];

    const formatCategory = (category: string) => ({
      value: category,
      label: category.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    });

    const incomeCategories = categories.filter(cat => 
      ['tithe', 'first_fruit_offering', 'love_offering', 'mission_offering', 
       'mission_pledge', 'building_offering', 'lot_offering'].includes(cat)
    ).map(formatCategory);

    const expenseCategories = categories.filter(cat => 
      ['ministry_expense', 'payroll', 'utilities', 'maintenance', 
       'events', 'missions', 'education'].includes(cat)
    ).map(formatCategory);

    const otherCategories = categories.filter(cat => 
      cat === 'other'
    ).map(formatCategory);

    // Show only relevant categories based on the transaction type
    if (transactionType === 'income') {
      return [
        { value: 'all', label: 'All Categories' },
        ...incomeCategories,
        ...otherCategories,
      ];
    }

    if (transactionType === 'expense') {
      return [
        { value: 'all', label: 'All Categories' },
        ...expenseCategories,
        ...otherCategories,
      ];
    }

    // Return all categories if no specific transaction type is provided
    return [
      { value: 'all', label: 'All Categories' },
      ...incomeCategories,
      ...expenseCategories,
      ...otherCategories,
    ];
  }, [categories, transactionType]);

  if (isLoading) {
    return (
      <div className="flex-1 min-w-[100px] relative">
        <Select
          value=""
          onChange={() => {}}
          options={[{ value: '', label: 'Loading...' }]}
          icon={<Loader2 className="animate-spin" />}
          className="w-full"
          disabled
        />
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-[100px]">
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        options={categoryOptions}
        icon={<Tag />}
        className="w-full"
        placeholder="Select Category"
      />
    </div>
  );
}