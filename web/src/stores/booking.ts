import { create } from 'zustand';
import type { Showroom, CarModel, SlotHold } from '@/types';

interface BookingState {
  // Step tracking
  currentStep: number;

  // Selection state
  selectedShowroom: Showroom | null;
  selectedCarModel: CarModel | null;
  selectedDate: Date | null;
  selectedTime: string | null;

  // Hold state
  slotHold: SlotHold | null;

  // Customer info (for guest booking)
  customerInfo: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    notes?: string;
  } | null;

  // Session ID for slot holding
  sessionId: string;

  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  setShowroom: (showroom: Showroom | null) => void;
  setCarModel: (carModel: CarModel | null) => void;
  setDate: (date: Date | null) => void;
  setTime: (time: string | null) => void;
  setSlotHold: (hold: SlotHold | null) => void;
  setCustomerInfo: (info: BookingState['customerInfo']) => void;

  reset: () => void;
}

const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

const initialState = {
  currentStep: 1,
  selectedShowroom: null,
  selectedCarModel: null,
  selectedDate: null,
  selectedTime: null,
  slotHold: null,
  customerInfo: null,
  sessionId: generateSessionId(),
};

export const useBookingStore = create<BookingState>((set) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
  prevStep: () => set((state) => ({ currentStep: Math.max(1, state.currentStep - 1) })),

  setShowroom: (showroom) => set({ selectedShowroom: showroom }),
  setCarModel: (carModel) => set({ selectedCarModel: carModel }),
  setDate: (date) => set({ selectedDate: date, selectedTime: null }),
  setTime: (time) => set({ selectedTime: time }),
  setSlotHold: (hold) => set({ slotHold: hold }),
  setCustomerInfo: (info) => set({ customerInfo: info }),

  reset: () => set({ ...initialState, sessionId: generateSessionId() }),
}));