import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { ScheduleFormData } from '../../types/schedule';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from '../../components/ui/Toast';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function ScheduleFormV2() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  const { register, handleSubmit, formState: { errors } } = useForm<ScheduleFormData>({
    defaultValues: {
      start_date: today,
      start_time: '09:00',
      end_time: '10:00'
    }
  });

  const onSubmit = async (data: ScheduleFormData) => {
    try {
      if (!user?.id) return navigate('/login');

      // Create date objects
      const startDateTime = new Date(`${data.start_date}T${data.start_time}`);
      const endDateTime = new Date(`${data.start_date}T${data.end_time}`);

      const { error } = await supabase
        .from('schedule_v2')
        .insert({
          profile_id: user.id,
          customer_name: data.customer_name,
          description: data.description,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          location: data.location || null
        });

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['schedule_v2'] });
      toast({
        title: 'Success',
        description: 'Appointment created successfully',
        type: 'success'
      });
      navigate('/schedule');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create appointment',
        type: 'error'
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
          <label className="block text-sm font-medium text-gray-700">
            Customer Name
          </label>
          <Input
            type="text"
            {...register('customer_name', { required: 'Customer name is required' })}
            className="mt-1"
            placeholder="Enter customer name"
          />
          {errors.customer_name && (
            <p className="mt-1 text-sm text-red-600">{errors.customer_name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <Input
            type="text"
            {...register('description', { required: 'Description is required' })}
            className="mt-1"
            placeholder="Enter appointment description"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Date
          </label>
          <Input
            type="date"
            {...register('start_date', { required: 'Date is required' })}
            className="mt-1"
            min={today}
          />
          {errors.start_date && (
            <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Start Time
            </label>
            <Input
              type="time"
              {...register('start_time', { required: 'Start time is required' })}
              className="mt-1"
            />
            {errors.start_time && (
              <p className="mt-1 text-sm text-red-600">{errors.start_time.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              End Time
            </label>
            <Input
              type="time"
              {...register('end_time', { required: 'End time is required' })}
              className="mt-1"
            />
            {errors.end_time && (
              <p className="mt-1 text-sm text-red-600">{errors.end_time.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Location (Optional)
          </label>
          <Input
            type="text"
            {...register('location')}
            className="mt-1"
            placeholder="Enter location"
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/schedule')}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Create Appointment
          </Button>
        </div>
      </form>
    </div>
  );
} 