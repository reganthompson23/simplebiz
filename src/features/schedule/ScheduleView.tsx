import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { ScheduleEntry } from '../../types';
import { Calendar, Plus } from 'lucide-react';

export default function ScheduleView() {
  const { data: scheduleEntries, isLoading } = useQuery({
    queryKey: ['schedule'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .order('date', { ascending: true });
      
      if (error) throw error;
      return data as ScheduleEntry[];
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Calendar className="h-6 w-6 text-gray-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
            </div>
            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {scheduleEntries?.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start space-x-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <div className="flex-shrink-0 w-16 text-center">
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short' })}
                  </div>
                  <div className="text-lg font-bold text-blue-600">
                    {new Date(entry.date).getDate()}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {entry.customerName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {entry.description}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    {entry.time} {entry.location && `• ${entry.location}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}