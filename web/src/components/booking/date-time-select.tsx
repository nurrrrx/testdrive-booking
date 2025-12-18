'use client';

import { useState, useEffect } from 'react';
import { format, addDays, startOfDay, isBefore, isToday } from 'date-fns';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAvailability, useHoldSlot, useReleaseHold } from '@/hooks/use-bookings';
import { useBookingStore } from '@/stores/booking';
import { cn } from '@/lib/utils';

export function DateTimeSelect() {
  const {
    selectedShowroom,
    selectedCarModel,
    selectedDate,
    selectedTime,
    slotHold,
    sessionId,
    setDate,
    setTime,
    setSlotHold,
    nextStep,
    prevStep,
  } = useBookingStore();

  const [holdCountdown, setHoldCountdown] = useState<number | null>(null);

  const dateString = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const { data: availability, isLoading } = useAvailability(
    selectedShowroom?.id || '',
    dateString,
    selectedCarModel?.id
  );

  const holdSlot = useHoldSlot();
  const releaseHold = useReleaseHold();

  // Handle countdown for held slot
  useEffect(() => {
    if (!slotHold) {
      setHoldCountdown(null);
      return;
    }

    const updateCountdown = () => {
      const expiresAt = new Date(slotHold.expiresAt).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setHoldCountdown(remaining);

      if (remaining === 0) {
        setSlotHold(null);
        setTime(null);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [slotHold, setSlotHold, setTime]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Release existing hold if any
      if (slotHold) {
        releaseHold.mutate(slotHold.holdId);
        setSlotHold(null);
      }
      setDate(date);
    }
  };

  const handleTimeSelect = async (time: string) => {
    if (!selectedShowroom || !selectedDate) return;

    // Release existing hold if any
    if (slotHold) {
      await releaseHold.mutateAsync(slotHold.holdId);
    }

    // Hold the new slot
    try {
      const response = await holdSlot.mutateAsync({
        showroomId: selectedShowroom.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time,
        carModelId: selectedCarModel?.id,
        sessionId,
      });
      setSlotHold(response.data);
      setTime(time);
    } catch {
      // Error handled in hook
    }
  };

  const handleContinue = () => {
    if (selectedTime && slotHold) {
      nextStep();
    }
  };

  // Disable dates in the past and more than 14 days in the future
  const disabledDays = (date: Date) => {
    const today = startOfDay(new Date());
    const maxDate = addDays(today, 14);
    return isBefore(date, today) || date > maxDate;
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={prevStep}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold">Select Date & Time</h2>
        <p className="text-muted-foreground mt-2">
          Choose your preferred date and time for the test drive
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Date</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate || undefined}
              onSelect={handleDateSelect}
              disabled={disabledDays}
              initialFocus
            />
          </CardContent>
        </Card>

        {/* Time Slots */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDate
                ? `Available Times - ${format(selectedDate, 'EEEE, MMM d')}`
                : 'Select a date first'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <p className="text-muted-foreground text-center py-8">
                Please select a date to see available time slots
              </p>
            ) : isLoading ? (
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : availability?.slots && availability.slots.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {availability.slots.map((slot) => (
                  <Button
                    key={slot.time}
                    variant={selectedTime === slot.time ? 'default' : 'outline'}
                    className={cn(
                      'text-sm',
                      !slot.available && 'opacity-50 cursor-not-allowed'
                    )}
                    disabled={!slot.available || holdSlot.isPending}
                    onClick={() => handleTimeSelect(slot.time)}
                  >
                    {slot.time}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No available slots for this date
              </p>
            )}

            {/* Hold status */}
            {slotHold && holdCountdown !== null && (
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-amber-800">
                    Slot held: {slotHold.time}
                  </span>
                  <Badge variant="outline" className="text-amber-800 border-amber-300">
                    Expires in {formatCountdown(holdCountdown)}
                  </Badge>
                </div>
                <p className="text-xs text-amber-600 mt-1">
                  Complete your booking before the hold expires
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Continue Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleContinue}
          disabled={!selectedTime || !slotHold}
        >
          Continue to Details
        </Button>
      </div>
    </div>
  );
}
