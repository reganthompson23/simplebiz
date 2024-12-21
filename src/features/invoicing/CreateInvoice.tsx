import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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
  const { id: invoiceId } = useParams();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch existing invoice data if editing
  const { data: existingInvoice, isLoading: isLoadingInvoice } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (invoiceError) throw invoiceError;

      const { data: items, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId);

      if (itemsError) throw itemsError;

      return { ...invoice, items };
    },
    enabled: !!invoiceId
  });

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<InvoiceFormData>({
    defaultValues: {
      issueDate: new Date().toISOString().split('T')[0],
      items: [{ description: '', quantity: 1, unitPrice: 0 }]
    }
  });

  // Set form data when existing invoice is loaded
  useEffect(() => {
    if (existingInvoice) {
      const fromDetails = typeof existingInvoice.from_details === 'string' 
        ? JSON.parse(existingInvoice.from_details)
        : existingInvoice.from_details;

      const toDetails = typeof existingInvoice.to_details === 'string'
        ? JSON.parse(existingInvoice.to_details)
        : existingInvoice.to_details;

      reset({
        fromDetails,
        toDetails,
        paymentTerms: existingInvoice.payment_terms,
        issueDate: existingInvoice.issue_date,
        dueDate: existingInvoice.due_date,
        items: existingInvoice.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unit_price
        })),
        notes: existingInvoice.notes,
        terms: existingInvoice.terms
      });

      setDiscountType(existingInvoice.discount_type);
      setDiscountValue(existingInvoice.discount_value || 0);
    }
  }, [existingInvoice, reset]);

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

      // Get the next invoice number for this business (only for new invoices)
      let invoiceNumber = existingInvoice?.invoice_number;
      if (!invoiceNumber) {
        const { data: lastInvoice } = await supabase
          .from('invoices')
          .select('invoice_number')
          .eq('profile_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        invoiceNumber = lastInvoice 
          ? String(Number(lastInvoice.invoice_number) + 1).padStart(4, '0')
          : '0001';
      }

      // Format dates for PostgreSQL
      const formattedIssueDate = new Date(data.issueDate).toISOString().split('T')[0];
      const formattedDueDate = data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : null;

      const invoiceData = {
        profile_id: profile.id,
        invoice_number: invoiceNumber,
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
      };

      let invoice;
      if (invoiceId) {
        // Update existing invoice
        const { data: updatedInvoice, error: invoiceError } = await supabase
          .from('invoices')
          .update(invoiceData)
          .eq('id', invoiceId)
          .select()
          .single();

        if (invoiceError) throw invoiceError;
        invoice = updatedInvoice;

        // Delete existing items
        await supabase
          .from('invoice_items')
          .delete()
          .eq('invoice_id', invoiceId);
      } else {
        // Create new invoice
        const { data: newInvoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert(invoiceData)
          .select()
          .single();

        if (invoiceError) throw invoiceError;
        invoice = newInvoice;
      }

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
      if (invoiceId) {
        queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      }
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
      {isLoadingInvoice ? (
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              {invoiceId ? 'Edit Invoice' : 'Create New Invoice'}
            </h1>

            {/* From Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">From</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Business Name</label>
                  <input
                    type="text"
                    {...register('fromDetails.businessName', { required: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 bg-gray-50 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    {...register('fromDetails.address')}
                    rows={1}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm min-h-[40px] bg-gray-50 overflow-hidden resize-none transition-all duration-200 px-3 py-2"
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = '40px';
                      const newHeight = Math.max(40, target.scrollHeight);
                      target.style.height = `${newHeight}px`;
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">ABN</label>
                  <input
                    type="text"
                    {...register('fromDetails.abn')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 bg-gray-50 px-3"
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 bg-gray-50 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    {...register('toDetails.address')}
                    rows={1}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm min-h-[40px] bg-gray-50 overflow-hidden resize-none transition-all duration-200 px-3 py-2"
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = '40px';
                      const newHeight = Math.max(40, target.scrollHeight);
                      target.style.height = `${newHeight}px`;
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">ABN</label>
                  <input
                    type="text"
                    {...register('toDetails.abn')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 bg-gray-50 px-3"
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 bg-gray-50 px-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                <input
                  type="date"
                  {...register('dueDate')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 bg-gray-50 px-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Terms</label>
                <input
                  type="text"
                  {...register('paymentTerms')}
                  placeholder="e.g. Net 30"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 bg-gray-50 px-3"
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Line Items</h2>
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 items-start">
                    <div className="col-span-6">
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <input
                        type="text"
                        {...register(`items.${index}.description` as const, { required: true })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 bg-gray-50 px-3"
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
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 bg-gray-50 px-3"
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
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 bg-gray-50 px-3"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700">Amount</label>
                      <div className="mt-2 text-sm text-gray-900">
                        {formatCurrency(item.quantity * item.unitPrice || 0)}
                      </div>
                    </div>
                    <div className="col-span-1">
                      <button
                        type="button"
                        onClick={() => {
                          const newItems = items.filter((_, i) => i !== index);
                          setValue('items', newItems);
                        }}
                        className="mt-6 p-2 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newItem = { description: '', quantity: 1, unitPrice: 0 };
                    setValue('items', [...items, newItem]);
                  }}
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
                  rows={1}
                  placeholder="Any relevant information not already covered"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm min-h-[40px] bg-gray-50 overflow-hidden resize-none transition-all duration-200 px-3 py-2"
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = '40px';
                    const newHeight = Math.max(40, target.scrollHeight);
                    target.style.height = `${newHeight}px`;
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Terms and Conditions</label>
                <textarea
                  {...register('terms')}
                  rows={1}
                  placeholder="Payment methods, late fees, delivery schedule, etc."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm min-h-[40px] bg-gray-50 overflow-hidden resize-none transition-all duration-200 px-3 py-2"
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = '40px';
                    const newHeight = Math.max(40, target.scrollHeight);
                    target.style.height = `${newHeight}px`;
                  }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard/invoices')}
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
                {invoiceId ? 'Update Invoice' : 'Save as Draft'}
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
      )}
    </div>
  );
} 