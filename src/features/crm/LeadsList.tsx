import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Lead } from '../../types';
import { Users, Filter, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';

const LEAD_STATUSES = {
  open: { label: 'Open', color: 'bg-blue-100 text-blue-800' },
  closed: { label: 'Closed', color: 'bg-green-100 text-green-800' },
  lost: { label: 'Lost', color: 'bg-red-100 text-red-800' }
};

export default function LeadsList() {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const { data: leads, isLoading } = useQuery({
    queryKey: ['leads', selectedStatus],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedStatus) {
        query = query.eq('status', selectedStatus);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as Lead[];
    },
  });

  const updateLeadStatus = useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: string }) => {
      const { error } = await supabase
        .from('leads')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({
        title: 'Success',
        description: 'Lead status updated successfully',
        type: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update lead status',
        type: 'error',
      });
    },
  });

  const deleteLead = useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setSelectedLead(null);
      toast({
        title: 'Success',
        description: 'Lead deleted successfully',
        type: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete lead',
        type: 'error',
      });
    },
  });

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
              <Users className="h-6 w-6 text-gray-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
              <div className="ml-4 flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={selectedStatus || ''}
                  onChange={(e) => setSelectedStatus(e.target.value || null)}
                  className="text-sm border-gray-300 rounded-md"
                >
                  <option value="">All Statuses</option>
                  {Object.entries(LEAD_STATUSES).map(([value, { label }]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {!leads?.length ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">No leads found</p>
            <p className="text-sm text-gray-400">
              {selectedStatus 
                ? `No leads with status "${LEAD_STATUSES[selectedStatus as keyof typeof LEAD_STATUSES].label}"`
                : 'Leads from your website will appear here'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.map((lead) => (
                  <React.Fragment key={lead.id}>
                    <tr 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{lead.email}</div>
                        {lead.phone && (
                          <div className="text-sm text-gray-500">{lead.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative inline-block">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const select = e.currentTarget.nextElementSibling as HTMLSelectElement;
                              select?.click();
                            }}
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${LEAD_STATUSES[lead.status as keyof typeof LEAD_STATUSES]?.color}`}
                          >
                            {LEAD_STATUSES[lead.status as keyof typeof LEAD_STATUSES]?.label}
                          </button>
                          <select
                            value={lead.status}
                            onChange={(e) => {
                              e.stopPropagation();
                              updateLeadStatus.mutate({ 
                                leadId: lead.id, 
                                status: e.target.value 
                              });
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          >
                            {Object.entries(LEAD_STATUSES).map(([value, { label }]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lead.source || 'Direct'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(lead.created_at).toLocaleDateString('en-AU', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Are you sure you want to delete this lead?')) {
                              deleteLead.mutate(lead.id);
                            }
                          }}
                          title="Delete Lead"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                    {selectedLead?.id === lead.id && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-gray-50">
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-sm font-medium text-gray-900">Notes</h3>
                              <p className="mt-1 text-sm text-gray-600">{lead.notes || 'No notes'}</p>
                            </div>
                            <div className="text-sm text-gray-500">
                              <p>Last updated: {new Date(lead.updated_at).toLocaleDateString('en-AU', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}