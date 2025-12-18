'use client';

import { MapPin, Phone, Clock, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useShowrooms } from '@/hooks/use-bookings';
import { useBookingStore } from '@/stores/booking';
import type { Showroom } from '@/types';

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getTodayHours(showroom: Showroom) {
  const today = new Date().getDay();
  const hours = showroom.operatingHours.find((h) => h.dayOfWeek === today);
  if (!hours || hours.isClosed) return 'Closed today';
  return `${hours.openTime} - ${hours.closeTime}`;
}

export function ShowroomSelect() {
  const { data: showrooms, isLoading } = useShowrooms({ isActive: true });
  const { selectedShowroom, setShowroom, nextStep } = useBookingStore();

  const handleSelect = (showroom: Showroom) => {
    setShowroom(showroom);
    nextStep();
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Select a Showroom</h2>
        <p className="text-muted-foreground mt-2">
          Choose a showroom near you for your test drive
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {showrooms?.map((showroom) => (
          <Card
            key={showroom.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedShowroom?.id === showroom.id
                ? 'ring-2 ring-primary'
                : ''
            }`}
            onClick={() => handleSelect(showroom)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{showroom.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{showroom.city}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-sm">{showroom.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{showroom.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{getTodayHours(showroom)}</span>
              </div>
              <div className="pt-2 border-t">
                <span className="text-sm text-muted-foreground">
                  {showroom._count?.carUnits || 0} cars available
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showrooms?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No showrooms available at the moment.</p>
        </div>
      )}
    </div>
  );
}
