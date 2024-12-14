import React from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../store/authStore';
import { Save } from 'lucide-react';

interface WebsiteFormData {
  businessName: string;
  aboutUs: string;
  services: string[];
  phone: string;
  email: string;
  address: string;
}

export default function WebsiteBuilder() {
  const { user } = useAuthStore();
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<WebsiteFormData>({
    defaultValues: {
      businessName: user?.businessName || '',
      aboutUs: '',
      services: [''],
      phone: user?.phone || '',
      email: user?.email || '',
      address: user?.businessAddress || '',
    }
  });

  const onSubmit = async (data: WebsiteFormData) => {
    // TODO: Implement website data saving
    console.log(data);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Website Builder</h1>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={!isDirty}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </button>
        </div>

        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Business Name</label>
            <input
              type="text"
              {...register('businessName', { required: 'Business name is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.businessName && (
              <p className="mt-1 text-sm text-red-600">{errors.businessName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">About Us</label>
            <textarea
              {...register('aboutUs', { required: 'About us section is required' })}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.aboutUs && (
              <p className="mt-1 text-sm text-red-600">{errors.aboutUs.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Information</label>
            <div className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <input
                  type="tel"
                  {...register('phone')}
                  placeholder="Phone"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="Email"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4">
              <textarea
                {...register('address')}
                placeholder="Address"
                rows={2}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}