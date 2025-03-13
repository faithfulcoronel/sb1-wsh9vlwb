import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useCurrencyStore } from '../../stores/currencyStore';
import { formatCurrency } from '../../utils/currency';
import { Card, CardHeader, CardContent } from '../../components/ui2/card';
import { Input } from '../../components/ui2/input';
import { Button } from '../../components/ui2/button';
import { Combobox } from '../../components/ui2/combobox';
import { DatePickerInput } from '../../components/ui2/date-picker';
import { Textarea } from '../../components/ui2/textarea';
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
} from 'lucide-react';

function BudgetAdd() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currency } = useCurrencyStore();
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: 0,
    category_id: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
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

  const addBudgetMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: newBudget, error } = await supabase
        .from('budgets')
        .insert([{
          ...data,
          tenant_id: currentTenant?.id,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return newBudget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      navigate('/finances/budgets');
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.amount || !formData.category_id || !formData.start_date || !formData.end_date) {
      setError('Please fill in all required fields');
      return;
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      setError('End date must be after start date');
      return;
    }

    try {
      await addBudgetMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Error adding budget:', error);
    }
  };

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | number
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'amount' ? Number(value) : value,
    }));
  };

  const categoryOptions = React.useMemo(() => 
    categories?.map(c => ({
      value: c.id,
      label: c.name
    })) || [],
    [categories]
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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

      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium text-foreground">Add New Budget</h3>
          <p className="text-sm text-muted-foreground">
            Create a new budget allocation
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="Budget Name"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Youth Ministry 2025"
                />
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
                  required
                  value={formData.amount || ''}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  min={0}
                  step="0.01"
                  placeholder="Enter the amount (0.00)"
                />
              </div>

              <div>
                <DatePickerInput
                  label="Start Date"
                  value={formData.start_date ? new Date(formData.start_date) : undefined}
                  onChange={(date) => handleInputChange(
                    'start_date',
                    date?.toISOString().split('T')[0] || ''
                  )}
                />
              </div>

              <div>
                <DatePickerInput
                  label="End Date"
                  value={formData.end_date ? new Date(formData.end_date) : undefined}
                  onChange={(date) => handleInputChange(
                    'end_date',
                    date?.toISOString().split('T')[0] || ''
                  )}
                />
              </div>

              <div className="sm:col-span-2">
                <Textarea
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  placeholder="Enter budget details..."
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/15 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-destructive" />
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
                onClick={() => navigate('/finances/budgets')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addBudgetMutation.isPending}
              >
                {addBudgetMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Add Budget
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

export default BudgetAdd;