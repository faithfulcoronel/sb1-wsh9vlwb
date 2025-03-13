// src/pages/admin/Categories.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useMessageStore } from '../../components/MessageHandler';
import { Card, CardHeader, CardContent } from '../../components/ui2/card';
import { Button } from '../../components/ui2/button';
import { Input } from '../../components/ui2/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui2/select';
import { Tabs } from '../../components/ui2/tabs';
import { Badge } from '../../components/ui2/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui2/dialog';
import { Checkbox } from '../../components/ui2/checkbox';
import { Label } from "../../components/ui2/label";
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Tag,
  Filter,
  Search,
  AlertCircle,
  CheckCircle2,
  Save,
} from 'lucide-react';

type Category = {
  id: string;
  type: string;
  code: string;
  name: string;
  description: string | null;
  is_system: boolean;
  is_active: boolean;
  sort_order: number;
};

type CategoryFormData = {
  type: string;
  code: string;
  name: string;
  description: string;
  is_active: boolean;
  sort_order: number;
};

function Categories() {
  const queryClient = useQueryClient();
  const { addMessage } = useMessageStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('membership');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    type: 'membership',
    code: '',
    name: '',
    description: '',
    is_active: true,
    sort_order: 0,
  });

  const categoryTypes = [
    { id: 'membership', label: 'Membership Types' },
    { id: 'member_status', label: 'Member Status' },
    { id: 'income_transaction', label: 'Income Categories' },
    { id: 'expense_transaction', label: 'Expense Categories' },
    { id: 'budget', label: 'Budget Categories' },
  ];

  // Get current tenant
  const { data: currentTenant } = useQuery({
    queryKey: ['current-tenant'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_current_tenant');
      if (error) throw error;
      return data?.[0];
    },
  });

  // Get categories
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories', selectedType, currentTenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('type', selectedType)
        .eq('tenant_id', currentTenant?.id)

      if (error) throw error;
      return data as Category[];
    },
    enabled: !!currentTenant?.id,
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const { error } = await supabase.rpc('manage_category', {
        p_action: 'create',
        p_type: data.type,
        p_code: data.code,
        p_name: data.name,
        p_description: data.description,
        p_is_active: data.is_active,
        p_sort_order: data.sort_order,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      addMessage({
        type: 'success',
        text: 'Category created successfully',
        duration: 3000,
      });
      setShowForm(false);
      resetForm();
    },
    onError: (error: Error) => {
      addMessage({
        type: 'error',
        text: error.message,
        duration: 5000,
      });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const { error } = await supabase.rpc('manage_category', {
        p_action: 'update',
        p_type: data.type,
        p_code: data.code,
        p_name: data.name,
        p_description: data.description,
        p_is_active: data.is_active,
        p_sort_order: data.sort_order,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      addMessage({
        type: 'success',
        text: 'Category updated successfully',
        duration: 3000,
      });
      setShowForm(false);
      resetForm();
    },
    onError: (error: Error) => {
      addMessage({
        type: 'error',
        text: error.message,
        duration: 5000,
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (category: Category) => {
      const { error } = await supabase.rpc('manage_category', {
        p_action: 'delete',
        p_type: category.type,
        p_code: category.code,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      addMessage({
        type: 'success',
        text: 'Category deleted successfully',
        duration: 3000,
      });
    },
    onError: (error: Error) => {
      addMessage({
        type: 'error',
        text: error.message,
        duration: 5000,
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.name) {
      addMessage({
        type: 'error',
        text: 'Please fill in all required fields',
        duration: 5000,
      });
      return;
    }

    try {
      if (editingCategory) {
        await updateCategoryMutation.mutateAsync(formData);
      } else {
        await createCategoryMutation.mutateAsync(formData);
      }
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      type: category.type,
      code: category.code,
      name: category.name,
      description: category.description || '',
      is_active: category.is_active,
      sort_order: category.sort_order,
    });
    setShowForm(true);
  };

  const handleDelete = async (category: Category) => {
    if (category.is_system) {
      addMessage({
        type: 'error',
        text: 'System categories cannot be deleted',
        duration: 5000,
      });
      return;
    }

    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await deleteCategoryMutation.mutateAsync(category);
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      type: selectedType,
      code: '',
      name: '',
      description: '',
      is_active: true,
      sort_order: 0,
    });
    setEditingCategory(null);
  };

  const filteredCategories = categories?.filter((category) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      category.name.toLowerCase().includes(searchLower) ||
      category.code.toLowerCase().includes(searchLower) ||
      category.description?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-foreground">Categories</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage categories for various aspects of your church administration.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Button
            variant="default"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <Tabs
          tabs={categoryTypes.map(type => ({
            id: type.id,
            label: type.label,
            icon: <Tag className="h-5 w-5" />,
          }))}
          activeTab={selectedType}
          onChange={(tabId) => {
            setSelectedType(tabId);
            setSearchTerm('');
          }}
          variant="enclosed"
          size="sm"
        />
      </div>

      <div className="mt-4 sm:flex sm:items-center sm:justify-between">
        <div className="relative max-w-xs">
          <Input
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search />}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredCategories && filteredCategories.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((category) => (
            <Card key={category.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  <Tag className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">
                    {category.name}
                  </h3>
                </div>
                <Badge variant={category.is_active ? 'default' : 'secondary'}>
                  {category.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Code: {category.code}</p>
                  {category.description && (
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  )}
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(category)}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    {!category.is_system && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(category)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="mt-6">
          <CardContent className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              {searchTerm
                ? 'No categories found matching your search criteria'
                : 'No categories found. Add your first category by clicking the "Add Category" button above.'}
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  disabled={editingCategory !== null}
                  placeholder="Enter a unique code"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter category name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter category description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                  placeholder="Enter sort order"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, is_active: checked as boolean })
                  }
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
              >
                {createCategoryMutation.isPending || updateCategoryMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {editingCategory ? 'Update Category' : 'Add Category'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Categories;
