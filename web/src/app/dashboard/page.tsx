'use client';

import { format, subDays } from 'date-fns';
import {
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Car,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAnalyticsOverview, usePopularCars, useBookingsBySource } from '@/hooks/use-analytics';
import { useBookings } from '@/hooks/use-bookings';
import { Badge } from '@/components/ui/badge';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  NO_SHOW: 'bg-gray-100 text-gray-800',
};

export default function DashboardPage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

  const { data: overview, isLoading: overviewLoading } = useAnalyticsOverview({
    from: thirtyDaysAgo,
    to: today,
  });
  const { data: popularCars, isLoading: carsLoading } = usePopularCars({ limit: 5 });
  const { data: bookingsBySource } = useBookingsBySource();
  const { data: todayBookings, isLoading: bookingsLoading } = useBookings({
    from: today,
    to: today,
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your test drive bookings
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{overview?.totalBookings || 0}</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{overview?.completedBookings || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {Number(overview?.conversionRate || 0).toFixed(1)}% completion rate
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{overview?.pendingBookings || 0}</div>
                <p className="text-xs text-muted-foreground">Awaiting completion</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{overview?.cancelledBookings || 0}</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Today's Bookings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Today&apos;s Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : todayBookings && todayBookings.length > 0 ? (
              <div className="space-y-3">
                {todayBookings.slice(0, 5).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{booking.startTime}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.customer?.firstName} {booking.customer?.lastName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {booking.carUnit && (
                        <span className="text-sm text-muted-foreground">
                          {booking.carUnit.carModel?.brand} {booking.carUnit.carModel?.model}
                        </span>
                      )}
                      <Badge className={statusColors[booking.status]}>
                        {booking.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No bookings scheduled for today
              </div>
            )}
          </CardContent>
        </Card>

        {/* Popular Cars */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Cars</CardTitle>
          </CardHeader>
          <CardContent>
            {carsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : popularCars && popularCars.length > 0 ? (
              <div className="space-y-3">
                {popularCars.map((car, index) => (
                  <div
                    key={car.carModelId}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{car.brand} {car.model}</p>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {car.bookingCount} bookings
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No booking data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booking Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsBySource && bookingsBySource.length > 0 ? (
              <div className="space-y-3">
                {bookingsBySource.map((source) => (
                  <div
                    key={source.source}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm capitalize">
                      {source.source.toLowerCase().replace('_', ' ')}
                    </span>
                    <span className="text-sm font-medium">{source.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No source data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
