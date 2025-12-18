'use client';

import { useBookingStore } from '@/stores/booking';
import { StepIndicator } from '@/components/booking/step-indicator';
import { ShowroomSelect } from '@/components/booking/showroom-select';
import { CarSelect } from '@/components/booking/car-select';
import { DateTimeSelect } from '@/components/booking/date-time-select';
import { CustomerDetails } from '@/components/booking/customer-details';

const steps = [
  { number: 1, title: 'Showroom' },
  { number: 2, title: 'Car' },
  { number: 3, title: 'Date & Time' },
  { number: 4, title: 'Details' },
];

export default function BookPage() {
  const currentStep = useBookingStore((state) => state.currentStep);

  return (
    <div className="container py-8 md:py-12">
      <StepIndicator steps={steps} currentStep={currentStep} />

      {currentStep === 1 && <ShowroomSelect />}
      {currentStep === 2 && <CarSelect />}
      {currentStep === 3 && <DateTimeSelect />}
      {currentStep === 4 && <CustomerDetails />}
    </div>
  );
}
