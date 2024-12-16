import React from 'react';
import { WebsiteContent } from './types';

interface WebsitePreviewProps {
  content: WebsiteContent;
}

export default function WebsitePreview({ content }: WebsitePreviewProps) {
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
          <h1 className="text-4xl font-bold mb-4">{businessName}</h1>
          <p className="text-xl max-w-2xl mx-auto">{aboutUs}</p>
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
                <form className="space-y-4">
                  {leadForm.fields.name && (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-md"
                        disabled
                      />
                    </div>
                  )}
                  {leadForm.fields.email && (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        className="w-full px-3 py-2 border rounded-md"
                        disabled
                      />
                    </div>
                  )}
                  {leadForm.fields.phone && (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        className="w-full px-3 py-2 border rounded-md"
                        disabled
                      />
                    </div>
                  )}
                  {leadForm.fields.message && (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Message
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border rounded-md"
                        rows={4}
                        disabled
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    className="w-full py-2 px-4 text-white rounded-md"
                    style={{ backgroundColor: theme.primaryColor }}
                    disabled
                  >
                    Send Message
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