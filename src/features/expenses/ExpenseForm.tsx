import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { Expense } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from '../../components/ui/Toast';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface ExpenseFormData {
  amount: number;
  category: string;
  description: string;
  date: string;
}

export default function ExpenseForm() {
  const navigate = useNavigate();
  const { id: expenseId } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [categoryInput, setCategoryInput] = useState('');
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);

  // Fetch existing expense if editing
  const { data: existingExpense, isLoading } = useQuery({
    queryKey: ['expense', expenseId],
    queryFn: async () => {
      if (!expenseId) return null;

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', expenseId)
        .single();

      if (error) throw error;
      return data as Expense;
    },
    enabled: !!expenseId
  });

  // Fetch all unique categories for autocomplete
  const { data: categories } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('expenses')
        .select('category')
        .eq('profile_id', user.id)
        .order('category');

      if (error) throw error;

      // Get unique categories
      const uniqueCategories = Array.from(new Set(data.map(item => item.category)));
      return uniqueCategories.filter(Boolean); // Remove empty categories
    },
    enabled: !!user?.id
  });

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ExpenseFormData>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      amount: undefined,
      category: '',
      description: ''
    }
  });

  // Set form data when existing expense is loaded
  useEffect(() => {
    if (existingExpense) {
      setValue('amount', existingExpense.amount);
      setValue('category', existingExpense.category);
      setCategoryInput(existingExpense.category);
      setValue('description', existingExpense.description);
      setValue('date', existingExpense.date);
    }
  }, [existingExpense, setValue]);

  const onSubmit = async (data: ExpenseFormData) => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create expenses',
        type: 'error',
      });
      return;
    }

    try {
      if (expenseId) {
        // Update existing expense
        const { error } = await supabase
          .from('expenses')
          .update({
            amount: data.amount,
            category: data.category,
            description: data.description,
            date: data.date,
            updated_at: new Date().toISOString()
          })
          .eq('id', expenseId)
          .eq('profile_id', user.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Expense updated successfully',
          type: 'success',
        });
      } else {
        // Create new expense
        const { error } = await supabase
          .from('expenses')
          .insert({
            profile_id: user.id,
            amount: data.amount,
            category: data.category,
            description: data.description,
            date: data.date
          });

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Expense created successfully',
          type: 'success',
        });
      }

      // Invalidate queries and navigate back
      await queryClient.invalidateQueries({ queryKey: ['expenses'] });
      await queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
      navigate('/expenses');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save expense',
        type: 'error',
      });
    }
  };

  const filteredCategories = categories?.filter(category => 
    category.toLowerCase().includes(categoryInput.toLowerCase())
  ) || [];

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/expenses')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Expenses
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          {expenseId ? 'Edit Expense' : 'New Expense'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Amount</label>
          <div className="mt-1">
            <Input
              type="number"
              step="any"
              {...register('amount', { 
                required: 'Amount is required',
                min: { value: 0.01, message: 'Amount must be greater than 0' },
                setValueAs: (value) => {
                  const num = parseFloat(value);
                  return isNaN(num) ? undefined : Number(num.toFixed(2));
                }
              })}
              className="block w-full"
              placeholder="0.00"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <div className="mt-1 relative">
            <Input
              type="text"
              value={categoryInput}
              onChange={(e) => {
                setCategoryInput(e.target.value);
                setValue('category', e.target.value);
                setShowCategorySuggestions(true);
              }}
              onFocus={() => setShowCategorySuggestions(true)}
              className="block w-full"
              placeholder="e.g., Fuel, Tools, Supplies"
            />
            <input type="hidden" {...register('category', { required: 'Category is required' })} />
            
            {showCategorySuggestions && filteredCategories.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
                {filteredCategories.map((category) => (
                  <div
                    key={category}
                    className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-50"
                    onClick={() => {
                      setCategoryInput(category);
                      setValue('category', category);
                      setShowCategorySuggestions(false);
                    }}
                  >
                    {category}
                  </div>
                ))}
              </div>
            )}
            
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <div className="mt-1">
            <Input
              type="text"
              {...register('description')}
              className="block w-full"
              placeholder="Optional description"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <div className="mt-1">
            <Input
              type="date"
              defaultValue={new Date().toISOString().split('T')[0]}
              {...register('date', { required: 'Date is required' })}
              className="block w-full"
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/expenses')}
          >
            Cancel
          </Button>
          <Button type="submit">
            {expenseId ? 'Update Expense' : 'Create Expense'}
          </Button>
        </div>
      </form>
    </div>
  );
} 