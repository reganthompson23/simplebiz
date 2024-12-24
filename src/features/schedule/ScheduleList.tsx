import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Schedule } from '../../types';
import { Calendar, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';
import { useAuth } from '../../hooks/useAuth';

export default function ScheduleList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showPastJobs, setShowPastJobs] = useState(false);

  const { data: schedules, isLoading, error } = useQuery({
    queryKey: ['schedules', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('profile_id', user.id)
        .order('schedule_date', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      return data as Schedule[];
    },
    enabled: !!user?.id,
  });

  const formatDateTime = (date: string, time: string) => {
    if (!date || !time) return null;
    const [hours, minutes] = time.split(':');
    const dateTime = new Date(date);
    dateTime.setHours(parseInt(hours), parseInt(minutes));
    return dateTime;
  };

  // Filter schedules based on current time
  const filteredSchedules = React.useMemo(() => {
    if (!schedules) return [];
    const now = new Date();

    return schedules.filter(schedule => {
      const scheduleDateTime = formatDateTime(schedule.schedule_date, schedule.end_time);
      if (!scheduleDateTime) return false;
      
      const isPast = scheduleDateTime < now;
      return showPastJobs ? isPast : !isPast;
    });
  }, [schedules, showPastJobs]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to delete schedules',
        type: 'error',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id)
        .eq('profile_id', user.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Schedule deleted successfully',
        type: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete schedule',
        type: 'error',
      });
    }
  };

  if (!user) {
    return <div>Please log in to view schedules.</div>;
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading schedules: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Calendar className="h-6 w-6 text-gray-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPastJobs(!showPastJobs)}
                className="ml-4"
              >
                {showPastJobs ? 'Show Upcoming Jobs' : 'Show Past Jobs'}
              </Button>
            </div>
            <Button
              onClick={() => navigate('/dashboard/schedule/new')}
              className="inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Schedule
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading schedules...</div>
        ) : !filteredSchedules.length ? (
          <div className="p-8 text-center text-gray-500">
            <p className="mb-4">
              {showPastJobs 
                ? 'No past jobs found.' 
                : 'No upcoming jobs scheduled.'}
            </p>
            {!showPastJobs && (
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard/schedule/new')}
                className="inline-flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Schedule
              </Button>
            )}
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
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSchedules.map((schedule) => {
                  const startDateTime = formatDateTime(schedule.schedule_date, schedule.start_time);
                  const endDateTime = formatDateTime(schedule.schedule_date, schedule.end_time);
                  
                  return (
                    <tr key={schedule.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          {startDateTime?.toLocaleDateString('en-AU', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          }) || 'Invalid Date'}
                        </div>
                        <div className="text-xs">
                          {startDateTime?.toLocaleTimeString('en-AU', {
                            hour: '2-digit',
                            minute: '2-digit'
                          }) || '--:--'}
                          {' - '}
                          {endDateTime?.toLocaleTimeString('en-AU', {
                            hour: '2-digit',
                            minute: '2-digit'
                          }) || '--:--'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {schedule.customer_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {schedule.customer_address}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {schedule.customer_phone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {schedule.job_description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/schedule/${schedule.id}/edit`)}
                          className="mr-2"
                        >
                          <Pencil className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(schedule.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 