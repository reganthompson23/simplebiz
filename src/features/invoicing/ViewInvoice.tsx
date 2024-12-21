import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Invoice } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { ArrowLeft, Download } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import InvoicePDF from './InvoicePDF';

export default function ViewInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();

      if (invoiceError) throw invoiceError;

      const { data: items, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', id);

      if (itemsError) throw itemsError;

      return { ...invoice, items } as Invoice;
    }
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Invoice not found</h2>
          <p className="mt-2 text-gray-600">The invoice you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/dashboard/invoices')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  const fromDetails = typeof invoice.from_details === 'string' 
    ? JSON.parse(invoice.from_details)
    : invoice.from_details;

  const toDetails = typeof invoice.to_details === 'string'
    ? JSON.parse(invoice.to_details)
    : invoice.to_details;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => navigate('/dashboard/invoices')}
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Invoices
        </button>
        <div className="flex gap-2">
          <PDFDownloadLink
            document={<InvoicePDF invoice={invoice} />}
            fileName={`invoice-${invoice.invoice_number}.pdf`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            {({ loading }) => 
              loading ? (
                <span className="text-gray-400">Loading...</span>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </>
              )
            }
          </PDFDownloadLink>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoice #{invoice.invoice_number}</h1>
            <p className="text-gray-600 mt-1">
              Issue Date: {new Date(invoice.issue_date).toLocaleDateString()}
            </p>
            {invoice.due_date && (
              <p className="text-gray-600">
                Due Date: {new Date(invoice.due_date).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="px-4 py-2 rounded-full text-sm font-semibold capitalize" 
            style={{
              backgroundColor: invoice.status === 'paid' ? 'rgb(220 252 231)' : 
                             invoice.status === 'sent' ? 'rgb(219 234 254)' :
                             invoice.status === 'overdue' ? 'rgb(254 226 226)' :
                             'rgb(229 231 235)',
              color: invoice.status === 'paid' ? 'rgb(22 101 52)' :
                     invoice.status === 'sent' ? 'rgb(29 78 216)' :
                     invoice.status === 'overdue' ? 'rgb(153 27 27)' :
                     'rgb(55 65 81)'
            }}
          >
            {invoice.status}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">From</h2>
            <div className="text-gray-600">
              <p className="font-medium">{fromDetails.businessName}</p>
              {fromDetails.address && <p>{fromDetails.address}</p>}
              {fromDetails.phone && <p>{fromDetails.phone}</p>}
              {fromDetails.email && <p>{fromDetails.email}</p>}
              {fromDetails.abn && <p>ABN: {fromDetails.abn}</p>}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">To</h2>
            <div className="text-gray-600">
              <p className="font-medium">{toDetails.businessName}</p>
              {toDetails.address && <p>{toDetails.address}</p>}
              {toDetails.phone && <p>{toDetails.phone}</p>}
              {toDetails.email && <p>{toDetails.email}</p>}
              {toDetails.abn && <p>ABN: {toDetails.abn}</p>}
            </div>
          </div>
        </div>

        <div className="mb-8">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="text-left text-sm font-medium text-gray-500 uppercase tracking-wider py-3">Description</th>
                <th className="text-right text-sm font-medium text-gray-500 uppercase tracking-wider py-3">Quantity</th>
                <th className="text-right text-sm font-medium text-gray-500 uppercase tracking-wider py-3">Unit Price</th>
                <th className="text-right text-sm font-medium text-gray-500 uppercase tracking-wider py-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoice.items.map((item, index) => (
                <tr key={index}>
                  <td className="py-4 text-sm text-gray-900">{item.description}</td>
                  <td className="py-4 text-sm text-gray-900 text-right">{item.quantity}</td>
                  <td className="py-4 text-sm text-gray-900 text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="py-4 text-sm text-gray-900 text-right">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="w-64 ml-auto">
            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-600">Subtotal</span>
              <span className="text-sm text-gray-900">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discount_value > 0 && (
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-600">
                  Discount
                  {invoice.discount_type === 'percentage' && ` (${invoice.discount_value}%)`}
                </span>
                <span className="text-sm text-gray-900">
                  -{formatCurrency(
                    invoice.discount_type === 'percentage'
                      ? (invoice.subtotal * invoice.discount_value) / 100
                      : invoice.discount_value
                  )}
                </span>
              </div>
            )}
            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-600">GST ({invoice.tax_rate}%)</span>
              <span className="text-sm text-gray-900">
                {formatCurrency((invoice.subtotal * invoice.tax_rate) / 100)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-t border-gray-200">
              <span className="text-base font-semibold text-gray-900">Total</span>
              <span className="text-base font-semibold text-gray-900">{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        {(invoice.notes || invoice.terms) && (
          <div className="border-t border-gray-200 mt-8 pt-8">
            {invoice.notes && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Notes</h3>
                <p className="text-sm text-gray-600">{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Terms and Conditions</h3>
                <p className="text-sm text-gray-600">{invoice.terms}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 