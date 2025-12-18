'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schedulingApi, usersApi } from '@/lib/api';
import { toast } from 'sonner';

export interface SalesExecSchedule {
  id: string;
  userId: string;
  date: string;
  availableFrom: string;
  availableTo: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface SalesExecutive {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive: boolean;
}

// Get team schedule for showroom manager
export function useTeamSchedule(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['teamSchedule', startDate, endDate],
    queryFn: async () => {
      const response = await schedulingApi.getTeamSchedule({ startDate, endDate });
      return response.data as SalesExecSchedule[];
    },
    enabled: !!startDate && !!endDate,
  });
}

// Get sales executives for showroom
export function useSalesExecutives(showroomId?: string) {
  return useQuery({
    queryKey: ['salesExecutives', showroomId],
    queryFn: async () => {
      const response = await usersApi.getAll({
        role: 'SALES_EXECUTIVE',
        showroomId,
        isActive: true,
      });
      return response.data as SalesExecutive[];
    },
  });
}

// Set availability for a sales executive
export function useSetAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      userId?: string;
      date: string;
      availableFrom: string;
      availableTo: string;
    }) => schedulingApi.setAvailability(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamSchedule'] });
      toast.success('Availability updated');
    },
    onError: () => {
      toast.error('Failed to update availability');
    },
  });
}

// Remove availability for a sales executive
export function useRemoveAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { userId?: string; date: string }) =>
      schedulingApi.removeAvailability(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamSchedule'] });
      toast.success('Availability removed');
    },
    onError: () => {
      toast.error('Failed to remove availability');
    },
  });
}
