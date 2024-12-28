import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from '../../components/ui/Toast';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function ExpenseForm() {
  const navigate = useNavigate();
  const { id: expenseId } = useParams();
  const queryClient = useQueryClient();
  const { user, isInitialized } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  // Wait for auth to be initialized before checking user state
  if (!isInitialized) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  // Only redirect if auth is initialized and there's no user
  if (isInitialized && !user?.id) {
    navigate('/login');
    return null;
  }

  // Basic form state
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    date: today
  });

  // Basic error state
  const [errors, setErrors] = useState({
    amount: '',
    category: '',
    description: '',
    date: ''
  });

  // Category suggestions state
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
      return data;
    },
    enabled: !!expenseId
  });

  // Fetch categories for suggestions
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
      const uniqueCategories = Array.from(new Set(data.map(item => item.category)));
      return uniqueCategories.filter(Boolean);
    },
    enabled: !!user?.id
  });

  // Set form data when existing expense is loaded
  useEffect(() => {
    if (existingExpense) {
      setFormData({
        amount: existingExpense.amount.toString(),
        category: existingExpense.category,
        description: existingExpense.description || '',
        date: existingExpense.date
      });
    }
  }, [existingExpense]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    setErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  };

  // Basic validation
  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };

    const amount = parseFloat(formData.amount.replace(/[^0-9.]/g, ''));
    if (!amount || isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0';
      isValid = false;
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
      isValid = false;
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);

    if (!validateForm()) {
      console.log('Validation failed');
      return;
    }

    if (!user?.id) {
      navigate('/login');
      return;
    }

    try {
      const cleanAmount = formData.amount.replace(/[^0-9.]/g, '');
      const finalAmount = Math.round(parseFloat(cleanAmount) * 100) / 100;
      
      const expenseData = {
        profile_id: user.id,
        amount: finalAmount,
        category: formData.category,
        description: formData.description,
        date: formData.date
      };

      let result;
      
      if (expenseId) {
        result = await supabase
          .from('expenses')
          .update({
            ...expenseData,
            updated_at: new Date().toISOString()
          })
          .eq('id', expenseId)
          .eq('profile_id', user.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('expenses')
          .insert({
            ...expenseData,
            profile_id: user.id
          })
          .select()
          .single();
      }

      if (result.error) throw result.error;

      toast({
        title: 'Success',
        description: expenseId ? 'Expense updated successfully' : 'Expense created successfully',
        type: 'success',
      });

      await queryClient.invalidateQueries({ queryKey: ['expenses'] });
      navigate('/dashboard/expenses');

    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save expense',
        type: 'error',
      });
    }
  };

  // Filter categories for suggestions
  const filteredCategories = categories?.filter(category => 
    category.toLowerCase().includes(formData.category.toLowerCase())
  ) || [];

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard/expenses')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Expenses
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          {expenseId ? 'Edit Expense' : 'New Expense'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Amount</label>
          <div className="mt-1">
            <Input
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              type="text"
              placeholder="0.00"
              className={errors.amount ? 'border-red-500' : ''}
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <div className="mt-1 relative">
            <Input
              name="category"
              value={formData.category}
              onChange={handleChange}
              type="text"
              placeholder="e.g., Fuel, Tools, Supplies"
              className={errors.category ? 'border-red-500' : ''}
              onFocus={() => setShowCategorySuggestions(true)}
            />
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category}</p>
            )}
            {showCategorySuggestions && filteredCategories.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border">
                {filteredCategories.map((category, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, category }));
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
              name="date"
              value={formData.date}
              onChange={handleChange}
              type="date"
              className={errors.date ? 'border-red-500' : ''}
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <div className="mt-1">
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className={`block w-full rounded-md border ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              } shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm`}
              placeholder="Enter expense description"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard/expenses')}
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