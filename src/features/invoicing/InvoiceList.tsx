import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Invoice } from '../../types';
import { FileText, Plus, Download, Send, Eye, Pencil } from 'lucide-react';
import { PDFDownloadLink, BlobProvider } from '@react-pdf/renderer';
import InvoicePDF from './InvoicePDF';
import { formatCurrency } from '../../lib/utils';

export default function InvoiceList() {
  const navigate = useNavigate();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;

      // Fetch items for each invoice
      const invoicesWithItems = await Promise.all(
        invoicesData.map(async (invoice) => {
          const { data: items, error: itemsError } = await supabase
            .from('invoice_items')
            .select('*')
            .eq('invoice_id', invoice.id);

          if (itemsError) throw itemsError;

          return {
            ...invoice,
            items: items || []
          };
        })
      );

      return invoicesWithItems as Invoice[];
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4">
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

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <FileText className="h-6 w-6 text-gray-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
            </div>
            <button
              onClick={() => navigate('/dashboard/invoices/new')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices?.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{invoice.invoice_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {typeof invoice.to_details === 'string' 
                        ? JSON.parse(invoice.to_details).businessName 
                        : invoice.to_details.businessName}
                    </div>
                    {(typeof invoice.to_details === 'string' 
                      ? JSON.parse(invoice.to_details).email 
                      : invoice.to_details.email) && (
                      <div className="text-sm text-gray-500">
                        {typeof invoice.to_details === 'string' 
                          ? JSON.parse(invoice.to_details).email 
                          : invoice.to_details.email}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(invoice.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => navigate(`/dashboard/invoices/view/${invoice.id}`)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="h-4 w-4 inline" />
                    </button>
                    <button
                      onClick={() => navigate(`/dashboard/invoices/${invoice.id}/edit`)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <Pencil className="h-4 w-4 inline" />
                    </button>
                    <PDFDownloadLink
                      document={<InvoicePDF invoice={invoice} />}
                      fileName={`invoice-${invoice.invoice_number}.pdf`}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      {({ loading }) => 
                        loading ? (
                          <span className="text-gray-400">...</span>
                        ) : (
                          <Download className="h-4 w-4 inline" />
                        )
                      }
                    </PDFDownloadLink>
                    {invoice.status === 'draft' && (
                      <button
                        onClick={() => {
                          // TODO: Implement send functionality
                        }}
                        className="text-green-600 hover:text-green-900"
                      >
                        <Send className="h-4 w-4 inline" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}