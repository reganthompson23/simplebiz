import React from 'react';
import { cn } from '../../lib/utils';

interface ToastProps {
  title?: string;
  description?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
}

export function toast({ title, description, type = 'info' }: ToastProps) {
  // For now, we'll just use console.log as a placeholder
  // In a real app, you'd want to use a proper toast library
  console.log(`[${type.toUpperCase()}] ${title}: ${description}`);
} 