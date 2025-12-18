'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useBookings, useCompleteBooking, useCancelBooking, useMarkNoShow } from '@/hooks/use-bookings';
import type { Booking, BookingStatus } from '@/types';

const statusColors: Record<BookingStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  NO_SHOW: 'bg-gray-100 text-gray-800',
};

export default function BookingsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: bookings, isLoading } = useBookings({
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const completeBooking = useCompleteBooking();
  const cancelBooking = useCancelBooking();
  const markNoShow = useMarkNoShow();

  const filteredBookings = bookings?.filter((booking) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      booking.referenceNumber.toLowerCase().includes(query) ||
      booking.customer?.firstName?.toLowerCase().includes(query) ||
      booking.customer?.lastName?.toLowerCase().includes(query) ||
      booking.customer?.phone?.includes(query)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bookings</h1>
        <p className="text-muted-foreground">
          Manage all test drive bookings
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by reference, name, or phone..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="NO_SHOW">No Show</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Car</TableHead>
              <TableHead>Showroom</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredBookings && filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-mono text-sm">
                    {booking.referenceNumber}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {booking.customer?.firstName} {booking.customer?.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking.customer?.phone}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {booking.carUnit ? (
                      <div>
                        <p className="font-medium">
                          {booking.carUnit.carModel?.brand} {booking.carUnit.carModel?.model}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {booking.carUnit.color}
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Any</span>
                    )}
                  </TableCell>
                  <TableCell>{booking.showroom?.name}</TableCell>
                  <TableCell>
                    <div>
                      <p>{format(new Date(booking.date), 'MMM d, yyyy')}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.startTime}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[booking.status]}>
                      {booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize text-sm">
                    {booking.source.toLowerCase().replace('_', ' ')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(booking.status) && (
                          <>
                            <DropdownMenuItem
                              onClick={() => completeBooking.mutate({ id: booking.id })}
                            >
                              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                              Mark Complete
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => markNoShow.mutate(booking.id)}
                            >
                              <Clock className="mr-2 h-4 w-4 text-gray-600" />
                              Mark No-Show
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => cancelBooking.mutate({ id: booking.id })}
                              className="text-red-600"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancel Booking
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No bookings found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
