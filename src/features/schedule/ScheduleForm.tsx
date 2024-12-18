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

  const { register, handleSubmit } = useForm<ScheduleFormData>({
    defaultValues: {
      start_date: today,
      start_time: '09:00',
      end_time: '10:00'
    }
  });

  const onSubmit = async (data: ScheduleFormData) => {
    try {
      if (!user?.id) return navigate('/login');

      const startDateTime = new Date(`${data.start_date}T${data.start_time}:00`);
      const endDateTime = new Date(`${data.start_date}T${data.end_time}:00`);

      const scheduleContent: ScheduleContent = {
        customer_name: data.customer_name,
        description: data.description,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        location: data.location || null
      };

      const { error } = await supabase
        .from('schedule')
        .insert({
          profile_id: user.id,
          content: scheduleContent
        });

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['schedule'] });
      navigate('/schedule');
    } catch (error: any) {
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