import React from 'react';
import { cn } from '../../lib/utils';

interface ToastProps {
  title?: string;
  description?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
}

// Create a container for toasts
const toastContainer = document.createElement('div');
toastContainer.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
document.body.appendChild(toastContainer);

export function toast({ title, description, type = 'info' }: ToastProps) {
  const toastElement = document.createElement('div');
  toastElement.className = cn(
    'rounded-lg p-4 shadow-lg transition-all duration-300 transform translate-x-full',
    {
      'bg-green-50 text-green-800 border border-green-200': type === 'success',
      'bg-red-50 text-red-800 border border-red-200': type === 'error',
      'bg-yellow-50 text-yellow-800 border border-yellow-200': type === 'warning',
      'bg-blue-50 text-blue-800 border border-blue-200': type === 'info',
    }
  );

  const titleElement = title ? `<div class="font-medium">${title}</div>` : '';
  const descElement = description ? `<div class="text-sm">${description}</div>` : '';
  
  toastElement.innerHTML = `${titleElement}${descElement}`;
  toastContainer.appendChild(toastElement);

  // Animate in
  requestAnimationFrame(() => {
    toastElement.classList.remove('translate-x-full');
  });

  // Remove after 3 seconds
  setTimeout(() => {
    toastElement.classList.add('translate-x-full');
    setTimeout(() => {
      toastContainer.removeChild(toastElement);
    }, 300);
  }, 3000);
} 