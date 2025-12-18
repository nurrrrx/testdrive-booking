'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { carsApi } from '@/lib/api';
import { toast } from 'sonner';
import type { CarModel, CarUnit, CarUnitStatus } from '@/types';

// Get car models
export function useCarModels(params?: { brand?: string; fuelType?: string; isAvailableForTestDrive?: boolean }) {
  return useQuery({
    queryKey: ['carModels', params],
    queryFn: async () => {
      const response = await carsApi.getModels(params);
      return response.data as CarModel[];
    },
  });
}

// Get car units
export function useCarUnits(params?: { showroomId?: string; carModelId?: string; status?: string }) {
  return useQuery({
    queryKey: ['carUnits', params],
    queryFn: async () => {
      const response = await carsApi.getUnits(params);
      return response.data as CarUnit[];
    },
  });
}

// Get single car unit
export function useCarUnit(id: string) {
  return useQuery({
    queryKey: ['carUnit', id],
    queryFn: async () => {
      const response = await carsApi.getUnitById(id);
      return response.data as CarUnit;
    },
    enabled: !!id,
  });
}

// Update car unit status
export function useUpdateCarUnitStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CarUnitStatus }) =>
      carsApi.updateUnitStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carUnits'] });
      toast.success('Car status updated');
    },
    onError: () => {
      toast.error('Failed to update car status');
    },
  });
}

// Create car unit
export function useCreateCarUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      carModelId: string;
      showroomId: string;
      vin?: string;
      color: string;
      isDemoOnly?: boolean;
    }) => carsApi.createUnit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carUnits'] });
      toast.success('Car unit added');
    },
    onError: () => {
      toast.error('Failed to add car unit');
    },
  });
}

// Update car unit
export function useUpdateCarUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { vin?: string; color?: string; isDemoOnly?: boolean } }) =>
      carsApi.updateUnit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carUnits'] });
      toast.success('Car unit updated');
    },
    onError: () => {
      toast.error('Failed to update car unit');
    },
  });
}
