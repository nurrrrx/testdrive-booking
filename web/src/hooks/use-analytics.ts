'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import type { AnalyticsOverview, BookingsBySource, PopularCar } from '@/types';

export function useAnalyticsOverview(params?: { showroomId?: string; from?: string; to?: string }) {
  return useQuery({
    queryKey: ['analytics', 'overview', params],
    queryFn: async () => {
      const response = await analyticsApi.getOverview(params);
      return response.data as AnalyticsOverview;
    },
  });
}

export function useBookingsBySource(params?: { showroomId?: string; from?: string; to?: string }) {
  return useQuery({
    queryKey: ['analytics', 'bookings-by-source', params],
    queryFn: async () => {
      const response = await analyticsApi.getBookingsBySource(params);
      return response.data as BookingsBySource[];
    },
  });
}

export function usePopularCars(params?: { showroomId?: string; from?: string; to?: string; limit?: number }) {
  return useQuery({
    queryKey: ['analytics', 'popular-cars', params],
    queryFn: async () => {
      const response = await analyticsApi.getPopularCars(params);
      return response.data as PopularCar[];
    },
  });
}

export function useBookingsByDay(params?: { showroomId?: string; from?: string; to?: string }) {
  return useQuery({
    queryKey: ['analytics', 'bookings-by-day', params],
    queryFn: async () => {
      const response = await analyticsApi.getBookingsByDay(params);
      return response.data as { date: string; count: number }[];
    },
  });
}
