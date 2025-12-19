export type CheckInType = 'RECEIVED' | 'SENT_OUT' | 'RETURNED' | 'OUT_FOR_DRIVE';

export type CarUnitStatus =
  | 'AVAILABLE'
  | 'OUT_FOR_TEST_DRIVE'
  | 'MAINTENANCE'
  | 'SOLD'
  | 'IN_TRANSIT'
  | 'RESERVED';

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'CANCELLED';

export type UserRole =
  | 'CUSTOMER'
  | 'CALL_CENTER_AGENT'
  | 'SALES_EXECUTIVE'
  | 'SHOWROOM_MANAGER'
  | 'ADMIN';

export const STATUS_COLORS: Record<CarUnitStatus, string> = {
  AVAILABLE: '#22c55e',
  OUT_FOR_TEST_DRIVE: '#3b82f6',
  MAINTENANCE: '#f97316',
  SOLD: '#6b7280',
  IN_TRANSIT: '#a855f7',
  RESERVED: '#eab308',
};

export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  PENDING: '#eab308',
  CONFIRMED: '#3b82f6',
  COMPLETED: '#22c55e',
  NO_SHOW: '#ef4444',
  CANCELLED: '#6b7280',
};

export const CHECK_IN_TYPE_LABELS: Record<CheckInType, string> = {
  RECEIVED: 'Received',
  SENT_OUT: 'Sent Out',
  RETURNED: 'Returned',
  OUT_FOR_DRIVE: 'Out for Drive',
};
