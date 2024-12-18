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
  const today = new Date().toISOString().split('T')[0];

  console.log('Current user:', user); // Debug log for user authentication

  // Fetch existing expense if editing
  const { data: existingExpense, isLoading } = useQuery({
    queryKey: ['expense', expenseId],
    queryFn: async () => {
      if (!expenseId) return null;

      console.log('Fetching expense with ID:', expenseId); // Debug log

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', expenseId)
        .single();

      if (error) {
        console.error('Error fetching expense:', error); // Debug log
        throw error;
      }

      console.log('Fetched expense data:', data); // Debug log
      return data as Expense;
    },
    enabled: !!expenseId
  });

  // Fetch all unique categories for autocomplete
  const { data: categories } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      if (!user?.id) {
        console.log('No user ID available for fetching categories'); // Debug log
        return [];
      }

      const { data, error } = await supabase
        .from('expenses')
        .select('category')
        .eq('profile_id', user.id)
        .order('category');

      if (error) {
        console.error('Error fetching categories:', error); // Debug log
        throw error;
      }

      // Get unique categories
      const uniqueCategories = Array.from(new Set(data.map(item => item.category)));
      return uniqueCategories.filter(Boolean); // Remove empty categories
    },
    enabled: !!user?.id
  });

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ExpenseFormData>({
    defaultValues: {
      date: today,
      amount: undefined,
      category: '',
      description: ''
    },
    mode: 'onSubmit'
  });

  // Set form data when existing expense is loaded
  useEffect(() => {
    if (existingExpense) {
      console.log('Setting form data from existing expense:', existingExpense); // Debug log
      setValue('amount', existingExpense.amount);
      setValue('category', existingExpense.category);
      setValue('description', existingExpense.description || '');
      setValue('date', existingExpense.date);
      setCategoryInput(existingExpense.category);
    }
  }, [existingExpense, setValue]);

  const onSubmit = async (data: ExpenseFormData) => {
    console.log('Form submitted with data:', data); // Debug log

    if (!user?.id) {
      console.error('No user ID available - user not authenticated'); // Debug log
      toast({
        title: 'Authentication Error',
        description: 'Please log in to create expenses',
        type: 'error',
      });
      navigate('/login');
      return;
    }

    try {
      // Clean and format the amount
      const cleanAmount = data.amount?.toString().replace(/[^0-9.]/g, '') || '0';
      const formattedAmount = parseFloat(cleanAmount);
      
      console.log('Formatted amount:', formattedAmount); // Debug log
      
      if (isNaN(formattedAmount) || formattedAmount <= 0) {
        console.error('Invalid amount:', formattedAmount); // Debug log
        toast({
          title: 'Validation Error',
          description: 'Please enter a valid amount greater than 0',
          type: 'error',
        });
        return;
      }

      // Round to 2 decimal places
      const finalAmount = Math.round(formattedAmount * 100) / 100;
      
      // Ensure we have a valid date (use today if somehow the date is missing)
      const expenseDate = data.date || today;
      
      const expenseData = {
        profile_id: user.id,
        amount: finalAmount,
        category: data.category,
        description: data.description,
        date: expenseDate
      };
      
      console.log('Submitting expense data to Supabase:', expenseData); // Debug log

      if (expenseId) {
        // Update existing expense
        const { error } = await supabase
          .from('expenses')
          .update({
            ...expenseData,
            updated_at: new Date().toISOString()
          })
          .eq('id', expenseId)
          .eq('profile_id', user.id);

        if (error) {
          console.error('Error updating expense:', error); // Debug log
          throw error;
        }

        toast({
          title: 'Success',
          description: 'Expense updated successfully',
          type: 'success',
        });
      } else {
        // Create new expense
        const { data: newExpense, error } = await supabase
          .from('expenses')
          .insert(expenseData)
          .select()
          .single();

        if (error) {
          console.error('Error creating expense:', error); // Debug log
          throw error;
        }

        console.log('Created expense:', newExpense); // Debug log

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
      console.error('Error in form submission:', error); // Debug log
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

      <form 
        onSubmit={(e) => {
          e.preventDefault();
          console.log('Form submit event triggered'); // Debug log for form submission event
          handleSubmit((data) => {
            console.log('HandleSubmit callback triggered'); // Debug log for handleSubmit
            console.log('Form data:', data); // Debug log for form data
            onSubmit(data);
          })(e);
        }} 
        className="space-y-6"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700">Amount</label>
          <div className="mt-1">
            <Input
              type="text"
              {...register('amount', { 
                required: 'Amount is required',
                validate: value => {
                  console.log('Validating amount:', value); // Debug log for amount validation
                  const cleanValue = value?.toString().replace(/[^0-9.]/g, '') || '';
                  const num = parseFloat(cleanValue);
                  return !isNaN(num) && num > 0 || 'Amount must be greater than 0';
                }
              })}
              className="block w-full"
              placeholder="0.00"
              onChange={(e) => {
                console.log('Amount changed:', e.target.value); // Debug log for amount changes
                let value = e.target.value;
                value = value.replace(/[^0-9.]/g, '');
                const parts = value.split('.');
                if (parts.length > 2) {
                  value = parts[0] + '.' + parts.slice(1).join('');
                }
                setValue('amount', value);
              }}
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
              {...register('category', { required: 'Category is required' })}
              onChange={(e) => {
                setValue('category', e.target.value);
                setCategoryInput(e.target.value);
                setShowCategorySuggestions(true);
              }}
              onFocus={() => setShowCategorySuggestions(true)}
              className="block w-full"
              placeholder="e.g., Fuel, Tools, Supplies"
            />
            
            {showCategorySuggestions && filteredCategories.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
                {filteredCategories.map((category) => (
                  <div
                    key={category}
                    className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-50"
                    onClick={() => {
                      setValue('category', category, { shouldValidate: true });
                      setCategoryInput(category);
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
              {...register('description', { required: 'Description is required' })}
              onChange={(e) => {
                setValue('description', e.target.value);
              }}
              className="block w-full"
              placeholder="Enter expense description"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <div className="mt-1">
            <Input
              type="date"
              {...register('date', {
                required: true,
                value: today // Ensure we always have a value
              })}
              defaultValue={today}
              className="block w-full"
            />
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
          <Button
            type="submit"
            variant="primary"
            onClick={() => console.log('Submit button clicked')}
          >
            {expenseId ? 'Update Expense' : 'Create Expense'}
          </Button>
        </div>
      </form>
    </div>
  );
} 