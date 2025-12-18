'use client';

import { useState, useMemo } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isSameDay,
  parseISO,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Clock,
  User,
  Loader2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  useTeamSchedule,
  useSalesExecutives,
  useSetAvailability,
  useRemoveAvailability,
  SalesExecSchedule,
} from '@/hooks/use-scheduling';

const timeOptions = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00',
];

export default function SchedulePage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [availableFrom, setAvailableFrom] = useState('09:00');
  const [availableTo, setAvailableTo] = useState('18:00');

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const { data: teamSchedule = [], isLoading } = useTeamSchedule(
    format(currentWeekStart, 'yyyy-MM-dd'),
    format(weekEnd, 'yyyy-MM-dd')
  );

  const { data: salesExecutives = [], isLoading: loadingSalesExecs } = useSalesExecutives();
  const setAvailability = useSetAvailability();
  const removeAvailability = useRemoveAvailability();

  // Group schedules by user and date
  const scheduleByUserAndDate = useMemo(() => {
    const map = new Map<string, Map<string, SalesExecSchedule>>();
    teamSchedule.forEach((schedule) => {
      if (!map.has(schedule.userId)) {
        map.set(schedule.userId, new Map());
      }
      const dateStr = format(parseISO(schedule.date), 'yyyy-MM-dd');
      map.get(schedule.userId)?.set(dateStr, schedule);
    });
    return map;
  }, [teamSchedule]);

  // Get unique users from schedule or from the salesExecutives list
  const usersInSchedule = useMemo(() => {
    const userMap = new Map<string, { id: string; firstName: string; lastName: string }>();

    // First add all from schedule
    teamSchedule.forEach((s) => {
      if (s.user) {
        userMap.set(s.user.id, s.user);
      }
    });

    // Also add all sales executives
    salesExecutives.forEach((se) => {
      userMap.set(se.id, { id: se.id, firstName: se.firstName, lastName: se.lastName });
    });

    return Array.from(userMap.values());
  }, [teamSchedule, salesExecutives]);

  const handlePreviousWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const handleToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));
  };

  const handleCellClick = (userId: string, date: Date) => {
    setSelectedUserId(userId);
    setSelectedDate(date);

    // Check if there's existing availability
    const dateStr = format(date, 'yyyy-MM-dd');
    const existing = scheduleByUserAndDate.get(userId)?.get(dateStr);
    if (existing) {
      setAvailableFrom(existing.availableFrom);
      setAvailableTo(existing.availableTo);
    } else {
      setAvailableFrom('09:00');
      setAvailableTo('18:00');
    }

    setIsDialogOpen(true);
  };

  const handleSaveAvailability = () => {
    if (!selectedDate || !selectedUserId) return;

    setAvailability.mutate(
      {
        userId: selectedUserId,
        date: format(selectedDate, 'yyyy-MM-dd'),
        availableFrom,
        availableTo,
      },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
        },
      }
    );
  };

  const handleRemoveAvailability = () => {
    if (!selectedDate || !selectedUserId) return;

    removeAvailability.mutate(
      {
        userId: selectedUserId,
        date: format(selectedDate, 'yyyy-MM-dd'),
      },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
        },
      }
    );
  };

  const getScheduleForCell = (userId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return scheduleByUserAndDate.get(userId)?.get(dateStr);
  };

  const selectedUser = usersInSchedule.find((u) => u.id === selectedUserId);
  const existingSchedule = selectedDate && selectedUserId
    ? getScheduleForCell(selectedUserId, selectedDate)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team Schedule</h1>
          <p className="text-muted-foreground">
            Manage your sales team&apos;s availability for test drives
          </p>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-white p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleToday}>
            Today
          </Button>
        </div>
        <h2 className="text-lg font-medium">
          {format(currentWeekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
        </h2>
        <div className="w-[200px]" /> {/* Spacer for alignment */}
      </div>

      {/* Schedule Grid */}
      <div className="bg-white border rounded-lg overflow-hidden">
        {isLoading || loadingSalesExecs ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : usersInSchedule.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Sales Executives</h3>
            <p className="text-muted-foreground max-w-md">
              No sales executives are assigned to your showroom yet.
              Contact an administrator to add team members.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-medium text-sm w-[180px]">
                    Sales Executive
                  </th>
                  {weekDays.map((day) => (
                    <th
                      key={day.toString()}
                      className={cn(
                        'text-center p-3 font-medium text-sm',
                        isSameDay(day, new Date()) && 'bg-primary/10'
                      )}
                    >
                      <div>{format(day, 'EEE')}</div>
                      <div className={cn(
                        'text-lg',
                        isSameDay(day, new Date()) && 'text-primary font-semibold'
                      )}>
                        {format(day, 'd')}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usersInSchedule.map((user) => (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="p-3 font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm">{user.firstName} {user.lastName}</div>
                        </div>
                      </div>
                    </td>
                    {weekDays.map((day) => {
                      const schedule = getScheduleForCell(user.id, day);
                      const isFriday = day.getDay() === 5;

                      return (
                        <td
                          key={day.toString()}
                          className={cn(
                            'p-2 border-l cursor-pointer hover:bg-gray-50 transition-colors',
                            isSameDay(day, new Date()) && 'bg-primary/5',
                            isFriday && 'bg-gray-100'
                          )}
                          onClick={() => !isFriday && handleCellClick(user.id, day)}
                        >
                          {isFriday ? (
                            <div className="text-center text-xs text-muted-foreground">
                              Closed
                            </div>
                          ) : schedule ? (
                            <div className="bg-green-100 text-green-800 rounded p-2 text-center">
                              <div className="text-xs font-medium">Available</div>
                              <div className="text-xs">
                                {schedule.availableFrom} - {schedule.availableTo}
                              </div>
                            </div>
                          ) : (
                            <div className="h-[52px] flex items-center justify-center">
                              <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 rounded" />
          <span>Available for test drives</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 rounded" />
          <span>Closed (Friday)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border rounded" />
          <span>Not scheduled</span>
        </div>
      </div>

      {/* Edit Availability Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {existingSchedule ? 'Edit Availability' : 'Set Availability'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">
                  {selectedUser?.firstName} {selectedUser?.lastName}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Available From
                </label>
                <Select value={availableFrom} onValueChange={setAvailableFrom}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Available Until
                </label>
                <Select value={availableTo} onValueChange={setAvailableTo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {existingSchedule && (
              <Button
                variant="destructive"
                onClick={handleRemoveAvailability}
                disabled={removeAvailability.isPending}
                className="w-full sm:w-auto"
              >
                {removeAvailability.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                Remove
              </Button>
            )}
            <Button
              onClick={handleSaveAvailability}
              disabled={setAvailability.isPending}
              className="w-full sm:w-auto"
            >
              {setAvailability.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {existingSchedule ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
