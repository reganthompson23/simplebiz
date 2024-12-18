import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ScheduleEntry } from '../../types';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';

type ScheduleFilter = 'upcoming' | 'past';

export default function ScheduleList() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<ScheduleFilter>('upcoming');
  
  const { data: scheduleEntries, isLoading, error } = useQuery({
    queryKey: ['schedule', filter],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      const query = supabase
        .from('schedule')
        .select('*');
      
      if (filter === 'upcoming') {
        query.gte('content->start_time', now)
          .order('content->start_time', { ascending: true });
      } else {
        query.lt('content->start_time', now)
          .order('content->start_time', { ascending: false });
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as ScheduleEntry[];
    },
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) return;

    try {
      const { error } = await supabase
        .from('schedule')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Appointment deleted successfully',
        type: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete appointment',
        type: 'error',
      });
    }
  };

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading schedule: {error.message}</p>
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
              <Calendar className="h-6 w-6 text-gray-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex rounded-lg shadow-sm">
                <Button
                  variant={filter === 'upcoming' ? 'primary' : 'ghost'}
                  onClick={() => setFilter('upcoming')}
                  className="rounded-r-none"
                >
                  Upcoming
                </Button>
                <Button
                  variant={filter === 'past' ? 'primary' : 'ghost'}
                  onClick={() => setFilter('past')}
                  className="rounded-l-none"
                >
                  Past
                </Button>
              </div>
              <Button
                onClick={() => navigate('/schedule/new')}
                className="inline-flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Appointment
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading schedule...</div>
        ) : !scheduleEntries?.length ? (
          <div className="p-8 text-center text-gray-500">
            <p className="mb-4">No {filter} appointments found.</p>
            <Button
              variant="outline"
              onClick={() => navigate('/schedule/new')}
              className="inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Schedule Your First Appointment
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scheduleEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(entry.content.start_time).toLocaleDateString('en-AU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                      <br />
                      {new Date(entry.content.start_time).toLocaleTimeString('en-AU', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                      {' - '}
                      {new Date(entry.content.end_time).toLocaleTimeString('en-AU', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {entry.content.customer_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{entry.content.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{entry.content.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(entry.id)}
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