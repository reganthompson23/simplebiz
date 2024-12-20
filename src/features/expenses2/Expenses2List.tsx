import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface Expense2 {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

export default function Expenses2List() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: expenses2, isLoading } = useQuery({
    queryKey: ['expenses2'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses2')
        .select('*')
        .eq('profile_id', user?.id)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as Expense2[];
    },
    enabled: !!user?.id
  });

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('expenses2')
        .delete()
        .eq('id', id)
        .eq('profile_id', user?.id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['expenses2'] });
      
      toast({
        title: 'Success',
        description: 'Expense deleted successfully',
        type: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete expense',
        type: 'error',
      });
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
        <Button onClick={() => navigate('/expenses2/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Expense
        </Button>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
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
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {expenses2?.map((expense) => (
              <tr key={expense.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(expense.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {expense.category}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {expense.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  ${expense.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/expenses2/${expense.id}/edit`)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
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
    </div>
  );
} 