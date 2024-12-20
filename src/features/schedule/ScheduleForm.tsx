import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from '../../components/ui/Toast';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function ScheduleForm() {
  const navigate = useNavigate();
  const { id: scheduleId } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  // Basic form state
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_address: '',
    customer_phone: '',
    schedule_date: today,
    start_time: '09:00',
    end_time: '17:00',
    job_description: ''
  });

  // Basic error state
  const [errors, setErrors] = useState({
    customer_name: '',
    customer_address: '',
    customer_phone: '',
    schedule_date: '',
    start_time: '',
    end_time: '',
    job_description: ''
  });

  // Fetch existing schedule if editing
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
      return data;
    },
    enabled: !!scheduleId
  });

  // Set form data when existing schedule is loaded
  useEffect(() => {
    if (existingSchedule) {
      setFormData({
        customer_name: existingSchedule.customer_name,
        customer_address: existingSchedule.customer_address,
        customer_phone: existingSchedule.customer_phone,
        schedule_date: existingSchedule.schedule_date,
        start_time: existingSchedule.start_time,
        end_time: existingSchedule.end_time,
        job_description: existingSchedule.job_description
      });
    }
  }, [existingSchedule]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    setErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  };

  // Basic validation
  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'Customer name is required';
      isValid = false;
    }

    if (!formData.customer_address.trim()) {
      newErrors.customer_address = 'Customer address is required';
      isValid = false;
    }

    if (!formData.customer_phone.trim()) {
      newErrors.customer_phone = 'Customer phone is required';
      isValid = false;
    }

    if (!formData.schedule_date) {
      newErrors.schedule_date = 'Date is required';
      isValid = false;
    }

    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required';
      isValid = false;
    }

    if (!formData.end_time) {
      newErrors.end_time = 'End time is required';
      isValid = false;
    }

    if (!formData.job_description.trim()) {
      newErrors.job_description = 'Job description is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);

    if (!validateForm()) {
      console.log('Validation failed');
      return;
    }

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
        ...formData
      };

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

    } catch (error) {
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Customer Name</label>
          <div className="mt-1">
            <Input
              name="customer_name"
              value={formData.customer_name}
              onChange={handleChange}
              type="text"
              className={errors.customer_name ? 'border-red-500' : ''}
            />
            {errors.customer_name && (
              <p className="mt-1 text-sm text-red-600">{errors.customer_name}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Customer Address</label>
          <div className="mt-1">
            <Input
              name="customer_address"
              value={formData.customer_address}
              onChange={handleChange}
              type="text"
              className={errors.customer_address ? 'border-red-500' : ''}
            />
            {errors.customer_address && (
              <p className="mt-1 text-sm text-red-600">{errors.customer_address}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Customer Phone</label>
          <div className="mt-1">
            <Input
              name="customer_phone"
              value={formData.customer_phone}
              onChange={handleChange}
              type="tel"
              className={errors.customer_phone ? 'border-red-500' : ''}
            />
            {errors.customer_phone && (
              <p className="mt-1 text-sm text-red-600">{errors.customer_phone}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <div className="mt-1">
            <Input
              name="schedule_date"
              value={formData.schedule_date}
              onChange={handleChange}
              type="date"
              min={today}
              className={errors.schedule_date ? 'border-red-500' : ''}
            />
            {errors.schedule_date && (
              <p className="mt-1 text-sm text-red-600">{errors.schedule_date}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Time</label>
            <div className="mt-1">
              <Input
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                type="time"
                className={errors.start_time ? 'border-red-500' : ''}
              />
              {errors.start_time && (
                <p className="mt-1 text-sm text-red-600">{errors.start_time}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">End Time</label>
            <div className="mt-1">
              <Input
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                type="time"
                className={errors.end_time ? 'border-red-500' : ''}
              />
              {errors.end_time && (
                <p className="mt-1 text-sm text-red-600">{errors.end_time}</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Job Description</label>
          <div className="mt-1">
            <textarea
              name="job_description"
              value={formData.job_description}
              onChange={handleChange}
              rows={4}
              className={`block w-full rounded-md border ${
                errors.job_description ? 'border-red-500' : 'border-gray-300'
              } shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm`}
            />
            {errors.job_description && (
              <p className="mt-1 text-sm text-red-600">{errors.job_description}</p>
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