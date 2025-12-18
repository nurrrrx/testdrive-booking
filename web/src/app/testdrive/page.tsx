'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { format, isBefore, startOfDay, isToday } from 'date-fns';
import { ArrowLeft, ArrowRight, Calendar, Check, ChevronLeft, ChevronRight, Clock, MapPin, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { lexusModels, getModelById, formatPrice, LexusModel } from '@/lib/lexus-models';
import { cn } from '@/lib/utils';
import { useShowrooms, useAvailability, useCreateBooking } from '@/hooks/use-bookings';
import type { Showroom, TimeSlot } from '@/types';

function TestDriveContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const modelParam = searchParams.get('model');

  const [step, setStep] = useState(1);
  const [selectedModel, setSelectedModel] = useState<LexusModel | null>(null);
  const [selectedShowroom, setSelectedShowroom] = useState<Showroom | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
  });

  // Fetch showrooms from API
  const { data: showrooms = [], isLoading: showroomsLoading } = useShowrooms({ isActive: true });

  // Fetch availability when showroom and date are selected
  const dateString = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const { data: availability, isLoading: availabilityLoading } = useAvailability(
    selectedShowroom?.id || '',
    dateString
  );

  // Create booking mutation
  const createBooking = useCreateBooking();

  useEffect(() => {
    if (modelParam) {
      const model = getModelById(modelParam);
      if (model) {
        setSelectedModel(model);
        setStep(2);
      }
    }
  }, [modelParam]);

  // Group time slots by period (morning, afternoon, evening)
  const groupedTimeSlots = useMemo(() => {
    if (!availability?.slots) return { morning: [], afternoon: [], evening: [] };

    const morning: TimeSlot[] = [];
    const afternoon: TimeSlot[] = [];
    const evening: TimeSlot[] = [];

    availability.slots.forEach((slot: TimeSlot) => {
      const hour = parseInt(slot.time.split(':')[0], 10);
      if (hour < 12) {
        morning.push(slot);
      } else if (hour < 16) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });

    return { morning, afternoon, evening };
  }, [availability?.slots]);

  const handleModelSelect = (model: LexusModel) => {
    setSelectedModel(model);
    setStep(2);
  };

  const handleShowroomSelect = (showroom: Showroom) => {
    setSelectedShowroom(showroom);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime('');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleNext = () => {
    if (step === 2 && selectedShowroom) {
      setStep(3);
    } else if (step === 3 && selectedDate && selectedTime) {
      setStep(4);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedShowroom || !selectedDate || !selectedModel) return;

    createBooking.mutate(
      {
        showroomId: selectedShowroom.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime: selectedTime,
        notes: formData.notes || undefined,
        source: 'WEB',
        customerInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email,
        },
      },
      {
        onSuccess: (response) => {
          const booking = response.data;
          router.push(`/testdrive/confirmation?ref=${booking.referenceNumber}`);
        },
      }
    );
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const isDateDisabled = (date: Date | null): boolean => {
    if (!date) return true;
    const today = startOfDay(new Date());
    return isBefore(date, today) || date.getDay() === 5; // Disable Fridays and past dates
  };

  const isDateSelected = (date: Date | null): boolean => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-[#f7f7f7] py-4">
        <div className="container mx-auto px-4">
          <nav className="flex items-center text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">Book a Test Drive</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="py-12 bg-[#f7f7f7]">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-light tracking-tight lexus-heading mb-4">
            Book a Test Drive
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Experience the thrill of driving a Lexus. Select your preferred model,
            showroom, and time to schedule your test drive.
          </p>
        </div>
      </section>

      {/* Progress Steps */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4 md:gap-8">
            {[
              { num: 1, label: 'Select Model' },
              { num: 2, label: 'Choose Showroom' },
              { num: 3, label: 'Pick Date & Time' },
              { num: 4, label: 'Your Details' },
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center">
                <div className="flex items-center">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                      step >= s.num
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-gray-200 text-gray-500'
                    )}
                  >
                    {step > s.num ? <Check className="h-4 w-4" /> : s.num}
                  </div>
                  <span className={cn(
                    'hidden md:block ml-2 text-sm',
                    step >= s.num ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {s.label}
                  </span>
                </div>
                {idx < 3 && (
                  <div className={cn(
                    'w-12 md:w-24 h-0.5 mx-2',
                    step > s.num ? 'bg-primary' : 'bg-gray-200'
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 bg-white flex-1">
        <div className="container mx-auto px-4">
          {/* Step 1: Select Model */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-light tracking-tight lexus-heading mb-8 text-center">
                Select Your Model
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {lexusModels.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => handleModelSelect(model)}
                    className={cn(
                      'group text-left bg-white border transition-all hover:border-primary',
                      selectedModel?.id === model.id ? 'border-primary ring-1 ring-primary' : 'border-gray-200'
                    )}
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                      <Image
                        src={model.heroImage}
                        alt={model.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        style={{ objectPosition: model.imagePosition || 'center center' }}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium">{model.name}</h3>
                      <p className="text-sm text-muted-foreground">{model.year}</p>
                      <p className="text-sm mt-2">From {formatPrice(model.startingPrice)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Select Showroom */}
          {step === 2 && selectedModel && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={handleBack}
                  className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Models
                </button>
                <div className="flex items-center gap-4">
                  <Image
                    src={selectedModel.heroImage}
                    alt={selectedModel.name}
                    width={80}
                    height={50}
                    className="object-cover"
                  />
                  <div>
                    <p className="font-medium">{selectedModel.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedModel.year}</p>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-light tracking-tight lexus-heading mb-8 text-center">
                Choose Your Showroom
              </h2>

              <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {showroomsLoading ? (
                  <div className="col-span-2 flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : showrooms.length === 0 ? (
                  <div className="col-span-2 text-center py-8 text-muted-foreground">
                    No showrooms available at this time.
                  </div>
                ) : (
                  showrooms.map((showroom) => (
                    <button
                      key={showroom.id}
                      onClick={() => handleShowroomSelect(showroom)}
                      className={cn(
                        'text-left p-6 border transition-all hover:border-primary',
                        selectedShowroom?.id === showroom.id ? 'border-primary ring-1 ring-primary' : 'border-gray-200'
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">{showroom.name}</h3>
                          <p className="text-sm text-muted-foreground">{showroom.address}</p>
                          <p className="text-sm text-muted-foreground">{showroom.city}</p>
                        </div>
                      </div>
                      {selectedShowroom?.id === showroom.id && (
                        <div className="mt-4 flex items-center text-sm text-primary">
                          <Check className="h-4 w-4 mr-2" />
                          Selected
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleNext}
                  disabled={!selectedShowroom}
                  className={cn(
                    'lexus-btn',
                    selectedShowroom ? 'lexus-btn-primary' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  )}
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Select Date & Time */}
          {step === 3 && selectedModel && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={handleBack}
                  className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Showrooms
                </button>
              </div>

              <h2 className="text-2xl font-light tracking-tight lexus-heading mb-8 text-center">
                Pick Your Date & Time
              </h2>

              <div className="grid lg:grid-cols-2 gap-12 max-w-4xl mx-auto">
                {/* Calendar */}
                <div>
                  <div className="border p-6">
                    <div className="flex items-center justify-between mb-6">
                      <button
                        onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
                        className="p-2 hover:bg-gray-100 transition-colors"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <h3 className="font-medium">
                        {format(currentMonth, 'MMMM yyyy')}
                      </h3>
                      <button
                        onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
                        className="p-2 hover:bg-gray-100 transition-colors"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                        <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {generateCalendarDays().map((date, idx) => (
                        <button
                          key={idx}
                          onClick={() => date && !isDateDisabled(date) && handleDateSelect(date)}
                          disabled={isDateDisabled(date)}
                          className={cn(
                            'lexus-calendar-day',
                            date && isDateSelected(date) && 'selected',
                            date && isDateDisabled(date) && 'disabled',
                            date && isToday(date) && !isDateSelected(date) && 'border border-primary'
                          )}
                        >
                          {date ? format(date, 'd') : ''}
                        </button>
                      ))}
                    </div>

                    <p className="text-xs text-muted-foreground mt-4">
                      * Fridays are not available for test drives
                    </p>
                  </div>
                </div>

                {/* Time Slots */}
                <div>
                  {selectedDate ? (
                    <div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Available times for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                      </p>
                      {availabilityLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : !availability?.slots || availability.slots.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No available time slots for this date.
                        </div>
                      ) : (
                        <>
                          {groupedTimeSlots.morning.length > 0 && (
                            <div className="mb-6">
                              <h4 className="text-sm font-medium mb-3">Morning</h4>
                              <div className="grid grid-cols-3 gap-2">
                                {groupedTimeSlots.morning.map((slot) => (
                                  <button
                                    key={slot.time}
                                    onClick={() => slot.available && handleTimeSelect(slot.time)}
                                    disabled={!slot.available}
                                    className={cn(
                                      'time-slot',
                                      selectedTime === slot.time && 'selected',
                                      !slot.available && 'opacity-50 cursor-not-allowed line-through'
                                    )}
                                  >
                                    {slot.time}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          {groupedTimeSlots.afternoon.length > 0 && (
                            <div className="mb-6">
                              <h4 className="text-sm font-medium mb-3">Afternoon</h4>
                              <div className="grid grid-cols-3 gap-2">
                                {groupedTimeSlots.afternoon.map((slot) => (
                                  <button
                                    key={slot.time}
                                    onClick={() => slot.available && handleTimeSelect(slot.time)}
                                    disabled={!slot.available}
                                    className={cn(
                                      'time-slot',
                                      selectedTime === slot.time && 'selected',
                                      !slot.available && 'opacity-50 cursor-not-allowed line-through'
                                    )}
                                  >
                                    {slot.time}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          {groupedTimeSlots.evening.length > 0 && (
                            <div className="mb-6">
                              <h4 className="text-sm font-medium mb-3">Evening</h4>
                              <div className="grid grid-cols-3 gap-2">
                                {groupedTimeSlots.evening.map((slot) => (
                                  <button
                                    key={slot.time}
                                    onClick={() => slot.available && handleTimeSelect(slot.time)}
                                    disabled={!slot.available}
                                    className={cn(
                                      'time-slot',
                                      selectedTime === slot.time && 'selected',
                                      !slot.available && 'opacity-50 cursor-not-allowed line-through'
                                    )}
                                  >
                                    {slot.time}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Select a date to see available times</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleNext}
                  disabled={!selectedDate || !selectedTime}
                  className={cn(
                    'lexus-btn',
                    selectedDate && selectedTime ? 'lexus-btn-primary' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  )}
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Customer Details */}
          {step === 4 && selectedModel && selectedDate && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={handleBack}
                  className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Date & Time
                </button>
              </div>

              <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
                {/* Form */}
                <div>
                  <h2 className="text-2xl font-light tracking-tight lexus-heading mb-8">
                    Your Details
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">First Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="lexus-input"
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Last Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="lexus-input"
                          placeholder="Smith"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="lexus-input"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="lexus-input"
                        placeholder="+971 50 123 4567"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Additional Notes (Optional)</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="lexus-input h-24 resize-none"
                        placeholder="Any special requests or questions..."
                      />
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={createBooking.isPending}
                        className={cn(
                          'w-full lexus-btn',
                          createBooking.isPending ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'lexus-btn-primary'
                        )}
                      >
                        {createBooking.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          'Confirm Booking'
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                      By submitting, you agree to our{' '}
                      <Link href="/privacy" className="underline">Privacy Policy</Link>
                      {' '}and{' '}
                      <Link href="/terms" className="underline">Terms of Service</Link>.
                    </p>
                  </form>
                </div>

                {/* Summary */}
                <div>
                  <h2 className="text-2xl font-light tracking-tight lexus-heading mb-8">
                    Booking Summary
                  </h2>

                  <div className="bg-[#f7f7f7] p-6">
                    <div className="flex gap-4 mb-6 pb-6 border-b">
                      <Image
                        src={selectedModel.heroImage}
                        alt={selectedModel.name}
                        width={120}
                        height={75}
                        className="object-cover"
                      />
                      <div>
                        <h3 className="font-medium">{selectedModel.name}</h3>
                        <p className="text-sm text-muted-foreground">{selectedModel.year}</p>
                        <p className="text-sm text-muted-foreground">{selectedModel.tagline}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Showroom</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedShowroom?.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {selectedShowroom?.address}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Date</p>
                          <p className="text-sm text-muted-foreground">
                            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Time</p>
                          <p className="text-sm text-muted-foreground">{selectedTime}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t">
                      <p className="text-xs text-muted-foreground">
                        A confirmation email will be sent after booking. Please bring a valid
                        driver's license to your appointment.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function TestDrivePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <TestDriveContent />
    </Suspense>
  );
}
