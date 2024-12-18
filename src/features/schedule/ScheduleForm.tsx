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

  const { register, handleSubmit, formState: { errors } } = useForm<ScheduleFormData>({
    defaultValues: {
      start_date: today,
      start_time: '09:00',
      end_time: '10:00'
    },
    mode: 'onSubmit'
  });

  const onSubmit = async (data: ScheduleFormData) => {
    try {
      if (!user?.id) return navigate('/login');

      console.log('Form data received:', data);
      
      const startDateTime = new Date(data.start_date);
      startDateTime.setHours(
        parseInt(data.start_time.split(':')[0]),
        parseInt(data.start_time.split(':')[1])
      );

      const endDateTime = new Date(data.start_date);
      endDateTime.setHours(
        parseInt(data.end_time.split(':')[0]),
        parseInt(data.end_time.split(':')[1])
      );
      
      console.log('Parsed dates:', {
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        localStartTime: startDateTime.toLocaleString(),
        localEndTime: endDateTime.toLocaleString()
      });

      const scheduleContent: ScheduleContent = {
        customer_name: data.customer_name,
        description: data.description,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        location: data.location || null
      };

      console.log('Schedule content to be saved:', scheduleContent);

      const { error, data: savedData } = await supabase
        .from('schedule')
        .insert({
          profile_id: user.id,
          content: scheduleContent
        })
        .select()
        .single();

      console.log('Supabase response:', { error, savedData });

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['schedule'] });
      navigate('/schedule');
    } catch (error: any) {
      console.error('Error submitting form:', error);
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

      <form 
        onSubmit={(e) => {
          console.log('Form submitted!');
          console.log('Form values:', e.target);
          handleSubmit(onSubmit)(e);
        }} 
        className="space-y-6"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700">Customer Name</label>
          <div className="mt-1">
            <Input
              type="text"
              {...register('customer_name', { required: 'Customer name is required' })}
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
              {...register('description', { required: 'Description is required' })}
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
              {...register('start_date', { 
                required: 'Date is required',
                validate: value => {
                  const date = new Date(value);
                  return !isNaN(date.getTime()) || 'Invalid date';
                }
              })}
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
                {...register('start_time', { 
                  required: 'Start time is required',
                  pattern: {
                    value: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                    message: 'Invalid time format'
                  }
                })}
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
                {...register('end_time', { 
                  required: 'End time is required',
                  pattern: {
                    value: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                    message: 'Invalid time format'
                  },
                  validate: (value, formValues) => {
                    if (!formValues.start_time) return true;
                    const start = new Date(`1970-01-01T${formValues.start_time}`);
                    const end = new Date(`1970-01-01T${value}`);
                    return end > start || 'End time must be after start time';
                  }
                })}
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
          >
            Create Appointment
          </Button>
        </div>
      </form>
    </div>
  );
} 