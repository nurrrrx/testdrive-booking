'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ArrowLeft, Loader2, MapPin, Car, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useBookingStore } from '@/stores/booking';
import { useAuthStore } from '@/stores/auth';
import { useCreateBooking } from '@/hooks/use-bookings';
import { useRouter } from 'next/navigation';

const customerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  notes: z.string().optional(),
});

export function CustomerDetails() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const {
    selectedShowroom,
    selectedCarModel,
    selectedDate,
    selectedTime,
    slotHold,
    prevStep,
    reset,
  } = useBookingStore();

  const createBooking = useCreateBooking();

  const form = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      email: user?.email || '',
      notes: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof customerSchema>) => {
    if (!selectedShowroom || !selectedDate || !selectedTime) return;

    try {
      const response = await createBooking.mutateAsync({
        showroomId: selectedShowroom.id,
        carModelId: selectedCarModel?.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime: selectedTime,
        notes: values.notes,
        source: 'WEB',
        holdId: slotHold?.holdId,
        customerInfo: isAuthenticated ? undefined : {
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone,
          email: values.email || undefined,
        },
      });

      // Navigate to confirmation page
      const booking = response.data as { referenceNumber: string };
      reset();
      router.push(`/booking/confirmation?ref=${booking.referenceNumber}`);
    } catch {
      // Error handled in hook
    }
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
        <h2 className="text-2xl font-bold">Complete Your Booking</h2>
        <p className="text-muted-foreground mt-2">
          Review your details and confirm your test drive
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Booking Summary */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{selectedShowroom?.name}</p>
                <p className="text-sm text-muted-foreground">{selectedShowroom?.address}</p>
              </div>
            </div>

            <Separator />

            {selectedCarModel && (
              <>
                <div className="flex items-start gap-3">
                  <Car className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">
                      {selectedCarModel.brand} {selectedCarModel.model}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedCarModel.variant} - {selectedCarModel.year}
                    </p>
                  </div>
                </div>
                <Separator />
              </>
            )}

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">
                  {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{selectedTime}</p>
                <p className="text-sm text-muted-foreground">30 minute test drive</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Details Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Your Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+971 50 123 4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any specific requests or questions?"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={createBooking.isPending}
                >
                  {createBooking.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Confirm Booking
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
