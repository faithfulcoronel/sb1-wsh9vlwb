// src/pages/finances/BudgetEdit.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useMessageStore } from '../../components/MessageHandler';
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

type Budget = {
  id: string;
  name: string;
  amount: number;
  start_date: string;
  end_date: string;
  category_id: string;
  description: string | null;
};

function BudgetEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addMessage } = useMessageStore();
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Budget>({
    id: '',
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

  // Get budget data
  const { data: budget, isLoading: budgetLoading } = useQuery({
    queryKey: ['budget', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Budget;
    },
    enabled: !!id,
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

  useEffect(() => {
    if (budget) {
      setFormData(budget);
    }
  }, [budget]);

  const updateBudgetMutation = useMutation({
    mutationFn: async (data: Budget) => {
      const { error } = await supabase
        .from('budgets')
        .update({
          name: data.name,
          amount: data.amount,
          category_id: data.category_id,
          description: data.description,
          start_date: data.start_date,
          end_date: data.end_date,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget', id] });
      addMessage({
        type: 'success',
        text: 'Budget updated successfully',
        duration: 3000,
      });
      navigate(`/finances/budgets/${id}`);
    },
    onError: (error: Error) => {
      setError(error.message);
      addMessage({
        type: 'error',
        text: error.message,
        duration: 5000,
      });
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
      await updateBudgetMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Error updating budget:', error);
    }
  };

  const categoryOptions = React.useMemo(() => 
    categories?.map(c => ({
      value: c.id,
      label: c.name
    })) || [],
    [categories]
  );

  if (budgetLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/finances/budgets/${id}`)}
          className="flex items-center"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Budget
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium text-foreground">Edit Budget</h3>
          <p className="text-sm text-muted-foreground">
            Update budget details and allocation
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
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Youth Ministry 2025"
                />
              </div>

              <div>
                <Combobox
                  options={categoryOptions}
                  value={formData.category_id}
                  onChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                  placeholder="Select Category"
                />
              </div>

              <div>
                <Input
                  type="number"
                  label="Amount"
                  required
                  value={formData.amount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  min={0}
                  step="0.01"
                  placeholder="Enter the amount (0.00)"
                />
              </div>

              <div>
                <DatePickerInput
                  label="Start Date"
                  value={formData.start_date ? new Date(formData.start_date) : undefined}
                  onChange={(date) => setFormData(prev => ({
                    ...prev,
                    start_date: date?.toISOString().split('T')[0] || ''
                  }))}
                />
              </div>

              <div>
                <DatePickerInput
                  label="End Date"
                  value={formData.end_date ? new Date(formData.end_date) : undefined}
                  onChange={(date) => setFormData(prev => ({
                    ...prev,
                    end_date: date?.toISOString().split('T')[0] || ''
                  }))}
                />
              </div>

              <div className="sm:col-span-2">
                <Textarea
                  label="Description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
                onClick={() => navigate(`/finances/budgets/${id}`)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateBudgetMutation.isPending}
              >
                {updateBudgetMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
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

export default BudgetEdit;
