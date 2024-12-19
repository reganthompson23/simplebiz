import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ScheduleEntryV2 } from '../../types/schedule';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';

type ScheduleFilter = 'upcoming' | 'past';

export default function ScheduleListV2() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<ScheduleFilter>('upcoming');
  
  const { data: scheduleEntries, isLoading, error } = useQuery({
    queryKey: ['schedule_v2', filter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule_v2')
        .select('*')
        .order('start_time', { ascending: true });
      
      if (error) throw error;

      // Filter in JavaScript
      const filtered = (data as ScheduleEntryV2[]).filter(entry => {
        const startTime = new Date(entry.start_time);
        const currentTime = new Date();
        return filter === 'upcoming' 
          ? startTime >= currentTime 
          : startTime < currentTime;
      });

      return filtered;
    },
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) return;

    try {
      const { error } = await supabase
        .from('schedule_v2')
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
                onClick={() => navigate('/schedule/new-v2')}
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
              onClick={() => navigate('/schedule/new-v2')}
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
                      {new Date(entry.start_time).toLocaleDateString('en-AU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                      <br />
                      {new Date(entry.start_time).toLocaleTimeString('en-AU', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                      {' - '}
                      {new Date(entry.end_time).toLocaleTimeString('en-AU', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {entry.customer_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{entry.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{entry.location}</div>
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