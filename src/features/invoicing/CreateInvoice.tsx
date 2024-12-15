import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Invoice, InvoiceItem } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { Plus, Trash2, Save, Send } from 'lucide-react';

interface InvoiceFormData {
  fromDetails: {
    businessName: string;
    address?: string;
    phone?: string;
    email?: string;
    abn?: string;
  };
  toDetails: {
    businessName: string;
    address?: string;
    phone?: string;
    email?: string;
    abn?: string;
  };
  paymentTerms?: string;
  issueDate: string;
  dueDate?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
  notes?: string;
  terms?: string;
}

export default function CreateInvoice() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<InvoiceFormData>({
    defaultValues: {
      issueDate: new Date().toISOString().split('T')[0],
      items: [{ description: '', quantity: 1, unitPrice: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const items = watch('items');
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | undefined>();
  const [discountValue, setDiscountValue] = useState<number>(0);
  const taxRate = 10; // 10% GST

  const discountAmount = discountType === 'percentage' 
    ? (subtotal * (discountValue / 100))
    : (discountType === 'fixed' ? discountValue : 0);

  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (taxRate / 100);
  const total = taxableAmount + taxAmount;

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .single();

      if (!profile) throw new Error('Profile not found');

      // Get the next invoice number for this business
      const { data: lastInvoice } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const nextInvoiceNumber = lastInvoice 
        ? String(Number(lastInvoice.invoice_number) + 1).padStart(4, '0')
        : '0001';

      // Format dates for PostgreSQL
      const formattedIssueDate = new Date(data.issueDate).toISOString().split('T')[0];
      const formattedDueDate = data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : null;

      // Create the invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          profile_id: profile.id,
          invoice_number: nextInvoiceNumber,
          from_details: data.fromDetails,
          to_details: data.toDetails,
          payment_terms: data.paymentTerms,
          issue_date: formattedIssueDate,
          due_date: formattedDueDate,
          subtotal,
          discount_type: discountType,
          discount_value: discountValue,
          tax_rate: taxRate,
          total,
          notes: data.notes,
          terms: data.terms,
          status: 'draft'
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const items = data.items.map(item => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        amount: item.quantity * item.unitPrice
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(items);

      if (itemsError) throw itemsError;

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      navigate('/invoices');
    }
  });

  const onSubmit = async (data: InvoiceFormData) => {
    setIsSubmitting(true);
    try {
      await createInvoiceMutation.mutateAsync(data);
    } catch (error) {
      console.error('Failed to create invoice:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Invoice</h1>

          {/* From Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">From</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700">Business Name</label>
                <input
                  type="text"
                  {...register('fromDetails.businessName', { required: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea
                  {...register('fromDetails.address')}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">ABN</label>
                <input
                  type="text"
                  {...register('fromDetails.abn')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* To Details */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">To</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700">Business Name</label>
                <input
                  type="text"
                  {...register('toDetails.businessName', { required: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea
                  {...register('toDetails.address')}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">ABN</label>
                <input
                  type="text"
                  {...register('toDetails.abn')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700">Issue Date</label>
              <input
                type="date"
                {...register('issueDate', { required: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input
                type="date"
                {...register('dueDate')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Terms</label>
              <input
                type="text"
                {...register('paymentTerms')}
                placeholder="e.g. Net 30"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Line Items</h2>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-4 items-start">
                  <div className="col-span-6">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <input
                      type="text"
                      {...register(`items.${index}.description` as const, { required: true })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Quantity</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`items.${index}.quantity` as const, { 
                        required: true,
                        min: 0.01,
                        valueAsNumber: true
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Unit Price</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`items.${index}.unitPrice` as const, {
                        required: true,
                        min: 0,
                        valueAsNumber: true
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <div className="mt-2 text-sm text-gray-900">
                      {formatCurrency(items[index]?.quantity * items[index]?.unitPrice || 0)}
                    </div>
                  </div>
                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="mt-6 p-2 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Line Item
              </button>
            </div>
          </div>

          {/* Totals */}
          <div className="mb-8">
            <div className="w-full md:w-1/2 ml-auto space-y-4">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex items-center space-x-4">
                <select
                  value={discountType || ''}
                  onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed' | undefined)}
                  className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">No Discount</option>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
                {discountType && (
                  <input
                    type="number"
                    step="0.01"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder={discountType === 'percentage' ? 'Percentage' : 'Amount'}
                  />
                )}
                {discountType && (
                  <div className="text-sm text-gray-700">
                    -{formatCurrency(discountAmount)}
                  </div>
                )}
              </div>

              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">GST ({taxRate}%)</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="text-base font-semibold text-gray-900">Total</span>
                  <span className="text-base font-semibold text-gray-900">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                {...register('notes')}
                rows={4}
                placeholder="Any relevant information not already covered"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Terms and Conditions</label>
              <textarea
                {...register('terms')}
                rows={4}
                placeholder="Payment methods, late fees, delivery schedule, etc."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/invoices')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              Save as Draft
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                // TODO: Implement send functionality
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4 mr-2" />
              Save & Send
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 