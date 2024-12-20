import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import {
  Calendar,
  DollarSign,
  FileText,
  Users,
  LayoutGrid,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: LayoutGrid,
      title: 'Website Builder',
      description: 'Build and maintain your professional business website without any technical knowledge.'
    },
    {
      icon: Users,
      title: 'Lead Management',
      description: 'Never miss a potential client with our organized inquiry tracking system.'
    },
    {
      icon: FileText,
      title: 'Invoice Generation',
      description: 'Create and manage professional invoices for your clients in seconds.'
    },
    {
      icon: Calendar,
      title: 'Schedule Management',
      description: 'Easily manage your appointments and jobs with our intuitive scheduling system.'
    },
    {
      icon: DollarSign,
      title: 'Expense Tracking',
      description: 'Keep track of all your business expenses with categorization and reporting.'
    }
  ];

  const tradeBusinesses = [
    'Electricians',
    'Carpenters',
    'Landscapers',
    'Cleaners',
    'HVAC Services',
    'Roofers',
    'Builders',
    'Tilers'
  ];

  const benefits = [
    'All-in-one solution for small business owners',
    'No technical expertise required',
    'Save hours on administrative tasks',
    'Professional tools at an affordable price',
    'Secure and reliable platform'
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-blue-500 to-blue-200 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>

        {/* Navigation */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">LiteBiz</span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/login')}
              className="text-sm"
            >
              Login
            </Button>
            <Button
              onClick={() => navigate('/login')}
              className="text-sm"
            >
              Get Started
            </Button>
          </div>
        </div>

        {/* Hero Content */}
        <div className="mx-auto max-w-7xl pt-16 sm:pt-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                Your Whole Business,<br />
                One Simple App.
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                There's 5 core things you need when starting a business: A website, a way to receive inquiries, 
                a way to create and send invoices, a way to track expenses and a way to schedule jobs.
                LiteBiz puts each of these core tools in the world's simplest single business app.
              </p>
              <div className="mt-10 flex items-center gap-x-6">
                <Button
                  onClick={() => navigate('/login')}
                  className="text-base"
                >
                  Start Free Trial
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {}}
                  className="text-base"
                >
                  See it in action
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] bg-gray-100 rounded-lg">
                {/* Placeholder for hero image */}
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  Image placeholder
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trade Businesses Section */}
      <div className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Perfect For Trade and Service Businesses
          </h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-8 text-center text-gray-600">
            {tradeBusinesses.map((business) => (
              <div key={business} className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full mb-3 flex items-center justify-center">
                  {/* Placeholder for business icon */}
                </div>
                <span className="text-sm">{business}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">Everything You Need</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Five Essential Tools in One Simple App
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Stop juggling multiple apps and spreadsheets. LiteBiz brings together all the tools you need to run your business efficiently.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <feature.icon className="h-5 w-5 flex-none text-blue-600" aria-hidden="true" />
                    {feature.title}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">Why Choose LiteBiz</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Built for Business Owners, Not Accountants
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24">
            <ul role="list" className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex gap-x-3">
                  <CheckCircle2 className="h-6 w-5 flex-none text-blue-600" aria-hidden="true" />
                  <span className="text-gray-600">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white">
        <div className="mx-auto max-w-7xl py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="relative isolate overflow-hidden bg-gray-900 px-6 py-24 text-center shadow-2xl sm:rounded-3xl sm:px-16">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Start Managing Your Business Better Today
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-300">
              Join thousands of business owners who are saving time and growing their businesses with LiteBiz.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button
                onClick={() => navigate('/login')}
                className="text-base"
              >
                Get Started Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="absolute -top-24 right-0 -z-10 transform-gpu blur-3xl">
              <div className="aspect-[1404/767] w-[87.75rem] bg-gradient-to-r from-blue-500 to-blue-200 opacity-25" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 