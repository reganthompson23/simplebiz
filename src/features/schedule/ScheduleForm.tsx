import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { ScheduleContent } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from '../../components/ui/Toast';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface ScheduleFormData {
  customer_name: string;
  description: string;
  start_date: string;
  start_time: string;
  end_time: string;
  location?: string;
}

export default function ScheduleForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ScheduleFormData>({
    defaultValues: {
      start_date: today,
      start_time: '09:00',
      end_time: '10:00'
    },
    mode: 'onTouched'
  });

  const onSubmit = async (data: ScheduleFormData) => {
    if (!user?.id) {
      toast({
        title: 'Authentication Error',
        description: 'Please log in to create appointments',
        type: 'error',
      });
      navigate('/login');
      return;
    }

    try {
      // Format the date and time strings properly
      const formatTimeString = (timeStr: string) => {
        // Ensure the time string has seconds
        return timeStr.includes(':') ? 
          timeStr.split(':').length === 2 ? `${timeStr}:00` : timeStr 
          : `${timeStr}:00:00`;
      };

      const startTime = formatTimeString(data.start_time);
      const endTime = formatTimeString(data.end_time);

      // Create ISO strings with the formatted time
      const startDateTime = new Date(`${data.start_date}T${startTime}`);
      const endDateTime = new Date(`${data.start_date}T${endTime}`);

      // Validate that the dates are valid
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        toast({
          title: 'Validation Error',
          description: 'Invalid date or time format',
          type: 'error',
        });
        return;
      }

      // Validate that end time is after start time
      if (endDateTime <= startDateTime) {
        toast({
          title: 'Validation Error',
          description: 'End time must be after start time',
          type: 'error',
        });
        return;
      }

      const scheduleContent: ScheduleContent = {
        customer_name: data.customer_name,
        description: data.description,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        location: data.location
      };

      const { error } = await supabase
        .from('schedule')
        .insert({
          profile_id: user.id,
          content: scheduleContent
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Appointment created successfully',
        type: 'success',
      });

      // Invalidate and redirect
      await queryClient.invalidateQueries({ queryKey: ['schedule'] });
      navigate('/schedule');
    } catch (error: any) {
      console.error('Schedule creation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create appointment',
        type: 'error',
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/schedule')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Schedule
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">New Appointment</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Customer Name</label>
          <div className="mt-1">
            <Input
              type="text"
              {...register('customer_name')}
              className="block w-full"
              placeholder="Enter customer name"
            />
            {errors.customer_name && (
              <p className="mt-1 text-sm text-red-600">{errors.customer_name.message}</p>
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
              placeholder="Enter appointment description"
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
              {...register('start_date')}
              className="block w-full"
              min={today}
            />
            {errors.start_date && (
              <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Time</label>
            <div className="mt-1">
              <Input
                type="time"
                {...register('start_time')}
                className="block w-full"
              />
              {errors.start_time && (
                <p className="mt-1 text-sm text-red-600">{errors.start_time.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">End Time</label>
            <div className="mt-1">
              <Input
                type="time"
                {...register('end_time')}
                className="block w-full"
              />
              {errors.end_time && (
                <p className="mt-1 text-sm text-red-600">{errors.end_time.message}</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Location (Optional)</label>
          <div className="mt-1">
            <Input
              type="text"
              {...register('location')}
              className="block w-full"
              placeholder="Enter appointment location"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/schedule')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
          >
            Create Appointment
          </Button>
        </div>
      </form>
    </div>
  );
} 