'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { showroomsApi, carsApi, availabilityApi, bookingsApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Showroom, CarModel, AvailableSlot, Booking } from '@/types';

// Showrooms
export function useShowrooms(params?: { city?: string; isActive?: boolean }) {
  return useQuery({
    queryKey: ['showrooms', params],
    queryFn: async () => {
      const response = await showroomsApi.getAll(params);
      return response.data as Showroom[];
    },
  });
}

export function useShowroom(id: string) {
  return useQuery({
    queryKey: ['showroom', id],
    queryFn: async () => {
      const response = await showroomsApi.getById(id);
      return response.data as Showroom;
    },
    enabled: !!id,
  });
}

// Car Models
export function useCarModels(params?: { brand?: string; fuelType?: string; isAvailableForTestDrive?: boolean }) {
  return useQuery({
    queryKey: ['carModels', params],
    queryFn: async () => {
      const response = await carsApi.getModels(params);
      return response.data as CarModel[];
    },
  });
}

export function useCarModel(id: string) {
  return useQuery({
    queryKey: ['carModel', id],
    queryFn: async () => {
      const response = await carsApi.getModelById(id);
      return response.data as CarModel;
    },
    enabled: !!id,
  });
}

// Availability
export function useAvailability(showroomId: string, date: string, carModelId?: string) {
  return useQuery({
    queryKey: ['availability', showroomId, date, carModelId],
    queryFn: async () => {
      const response = await availabilityApi.getSlots(showroomId, { date, carModelId });
      return response.data as AvailableSlot;
    },
    enabled: !!showroomId && !!date,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useHoldSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { showroomId: string; date: string; time: string; carModelId?: string; sessionId: string }) =>
      availabilityApi.holdSlot(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
    onError: () => {
      toast.error('Failed to hold slot. It may have been taken.');
    },
  });
}

export function useReleaseHold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (holdId: string) => availabilityApi.releaseHold(holdId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}

// Bookings
export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      showroomId: string;
      carModelId?: string;
      date: string;
      startTime: string;
      endTime?: string;
      notes?: string;
      source?: 'WEB' | 'MOBILE_APP' | 'CALL_CENTER' | 'WALK_IN';
      holdId?: string;
      customerInfo?: {
        firstName: string;
        lastName: string;
        phone: string;
        email?: string;
      };
    }) => bookingsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      toast.success('Booking confirmed!');
    },
    onError: () => {
      toast.error('Failed to create booking. Please try again.');
    },
  });
}

export function useMyBookings() {
  return useQuery({
    queryKey: ['bookings', 'my'],
    queryFn: async () => {
      const response = await bookingsApi.getMy();
      return response.data as Booking[];
    },
  });
}

export function useBookings(params?: { showroomId?: string; status?: string; from?: string; to?: string }) {
  return useQuery({
    queryKey: ['bookings', params],
    queryFn: async () => {
      const response = await bookingsApi.getAll(params);
      return response.data as Booking[];
    },
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const response = await bookingsApi.getById(id);
      return response.data as Booking;
    },
    enabled: !!id,
  });
}

export function useBookingByReference(referenceNumber: string) {
  return useQuery({
    queryKey: ['booking', 'reference', referenceNumber],
    queryFn: async () => {
      const response = await bookingsApi.getByReference(referenceNumber);
      return response.data as Booking;
    },
    enabled: !!referenceNumber,
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      bookingsApi.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking cancelled');
    },
    onError: () => {
      toast.error('Failed to cancel booking');
    },
  });
}

export function useRescheduleBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, holdId, date, startTime, endTime }: { id: string; holdId: string; date: string; startTime: string; endTime: string }) =>
      bookingsApi.reschedule(id, { holdId, date, startTime, endTime }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking rescheduled');
    },
    onError: () => {
      toast.error('Failed to reschedule booking');
    },
  });
}

export function useCompleteBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      bookingsApi.complete(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking marked as completed');
    },
    onError: () => {
      toast.error('Failed to complete booking');
    },
  });
}

export function useMarkNoShow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => bookingsApi.markNoShow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking marked as no-show');
    },
    onError: () => {
      toast.error('Failed to mark as no-show');
    },
  });
}