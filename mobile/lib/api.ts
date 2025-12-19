import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://testdrive-booking-production.up.railway.app/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('user');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  staffLogin: (email: string, password: string) =>
    api.post<{ accessToken: string; user: User }>('/auth/staff/login', { email, password }),
};

// Cars API
export const carsApi = {
  getModels: (params?: { brand?: string; fuelType?: string }) =>
    api.get('/cars/models', { params }),
  getUnits: (params?: { showroomId?: string; carModelId?: string; status?: string }) =>
    api.get('/cars/units', { params }),
  getUnitByVin: (vin: string) => api.get(`/cars/units/vin/${vin}`),
  updateUnitStatus: (id: string, status: string) => api.patch(`/cars/units/${id}/status`, { status }),
  checkIn: (data: {
    carUnitId: string;
    type: 'RECEIVED' | 'SENT_OUT' | 'RETURNED' | 'OUT_FOR_DRIVE';
    notes?: string;
    fromShowroomId?: string;
    toShowroomId?: string;
  }) => api.post('/cars/check-in', data),
  getCheckInHistory: (params?: {
    carUnitId?: string;
    showroomId?: string;
    type?: string;
    limit?: number;
  }) => api.get('/cars/check-in/history', { params }),
};

// Bookings API
export const bookingsApi = {
  getAll: (params?: { showroomId?: string; status?: string; date?: string }) =>
    api.get('/bookings', { params }),
  getById: (id: string) => api.get(`/bookings/${id}`),
  complete: (id: string, notes?: string) => api.patch(`/bookings/${id}/complete`, { notes }),
  markNoShow: (id: string) => api.patch(`/bookings/${id}/no-show`),
  cancel: (id: string, reason?: string) => api.patch(`/bookings/${id}/cancel`, { reason }),
  create: (data: {
    showroomId: string;
    carModelId?: string;
    date: string;
    startTime: string;
    endTime?: string;
    customerInfo: {
      firstName: string;
      lastName: string;
      phone: string;
      email?: string;
    };
    source?: 'WEB' | 'MOBILE_APP' | 'WALK_IN' | 'PHONE';
    notes?: string;
  }) => api.post('/bookings', data),
};

// Showrooms API
export const showroomsApi = {
  getAll: () => api.get('/showrooms'),
  getById: (id: string) => api.get(`/showrooms/${id}`),
};

// Availability API
export const availabilityApi = {
  getSlots: (showroomId: string, date: string, carModelId?: string) =>
    api.get(`/availability/showrooms/${showroomId}/slots`, { params: { date, carModelId } }),
};

// Scheduling API
export const schedulingApi = {
  getMySchedule: (startDate: string, endDate: string) =>
    api.get('/scheduling/my', { params: { startDate, endDate } }),
  getTeamSchedule: (startDate: string, endDate: string) =>
    api.get('/scheduling/team', { params: { startDate, endDate } }),
  setAvailability: (data: {
    userId?: string;
    date: string;
    availableFrom: string;
    availableTo: string;
  }) => api.post('/scheduling/availability', data),
  removeAvailability: (data: { userId?: string; date: string }) =>
    api.delete('/scheduling/availability', { data }),
};

// Types
export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  role: 'CUSTOMER' | 'CALL_CENTER_AGENT' | 'SALES_EXECUTIVE' | 'SHOWROOM_MANAGER' | 'ADMIN';
  showroomId: string | null;
  isActive: boolean;
}

export interface CarModel {
  id: string;
  brand: string;
  model: string;
  year: number;
  variant: string | null;
  fuelType: string;
  transmission: string;
  imageUrl: string | null;
}

export interface CarUnit {
  id: string;
  vin: string | null;
  color: string | null;
  status: 'AVAILABLE' | 'OUT_FOR_TEST_DRIVE' | 'MAINTENANCE' | 'SOLD' | 'IN_TRANSIT' | 'RESERVED';
  carModel: CarModel;
  showroom: Showroom;
}

export interface Showroom {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
}

export interface Booking {
  id: string;
  referenceNumber: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';
  customer: User;
  carUnit: CarUnit;
  showroom: Showroom;
  salesExec: User | null;
  notes: string | null;
}

export interface CheckInRecord {
  id: string;
  type: 'RECEIVED' | 'SENT_OUT' | 'RETURNED' | 'OUT_FOR_DRIVE';
  notes: string | null;
  createdAt: string;
  carUnit: { carModel: CarModel };
  showroom: Showroom;
  performedBy: User;
  fromShowroom: Showroom | null;
  toShowroom: Showroom | null;
}

export interface SalesExecSchedule {
  id: string;
  userId: string;
  date: string;
  availableFrom: string;
  availableTo: string;
  user?: User;
}
