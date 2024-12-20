import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from '../../components/ui/Toast';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface Expense2 {
  id: string;
  profile_id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  created_at: string;
  updated_at: string;
}

interface Expense2FormData {
  amount: number;
  category: string;
  description: string;
  date: string;
}

export default function Expenses2Form() {
  const navigate = useNavigate();
  const { id: expense2Id } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [categoryInput, setCategoryInput] = useState('');
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  console.log('Current user:', user);

  const { data: existingExpense2, isLoading } = useQuery({
    queryKey: ['expense2', expense2Id],
    queryFn: async () => {
      if (!expense2Id) return null;

      console.log('Fetching expense2 with ID:', expense2Id);

      const { data, error } = await supabase
        .from('expenses2')
        .select('*')
        .eq('id', expense2Id)
        .single();

      if (error) {
        console.error('Error fetching expense2:', error);
        throw error;
      }

      console.log('Fetched expense2 data:', data);
      return data as Expense2;
    },
    enabled: !!expense2Id
  });

  const { data: categories } = useQuery({
    queryKey: ['expense2-categories'],
    queryFn: async () => {
      if (!user?.id) {
        console.log('No user ID available for fetching categories');
        return [];
      }

      const { data, error } = await supabase
        .from('expenses2')
        .select('category')
        .eq('profile_id', user.id)
        .order('category');

      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }

      const uniqueCategories = Array.from(new Set(data.map(item => item.category)));
      return uniqueCategories.filter(Boolean);
    },
    enabled: !!user?.id
  });

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<Expense2FormData>({
    defaultValues: {
      date: today,
      amount: undefined,
      category: '',
      description: ''
    },
    mode: 'onSubmit'
  });

  useEffect(() => {
    if (existingExpense2) {
      console.log('Setting form data from existing expense2:', existingExpense2);
      setValue('amount', existingExpense2.amount);
      setValue('category', existingExpense2.category);
      setValue('description', existingExpense2.description || '');
      setValue('date', existingExpense2.date);
      setCategoryInput(existingExpense2.category);
    }
  }, [existingExpense2, setValue]);

  const onSubmit = async (data: Expense2FormData) => {
    console.log('Form submitted with data:', data);

    if (!user?.id) {
      console.error('No user ID available - user not authenticated');
      toast({
        title: 'Authentication Error',
        description: 'Please log in to create expenses',
        type: 'error',
      });
      navigate('/login');
      return;
    }

    try {
      const cleanAmount = data.amount?.toString().replace(/[^0-9.]/g, '') || '0';
      const formattedAmount = parseFloat(cleanAmount);
      
      console.log('Formatted amount:', formattedAmount);
      
      if (isNaN(formattedAmount) || formattedAmount <= 0) {
        console.error('Invalid amount:', formattedAmount);
        toast({
          title: 'Validation Error',
          description: 'Please enter a valid amount greater than 0',
          type: 'error',
        });
        return;
      }

      const finalAmount = Math.round(formattedAmount * 100) / 100;
      const expense2Date = data.date || today;
      
      const expense2Data = {
        profile_id: user.id,
        amount: finalAmount,
        category: data.category,
        description: data.description,
        date: expense2Date
      };
      
      console.log('Submitting expense2 data to Supabase:', expense2Data);

      if (expense2Id) {
        const { error } = await supabase
          .from('expenses2')
          .update({
            ...expense2Data,
            updated_at: new Date().toISOString()
          })
          .eq('id', expense2Id)
          .eq('profile_id', user.id);

        if (error) {
          console.error('Error updating expense2:', error);
          throw error;
        }

        toast({
          title: 'Success',
          description: 'Expense updated successfully',
          type: 'success',
        });
      } else {
        const { data: newExpense2, error } = await supabase
          .from('expenses2')
          .insert(expense2Data)
          .select()
          .single();

        if (error) {
          console.error('Error creating expense2:', error);
          throw error;
        }

        console.log('Created expense2:', newExpense2);

        toast({
          title: 'Success',
          description: 'Expense created successfully',
          type: 'success',
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['expenses2'] });
      await queryClient.invalidateQueries({ queryKey: ['expense2-categories'] });
      navigate('/expenses2');
    } catch (error: any) {
      console.error('Error in form submission:', error);
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
          onClick={() => navigate('/expenses2')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Expenses
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          {expense2Id ? 'Edit Expense' : 'New Expense'}
        </h1>
      </div>

      <form 
        onSubmit={(e) => {
          e.preventDefault();
          console.log('Form submit event triggered');
          handleSubmit((data) => {
            console.log('HandleSubmit callback triggered');
            console.log('Form data:', data);
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
                pattern: {
                  value: /^\d*\.?\d*$/,
                  message: 'Please enter a valid number'
                }
              })}
              className={errors.amount ? 'border-red-500' : ''}
              placeholder="0.00"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <div className="mt-1">
            <Input
              type="text"
              {...register('category', { required: 'Category is required' })}
              className={errors.category ? 'border-red-500' : ''}
              value={categoryInput}
              onChange={(e) => {
                setCategoryInput(e.target.value);
                setValue('category', e.target.value);
                setShowCategorySuggestions(true);
              }}
              onFocus={() => setShowCategorySuggestions(true)}
            />
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
            )}
            {showCategorySuggestions && filteredCategories.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border">
                {filteredCategories.map((category, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
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
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <div className="mt-1">
            <Input
              type="date"
              {...register('date', { required: 'Date is required' })}
              className={errors.date ? 'border-red-500' : ''}
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <div className="mt-1">
            <textarea
              {...register('description')}
              rows={4}
              className="shadow-sm block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/expenses2')}
          >
            Cancel
          </Button>
          <Button type="submit">
            {expense2Id ? 'Update Expense' : 'Create Expense'}
          </Button>
        </div>
      </form>
    </div>
  );
} 