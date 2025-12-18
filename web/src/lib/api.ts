import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        // Redirect to login if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  sendOtp: (phone: string) => api.post('/auth/otp/send', { phone }),
  verifyOtp: (phone: string, otp: string) => api.post<{ accessToken: string; user: unknown }>('/auth/otp/verify', { phone, otp }),
  staffLogin: (email: string, password: string) => api.post<{ accessToken: string; user: unknown }>('/auth/staff/login', { email, password }),
};

// Showrooms API
export const showroomsApi = {
  getAll: (params?: { city?: string; isActive?: boolean }) => api.get('/showrooms', { params }),
  getById: (id: string) => api.get(`/showrooms/${id}`),
  create: (data: unknown) => api.post('/showrooms', data),
  update: (id: string, data: unknown) => api.patch(`/showrooms/${id}`, data),
  deactivate: (id: string) => api.patch(`/showrooms/${id}/deactivate`),
};

// Cars API
export const carsApi = {
  getModels: (params?: { brand?: string; fuelType?: string; isAvailableForTestDrive?: boolean }) =>
    api.get('/cars/models', { params }),
  getModelById: (id: string) => api.get(`/cars/models/${id}`),
  createModel: (data: unknown) => api.post('/cars/models', data),
  updateModel: (id: string, data: unknown) => api.patch(`/cars/models/${id}`, data),
  getUnits: (params?: { showroomId?: string; carModelId?: string; status?: string }) =>
    api.get('/cars/units', { params }),
  getUnitById: (id: string) => api.get(`/cars/units/${id}`),
  createUnit: (data: unknown) => api.post('/cars/units', data),
  updateUnit: (id: string, data: unknown) => api.patch(`/cars/units/${id}`, data),
  updateUnitStatus: (id: string, status: string) => api.patch(`/cars/units/${id}/status`, { status }),
};

// Availability API
export const availabilityApi = {
  getSlots: (showroomId: string, params: { date: string; carModelId?: string }) =>
    api.get(`/availability/showrooms/${showroomId}/slots`, { params }),
  holdSlot: (data: { showroomId: string; date: string; time: string; carModelId?: string; sessionId: string }) =>
    api.post('/availability/slots/hold', data),
  releaseHold: (holdId: string) => api.delete(`/availability/slots/hold/${holdId}`),
};

// Bookings API
export const bookingsApi = {
  create: (data: {
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
  }) => api.post('/bookings', data),
  getAll: (params?: { showroomId?: string; status?: string; from?: string; to?: string }) =>
    api.get('/bookings', { params }),
  getMy: () => api.get('/bookings/my'),
  getById: (id: string) => api.get(`/bookings/${id}`),
  getByReference: (referenceNumber: string) => api.get(`/bookings/reference/${referenceNumber}`),
  cancel: (id: string, reason?: string) => api.patch(`/bookings/${id}/cancel`, { reason }),
  reschedule: (id: string, data: { holdId: string; date: string; startTime: string; endTime: string }) =>
    api.patch(`/bookings/${id}/reschedule`, data),
  complete: (id: string, notes?: string) => api.patch(`/bookings/${id}/complete`, { notes }),
  markNoShow: (id: string) => api.patch(`/bookings/${id}/no-show`),
};

// Scheduling API
export const schedulingApi = {
  getMySchedule: (params: { startDate: string; endDate: string }) =>
    api.get('/scheduling/my', { params }),
  getTeamSchedule: (params: { startDate: string; endDate: string }) =>
    api.get('/scheduling/team', { params }),
  setAvailability: (data: { userId?: string; date: string; availableFrom: string; availableTo: string }) =>
    api.post('/scheduling/availability', data),
  removeAvailability: (data: { userId?: string; date: string }) =>
    api.delete('/scheduling/availability', { data }),
};

// Leads API
export const leadsApi = {
  create: (data: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    source: string;
    interestedCarModelId?: string;
    preferredShowroomId?: string;
    notes?: string;
  }) => api.post('/leads', data),
  getAll: (params?: { status?: string; source?: string; assignedToId?: string }) =>
    api.get('/leads', { params }),
  getById: (id: string) => api.get(`/leads/${id}`),
  assign: (id: string, assignedToId: string) => api.patch(`/leads/${id}/assign`, { assignedToId }),
  updateStatus: (id: string, status: string, notes?: string) =>
    api.patch(`/leads/${id}/status`, { status, notes }),
  convert: (id: string, bookingData: unknown) => api.patch(`/leads/${id}/convert`, bookingData),
};

// Users API
export const usersApi = {
  getAll: (params?: { role?: string; showroomId?: string; isActive?: boolean }) =>
    api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: unknown) => api.post('/users', data),
  update: (id: string, data: unknown) => api.patch(`/users/${id}`, data),
  deactivate: (id: string) => api.patch(`/users/${id}/deactivate`),
  activate: (id: string) => api.patch(`/users/${id}/activate`),
};

// Analytics API
export const analyticsApi = {
  getOverview: (params?: { showroomId?: string; from?: string; to?: string }) =>
    api.get('/analytics/overview', { params }),
  getBookingsBySource: (params?: { showroomId?: string; from?: string; to?: string }) =>
    api.get('/analytics/bookings-by-source', { params }),
  getPopularCars: (params?: { showroomId?: string; from?: string; to?: string; limit?: number }) =>
    api.get('/analytics/popular-cars', { params }),
  getBookingsByDay: (params?: { showroomId?: string; from?: string; to?: string }) =>
    api.get('/analytics/bookings-by-day', { params }),
  getLeadConversion: (params?: { from?: string; to?: string }) =>
    api.get('/analytics/lead-conversion', { params }),
};

// Transfers API
export const transfersApi = {
  getAll: (params?: { status?: string; fromShowroomId?: string; toShowroomId?: string }) =>
    api.get('/transfers', { params }),
  create: (data: { carUnitId: string; toShowroomId: string; reason?: string; neededByDate?: string }) =>
    api.post('/transfers', data),
  approve: (id: string) => api.patch(`/transfers/${id}/approve`),
  reject: (id: string, reason: string) => api.patch(`/transfers/${id}/reject`, { reason }),
  markInTransit: (id: string) => api.patch(`/transfers/${id}/in-transit`),
  complete: (id: string) => api.patch(`/transfers/${id}/complete`),
};