// User types
export type UserRole = 'CUSTOMER' | 'CALL_CENTER_AGENT' | 'SALES_EXECUTIVE' | 'SHOWROOM_MANAGER' | 'ADMIN';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  showroomId?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: Pick<User, 'id' | 'email' | 'phone' | 'firstName' | 'lastName' | 'role' | 'showroomId'>;
}

// Showroom types
export interface OperatingHours {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface Showroom {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  operatingHours: OperatingHours[];
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    carUnits: number;
    users: number;
    bookings: number;
  };
}

// Car types
export type FuelType = 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'PLUGIN_HYBRID';
export type Transmission = 'MANUAL' | 'AUTOMATIC';
export type CarUnitStatus = 'AVAILABLE' | 'OUT_FOR_TEST_DRIVE' | 'RESERVED' | 'MAINTENANCE' | 'IN_TRANSIT' | 'SOLD';

export interface CarSpecs {
  engineCapacity?: string;
  power?: string;
  torque?: string;
  acceleration?: string;
  topSpeed?: string;
  fuelEfficiency?: string;
  range?: string;
}

export interface CarModel {
  id: string;
  brand: string;
  model: string;
  year: number;
  variant?: string;
  fuelType: FuelType;
  transmission: Transmission;
  imageUrl?: string;
  thumbnailUrl?: string;
  specs?: CarSpecs;
  isAvailableForTestDrive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CarUnit {
  id: string;
  carModelId: string;
  showroomId: string;
  vin?: string;
  color: string;
  status: CarUnitStatus;
  isDemoOnly: boolean;
  createdAt: string;
  updatedAt: string;
  carModel?: CarModel;
  showroom?: Showroom;
}

// Availability types
export interface TimeSlot {
  time: string;
  available: boolean;
  salesExecId?: string;
  salesExecName?: string;
}

export interface AvailableSlot {
  showroomId: string;
  date: string;
  slots: TimeSlot[];
}

export interface SlotHold {
  holdId: string;
  showroomId: string;
  date: string;
  time: string;
  carModelId?: string;
  expiresAt: string;
}

// Booking types
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type BookingSource = 'WEBSITE' | 'MOBILE_APP' | 'CALL_CENTER' | 'WALK_IN' | 'LEAD_CONVERSION';

export interface Booking {
  id: string;
  referenceNumber: string;
  customerId: string;
  showroomId: string;
  carUnitId?: string;
  salesExecId?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  source: BookingSource;
  notes?: string;
  cancellationReason?: string;
  confirmedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  customer?: User;
  showroom?: Showroom;
  carUnit?: CarUnit;
  salesExec?: User;
}

// Lead types
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';
export type LeadSource = 'WEBSITE' | 'SOCIAL_MEDIA' | 'REFERRAL' | 'WALK_IN' | 'PHONE' | 'EMAIL' | 'EVENT';

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  source: LeadSource;
  status: LeadStatus;
  interestedCarModelId?: string;
  preferredShowroomId?: string;
  notes?: string;
  assignedToId?: string;
  convertedBookingId?: string;
  createdAt: string;
  updatedAt: string;
  interestedCarModel?: CarModel;
  preferredShowroom?: Showroom;
  assignedTo?: User;
}

// Analytics types
export interface AnalyticsOverview {
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  conversionRate: number;
  averageBookingsPerDay: number;
}

export interface BookingsBySource {
  source: BookingSource;
  count: number;
}

export interface PopularCar {
  carModelId: string;
  brand: string;
  model: string;
  bookingCount: number;
}