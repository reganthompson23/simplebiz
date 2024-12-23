import React, { useState } from 'react';
import { WebsiteContent } from './types';
import { supabase } from '../../lib/supabase';

interface WebsitePreviewProps {
  content: WebsiteContent;
  profileId: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export default function WebsitePreview({ content, profileId }: WebsitePreviewProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    // Clear success/error messages when user starts typing again
    setSubmitSuccess(false);
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset states
    setErrors({});
    setSubmitError(null);
    setSubmitSuccess(false);
    
    // Validate form
    const newErrors: Record<string, string> = {};
    if (leadForm.fields.name && !formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (leadForm.fields.email && !formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (leadForm.fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (leadForm.fields.phone && !formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('leads')
        .insert([
          {
            profile_id: profileId,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            notes: formData.message,
            source: window.location.hostname,
            status: 'new'
          }
        ]);

      if (error) throw error;

      // Clear form on success
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });
      setSubmitSuccess(true);
    } catch (error: any) {
      console.error('Error submitting lead:', error);
      setSubmitError('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const {
    businessName = '',
    aboutUs = '',
    services = [],
    contactInfo = {
      phone: '',
      email: '',
      address: '',
    },
    leadForm = {
      enabled: true,
      fields: {
        name: true,
        email: true,
        phone: true,
        message: true,
      },
    },
    theme = {
      primaryColor: '#2563eb',
      secondaryColor: '#1e40af',
      fontFamily: 'Inter',
      topImage: '',
      overlayOpacity: 0,
    },
  } = content || {};

  return (
    <div 
      className="min-h-screen bg-white"
      style={{
        '--primary-color': theme.primaryColor,
        '--secondary-color': theme.secondaryColor,
        fontFamily: theme.fontFamily,
      } as React.CSSProperties}
    >
      {/* Hero Section */}
      <header 
        className="relative py-20 px-4 text-center text-white overflow-hidden"
        style={{ minHeight: '400px' }}
      >
        {theme.topImage && (
          <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${theme.topImage})` }}
          />
        )}
        <div 
          className="absolute inset-0 w-full h-full"
          style={{ 
            backgroundColor: theme.primaryColor,
            opacity: theme.overlayOpacity / 100
          }} 
        />
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-4 text-shadow-lg">{businessName}</h1>
          <p className="text-xl max-w-2xl mx-auto text-shadow-lg">{aboutUs}</p>
        </div>
      </header>

      {/* Services Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 
            className="text-3xl font-bold text-center mb-8"
            style={{ color: theme.primaryColor }}
          >
            Our Services
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => (
              service && (
                <div 
                  key={index}
                  className="p-6 bg-white rounded-lg shadow-sm"
                >
                  <p className="text-lg">{service}</p>
                </div>
              )
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 
            className="text-3xl font-bold text-center mb-8"
            style={{ color: theme.primaryColor }}
          >
            Contact Us
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Information */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Get in Touch</h3>
              <div className="space-y-4">
                {contactInfo.phone && (
                  <p>
                    <strong>Phone:</strong> {contactInfo.phone}
                  </p>
                )}
                {contactInfo.email && (
                  <p>
                    <strong>Email:</strong> {contactInfo.email}
                  </p>
                )}
                {contactInfo.address && (
                  <p>
                    <strong>Address:</strong> {contactInfo.address}
                  </p>
                )}
              </div>
            </div>

            {/* Lead Form */}
            {leadForm.enabled && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Send us a Message</h3>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  {submitSuccess && (
                    <div className="p-4 rounded-md bg-green-50 text-green-800">
                      Thank you for your message! We'll get back to you soon.
                    </div>
                  )}
                  {submitError && (
                    <div className="p-4 rounded-md bg-red-50 text-red-800">
                      {submitError}
                    </div>
                  )}
                  {leadForm.fields.name && (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`w-full p-2 border rounded-md ${
                          errors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                      )}
                    </div>
                  )}
                  {leadForm.fields.email && (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full p-2 border rounded-md ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                      )}
                    </div>
                  )}
                  {leadForm.fields.phone && (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full p-2 border rounded-md ${
                          errors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                      )}
                    </div>
                  )}
                  {leadForm.fields.message && (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Message
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  )}
                  <button
                    type="submit"
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer 
        className="py-8 px-4 text-center text-white"
        style={{ backgroundColor: theme.secondaryColor }}
      >
        <p>&copy; {new Date().getFullYear()} {businessName}. All rights reserved.</p>
      </footer>
    </div>
  );
} 