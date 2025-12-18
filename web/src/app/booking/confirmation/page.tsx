'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { CheckCircle2, MapPin, Car, Calendar, Clock, Copy, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useBookingByReference } from '@/hooks/use-bookings';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const referenceNumber = searchParams.get('ref') || '';
  const [copied, setCopied] = useState(false);

  const { data: booking, isLoading } = useBookingByReference(referenceNumber);

  const copyReference = () => {
    navigator.clipboard.writeText(referenceNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Skeleton className="h-12 w-12 rounded-full mx-auto" />
        <Skeleton className="h-8 w-64 mx-auto mt-4" />
        <Skeleton className="h-64 w-full mt-8" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-2xl font-bold">Booking Not Found</h1>
        <p className="text-muted-foreground mt-2">
          We couldn&apos;t find a booking with that reference number.
        </p>
        <Button asChild className="mt-6">
          <Link href="/book">Book a New Test Drive</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Success Icon */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold">Booking Confirmed!</h1>
        <p className="text-muted-foreground mt-2">
          Your test drive has been successfully booked.
        </p>
      </div>

      {/* Reference Number */}
      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Reference Number</p>
              <p className="text-2xl font-mono font-bold">{booking.referenceNumber}</p>
            </div>
            <Button variant="outline" size="icon" onClick={copyReference}>
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Booking Details */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">{booking.showroom?.name}</p>
              <p className="text-sm text-muted-foreground">{booking.showroom?.address}</p>
            </div>
          </div>

          <Separator />

          {booking.carUnit && (
            <>
              <div className="flex items-start gap-3">
                <Car className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">
                    {booking.carUnit.carModel?.brand} {booking.carUnit.carModel?.model}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {booking.carUnit.color} - {booking.carUnit.carModel?.year}
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
                {format(new Date(booking.date), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">{booking.startTime} - {booking.endTime}</p>
            </div>
          </div>

          {booking.salesExec && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Your Sales Executive</p>
                <p className="font-medium">
                  {booking.salesExec.firstName} {booking.salesExec.lastName}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* What's Next */}
      <Card className="mt-6 bg-slate-50">
        <CardHeader>
          <CardTitle className="text-lg">What&apos;s Next?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
              1
            </div>
            <div>
              <p className="font-medium">Confirmation SMS</p>
              <p className="text-muted-foreground">
                You&apos;ll receive a confirmation message with your booking details.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
              2
            </div>
            <div>
              <p className="font-medium">Reminder</p>
              <p className="text-muted-foreground">
                We&apos;ll send you a reminder 24 hours before your appointment.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
              3
            </div>
            <div>
              <p className="font-medium">Bring Your License</p>
              <p className="text-muted-foreground">
                Please bring a valid driving license to the showroom.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <Button variant="outline" asChild className="flex-1">
          <Link href="/">Back to Home</Link>
        </Button>
        <Button asChild className="flex-1">
          <Link href="/my-bookings">
            View My Bookings
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="max-w-2xl mx-auto">
      <Skeleton className="h-12 w-12 rounded-full mx-auto" />
      <Skeleton className="h-8 w-64 mx-auto mt-4" />
      <Skeleton className="h-64 w-full mt-8" />
    </div>
  );
}

export default function BookingConfirmationPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-12">
        <Suspense fallback={<LoadingFallback />}>
          <ConfirmationContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
