'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Lead } from '@/types';

export function useLeads(params?: { status?: string; source?: string; assignedToId?: string }) {
  return useQuery({
    queryKey: ['leads', params],
    queryFn: async () => {
      const response = await leadsApi.getAll(params);
      return response.data as Lead[];
    },
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const response = await leadsApi.getById(id);
      return response.data as Lead;
    },
    enabled: !!id,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      firstName: string;
      lastName: string;
      phone: string;
      email?: string;
      source: string;
      interestedCarModelId?: string;
      preferredShowroomId?: string;
      notes?: string;
    }) => leadsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead created successfully');
    },
    onError: () => {
      toast.error('Failed to create lead');
    },
  });
}

export function useAssignLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, assignedToId }: { id: string; assignedToId: string }) =>
      leadsApi.assign(id, assignedToId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead assigned');
    },
    onError: () => {
      toast.error('Failed to assign lead');
    },
  });
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      leadsApi.updateStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead status updated');
    },
    onError: () => {
      toast.error('Failed to update lead status');
    },
  });
}

export function useConvertLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, bookingData }: { id: string; bookingData: unknown }) =>
      leadsApi.convert(id, bookingData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Lead converted to booking');
    },
    onError: () => {
      toast.error('Failed to convert lead');
    },
  });
}
