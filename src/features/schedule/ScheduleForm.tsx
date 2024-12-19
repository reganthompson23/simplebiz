import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { Schedule } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from '../../components/ui/Toast';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface ScheduleFormData {
  customer_name: string;
  customer_address: string;
  customer_phone: string;
  date: string;
  start_time: string;
  end_time: string;
  job_description: string;
}

export default function ScheduleForm() {
  const navigate = useNavigate();
  const { id: scheduleId } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  const { data: existingSchedule, isLoading } = useQuery({
    queryKey: ['schedule', scheduleId],
    queryFn: async () => {
      if (!scheduleId) return null;
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('id', scheduleId)
        .single();

      if (error) throw error;
      return data as Schedule;
    },
    enabled: !!scheduleId
  });

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ScheduleFormData>({
    defaultValues: {
      customer_name: '',
      customer_address: '',
      customer_phone: '',
      date: today,
      start_time: '09:00',
      end_time: '10:00',
      job_description: ''
    },
    mode: 'onSubmit'
  });

  useEffect(() => {
    if (existingSchedule) {
      const startDate = new Date(existingSchedule.start_time);
      const endDate = new Date(existingSchedule.end_time);
      
      setValue('customer_name', existingSchedule.customer_name);
      setValue('customer_address', existingSchedule.customer_address);
      setValue('customer_phone', existingSchedule.customer_phone);
      setValue('date', startDate.toISOString().split('T')[0]);
      setValue('start_time', startDate.toTimeString().slice(0, 5));
      setValue('end_time', endDate.toTimeString().slice(0, 5));
      setValue('job_description', existingSchedule.job_description);
    }
  }, [existingSchedule, setValue]);

  const onSubmit = async (data: ScheduleFormData) => {
    if (!user?.id) {
      toast({
        title: 'Authentication Error',
        description: 'Please log in to create schedules',
        type: 'error',
      });
      navigate('/login');
      return;
    }

    try {
      // Combine date and time
      const startDateTime = new Date(`${data.date}T${data.start_time}`);
      const endDateTime = new Date(`${data.date}T${data.end_time}`);

      const scheduleData = {
        profile_id: user.id,
        customer_name: data.customer_name.trim(),
        customer_address: data.customer_address.trim(),
        customer_phone: data.customer_phone.trim(),
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        job_description: data.job_description.trim()
      };

      if (scheduleId) {
        const { error } = await supabase
          .from('schedules')
          .update(scheduleData)
          .eq('id', scheduleId)
          .eq('profile_id', user.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Schedule updated successfully',
          type: 'success',
        });
      } else {
        const { error } = await supabase
          .from('schedules')
          .insert(scheduleData);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Schedule created successfully',
          type: 'success',
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['schedules'] });
      navigate('/schedule');
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save schedule',
        type: 'error',
      });
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

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
        <h1 className="text-2xl font-bold text-gray-900">
          {scheduleId ? 'Edit Schedule' : 'New Schedule'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Customer Name</label>
          <div className="mt-1">
            <Input
              {...register('customer_name', { 
                required: 'Customer name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' }
              })}
              type="text"
              className={errors.customer_name ? 'border-red-500' : ''}
            />
            {errors.customer_name && (
              <p className="mt-1 text-sm text-red-600">{errors.customer_name.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Customer Address</label>
          <div className="mt-1">
            <Input
              {...register('customer_address', { 
                required: 'Customer address is required',
                minLength: { value: 5, message: 'Address must be at least 5 characters' }
              })}
              type="text"
              className={errors.customer_address ? 'border-red-500' : ''}
            />
            {errors.customer_address && (
              <p className="mt-1 text-sm text-red-600">{errors.customer_address.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Customer Phone</label>
          <div className="mt-1">
            <Input
              {...register('customer_phone', { 
                required: 'Customer phone is required',
                pattern: { 
                  value: /^[0-9+\s()-]{8,}$/,
                  message: 'Please enter a valid phone number'
                }
              })}
              type="tel"
              className={errors.customer_phone ? 'border-red-500' : ''}
            />
            {errors.customer_phone && (
              <p className="mt-1 text-sm text-red-600">{errors.customer_phone.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <div className="mt-1">
            <Input
              {...register('date', { required: 'Date is required' })}
              type="date"
              min={today}
              className={errors.date ? 'border-red-500' : ''}
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Time</label>
            <div className="mt-1">
              <Input
                {...register('start_time', { required: 'Start time is required' })}
                type="time"
                className={errors.start_time ? 'border-red-500' : ''}
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
                {...register('end_time', { required: 'End time is required' })}
                type="time"
                className={errors.end_time ? 'border-red-500' : ''}
              />
              {errors.end_time && (
                <p className="mt-1 text-sm text-red-600">{errors.end_time.message}</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Job Description</label>
          <div className="mt-1">
            <textarea
              {...register('job_description', { 
                required: 'Job description is required',
                minLength: { value: 10, message: 'Description must be at least 10 characters' }
              })}
              rows={4}
              className={`block w-full rounded-md border ${
                errors.job_description ? 'border-red-500' : 'border-gray-300'
              } shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm`}
            />
            {errors.job_description && (
              <p className="mt-1 text-sm text-red-600">{errors.job_description.message}</p>
            )}
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
          <Button type="submit">
            {scheduleId ? 'Update Schedule' : 'Create Schedule'}
          </Button>
        </div>
      </form>
    </div>
  );
} 