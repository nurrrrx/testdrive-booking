'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useBookingByReference } from '@/hooks/use-bookings';
import { format, parseISO } from 'date-fns';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const referenceNumber = searchParams.get('ref') || '';

  const { data: booking, isLoading } = useBookingByReference(referenceNumber);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <section className="flex-1 py-20 bg-[#f7f7f7]">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>

            <h1 className="text-4xl font-light tracking-tight lexus-heading mb-4">
              Booking Confirmed
            </h1>
            <p className="text-muted-foreground mb-8">
              Thank you for booking a test drive with Lexus UAE. We&apos;ve sent a
              confirmation email with all the details.
            </p>

            {/* Booking Reference */}
            <div className="bg-white p-8 mb-8">
              <p className="text-sm text-muted-foreground mb-2">Booking Reference</p>
              <p className="text-3xl font-mono font-semibold tracking-wider">
                {referenceNumber || 'N/A'}
              </p>
            </div>

            {/* Booking Details */}
            {isLoading ? (
              <div className="bg-white p-8 mb-8 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : booking ? (
              <div className="bg-white p-8 text-left mb-8">
                <h2 className="text-xl font-medium mb-6">Booking Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {format(parseISO(booking.date), 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p className="font-medium">{booking.startTime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Showroom</p>
                    <p className="font-medium">{booking.showroom?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium capitalize">{booking.status.toLowerCase()}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* What's Next */}
            <div className="bg-white p-8 text-left mb-8">
              <h2 className="text-xl font-medium mb-6">What&apos;s Next?</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Check Your Email</p>
                    <p className="text-sm text-muted-foreground">
                      We&apos;ve sent a confirmation email with your booking details and
                      directions to the showroom.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Prepare Your Documents</p>
                    <p className="text-sm text-muted-foreground">
                      Please bring a valid driver&apos;s license and Emirates ID to your
                      test drive appointment.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Arrive on Time</p>
                    <p className="text-sm text-muted-foreground">
                      Please arrive 10 minutes before your scheduled time. Our team
                      will be ready to welcome you.
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="bg-white p-8 text-left mb-8">
              <h2 className="text-xl font-medium mb-4">Need to Make Changes?</h2>
              <p className="text-muted-foreground mb-4">
                If you need to reschedule or cancel your booking, please contact us:
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 p-4 bg-[#f7f7f7]">
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">800 LEXUS (53987)</p>
                </div>
                <div className="flex-1 p-4 bg-[#f7f7f7]">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">testdrive@lexus.ae</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/models"
                className="lexus-btn lexus-btn-outline"
              >
                Explore More Models
              </Link>
              <Link
                href="/"
                className="lexus-btn lexus-btn-primary"
              >
                Return Home
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function TestDriveConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
