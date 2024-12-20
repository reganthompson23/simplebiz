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
  start_time: string;
  end_time: string;
  job_description: string;
}

export default function ScheduleForm() {
  const navigate = useNavigate();
  const { id: scheduleId } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();

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

  const { register, handleSubmit, setValue, formState: { errors }, getValues } = useForm<ScheduleFormData>({
    defaultValues: {
      customer_name: '',
      customer_address: '',
      customer_phone: '',
      start_time: '',
      end_time: '',
      job_description: ''
    },
    mode: 'onSubmit'
  });

  useEffect(() => {
    console.log('Form Errors:', errors);
    console.log('Current Form Values:', getValues());
  }, [errors, getValues]);

  useEffect(() => {
    if (existingSchedule) {
      setValue('customer_name', existingSchedule.customer_name);
      setValue('customer_address', existingSchedule.customer_address);
      setValue('customer_phone', existingSchedule.customer_phone);
      setValue('start_time', existingSchedule.start_time);
      setValue('end_time', existingSchedule.end_time);
      setValue('job_description', existingSchedule.job_description);
    }
  }, [existingSchedule, setValue]);

  const onSubmit = async (data: ScheduleFormData) => {
    console.log('Form submitted with data:', data);
    
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
      const scheduleData = {
        profile_id: user.id,
        customer_name: data.customer_name.trim(),
        customer_address: data.customer_address.trim(),
        customer_phone: data.customer_phone.trim(),
        start_time: data.start_time,
        end_time: data.end_time,
        job_description: data.job_description.trim()
      };
      
      console.log('Submitting schedule data:', scheduleData);

      let result;
      
      if (scheduleId) {
        result = await supabase
          .from('schedules')
          .update({
            ...scheduleData,
            updated_at: new Date().toISOString()
          })
          .eq('id', scheduleId)
          .eq('profile_id', user.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('schedules')
          .insert(scheduleData)
          .select()
          .single();
      }

      if (result.error) {
        console.error('Supabase error:', result.error);
        throw result.error;
      }

      console.log('Operation successful:', result.data);

      toast({
        title: 'Success',
        description: scheduleId ? 'Schedule updated successfully' : 'Schedule created successfully',
        type: 'success',
      });

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

      <form 
        onSubmit={(e) => {
          e.preventDefault();
          console.log('Form submit event triggered');
          handleSubmit((data) => {
            console.log('HandleSubmit callback triggered');
            console.log('Form data:', data);
            onSubmit(data);
          })(e);
        }} 
        className="space-y-6"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700">Customer Name</label>
          <div className="mt-1">
            <Input
              {...register('customer_name', { 
                required: { value: true, message: 'Customer name is required' }
              })}
              type="text"
              className={errors.customer_name ? 'border-red-500' : ''}
              onChange={(e) => console.log('Customer name changed:', e.target.value)}
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
                required: { value: true, message: 'Customer address is required' }
              })}
              type="text"
              className={errors.customer_address ? 'border-red-500' : ''}
              onChange={(e) => console.log('Customer address changed:', e.target.value)}
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
                required: { value: true, message: 'Customer phone is required' }
              })}
              type="tel"
              className={errors.customer_phone ? 'border-red-500' : ''}
              onChange={(e) => console.log('Customer phone changed:', e.target.value)}
            />
            {errors.customer_phone && (
              <p className="mt-1 text-sm text-red-600">{errors.customer_phone.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Time</label>
            <div className="mt-1">
              <Input
                {...register('start_time', { 
                  required: { value: true, message: 'Start time is required' }
                })}
                type="datetime-local"
                className={errors.start_time ? 'border-red-500' : ''}
                onChange={(e) => console.log('Start time changed:', e.target.value)}
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
                {...register('end_time', { 
                  required: { value: true, message: 'End time is required' }
                })}
                type="datetime-local"
                className={errors.end_time ? 'border-red-500' : ''}
                onChange={(e) => console.log('End time changed:', e.target.value)}
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
                required: { value: true, message: 'Job description is required' }
              })}
              rows={4}
              className={`block w-full rounded-md border ${
                errors.job_description ? 'border-red-500' : 'border-gray-300'
              } shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm`}
              onChange={(e) => console.log('Job description changed:', e.target.value)}
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