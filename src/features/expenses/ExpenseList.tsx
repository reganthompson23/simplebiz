import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Expense } from '../../types';
import { DollarSign, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils/formatters';
import { toast } from '../../components/ui/Toast';
import { useAuth } from '../../hooks/useAuth';

export default function ExpenseList() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: expenses, isLoading, error } = useQuery({
    queryKey: ['expenses', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('profile_id', user.id)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!user?.id,
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to delete expenses',
        type: 'error',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('profile_id', user.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Expense deleted successfully',
        type: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete expense',
        type: 'error',
      });
    }
  };

  if (!user) {
    return <div>Please log in to view expenses.</div>;
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading expenses: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <DollarSign className="h-6 w-6 text-gray-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
            </div>
            <Button
              onClick={() => navigate('/dashboard/expenses/new')}
              className="inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading expenses...</div>
        ) : !expenses?.length ? (
          <div className="p-8 text-center text-gray-500">
            <p className="mb-4">No expenses recorded yet.</p>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/expenses/new')}
              className="inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Record Your First Expense
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(expense.date).toLocaleDateString('en-AU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{expense.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(expense.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(expense.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}