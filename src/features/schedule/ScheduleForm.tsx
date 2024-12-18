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

    // Validate required fields
    if (!data.customer_name || !data.description || !data.start_date || !data.start_time || !data.end_time) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        type: 'error',
      });
      return;
    }

    try {
      console.log('Form data:', data);

      // Format the date and time strings properly
      const formatTimeString = (timeStr: string) => {
        if (!timeStr) return null;
        console.log('Formatting time:', timeStr);
        // Handle 24-hour format from the time input
        const [hours, minutes] = timeStr.split(':');
        if (!hours || !minutes) return null;
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
      };

      const startTime = formatTimeString(data.start_time);
      const endTime = formatTimeString(data.end_time);

      if (!startTime || !endTime) {
        toast({
          title: 'Validation Error',
          description: 'Invalid time format',
          type: 'error',
        });
        return;
      }

      console.log('Formatted times:', { startTime, endTime });

      // Create date strings in ISO format
      const startDateTimeStr = `${data.start_date}T${startTime}`;
      const endDateTimeStr = `${data.start_date}T${endTime}`;

      console.log('DateTime strings:', { startDateTimeStr, endDateTimeStr });

      const startDateTime = new Date(startDateTimeStr);
      const endDateTime = new Date(endDateTimeStr);

      console.log('Parsed dates:', { startDateTime, endDateTime });

      // Validate that the dates are valid
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        console.error('Invalid date/time:', { startDateTime, endDateTime });
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
        location: data.location || null
      };

      console.log('Schedule content:', scheduleContent);

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
              {...register('customer_name', { required: true })}
              className="block w-full"
              placeholder="Enter customer name"
            />
            {errors.customer_name && (
              <p className="mt-1 text-sm text-red-600">Customer name is required</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <div className="mt-1">
            <Input
              type="text"
              {...register('description', { required: true })}
              className="block w-full"
              placeholder="Enter appointment description"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">Description is required</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <div className="mt-1">
            <Input
              type="date"
              {...register('start_date', { required: true })}
              className="block w-full"
              min={today}
            />
            {errors.start_date && (
              <p className="mt-1 text-sm text-red-600">Date is required</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Time</label>
            <div className="mt-1">
              <Input
                type="time"
                {...register('start_time', { required: true })}
                className="block w-full"
              />
              {errors.start_time && (
                <p className="mt-1 text-sm text-red-600">Start time is required</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">End Time</label>
            <div className="mt-1">
              <Input
                type="time"
                {...register('end_time', { required: true })}
                className="block w-full"
              />
              {errors.end_time && (
                <p className="mt-1 text-sm text-red-600">End time is required</p>
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