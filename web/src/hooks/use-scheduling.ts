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
      // Use predicate to invalidate all teamSchedule queries regardless of date params
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'teamSchedule' || query.queryKey[0] === 'mySchedule'
      });
      toast.success('Availability updated');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update availability';
      toast.error(message);
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
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'teamSchedule' || query.queryKey[0] === 'mySchedule'
      });
      toast.success('Availability removed');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to remove availability';
      toast.error(message);
    },
  });
}
