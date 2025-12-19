'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { carsApi, showroomsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Car,
  ScanLine,
  Search,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
  CarFront,
  Loader2,
  CheckCircle2,
  History,
} from 'lucide-react';
import { format } from 'date-fns';

type CheckInType = 'RECEIVED' | 'SENT_OUT' | 'RETURNED' | 'OUT_FOR_DRIVE';

interface CarUnit {
  id: string;
  vin: string | null;
  color: string | null;
  status: string;
  carModel: {
    brand: string;
    model: string;
    year: number;
    variant: string | null;
  };
  showroom: {
    id: string;
    name: string;
  };
}

interface CheckInRecord {
  id: string;
  type: CheckInType;
  notes: string | null;
  createdAt: string;
  carUnit: {
    carModel: {
      brand: string;
      model: string;
    };
  };
  showroom: {
    name: string;
  };
  performedBy: {
    firstName: string | null;
    lastName: string | null;
  };
  fromShowroom: { name: string } | null;
  toShowroom: { name: string } | null;
}

const checkInTypes: { value: CheckInType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'RECEIVED',
    label: 'Receive Car',
    icon: <ArrowDownToLine className="h-5 w-5" />,
    description: 'Car received at this showroom (from transfer or delivery)',
  },
  {
    value: 'SENT_OUT',
    label: 'Send Car',
    icon: <ArrowUpFromLine className="h-5 w-5" />,
    description: 'Car being sent to another showroom',
  },
  {
    value: 'RETURNED',
    label: 'Test Drive Return',
    icon: <RotateCcw className="h-5 w-5" />,
    description: 'Car returned from test drive',
  },
  {
    value: 'OUT_FOR_DRIVE',
    label: 'Out for Test Drive',
    icon: <CarFront className="h-5 w-5" />,
    description: 'Car going out for test drive',
  },
];

export default function CheckInPage() {
  const queryClient = useQueryClient();
  const [vinInput, setVinInput] = useState('');
  const [selectedCar, setSelectedCar] = useState<CarUnit | null>(null);
  const [checkInType, setCheckInType] = useState<CheckInType | ''>('');
  const [notes, setNotes] = useState('');
  const [toShowroomId, setToShowroomId] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Fetch showrooms for transfer destination
  const { data: showrooms } = useQuery({
    queryKey: ['showrooms'],
    queryFn: async () => {
      const response = await showroomsApi.getAll();
      return response.data;
    },
  });

  // Fetch check-in history
  const { data: checkInHistory } = useQuery({
    queryKey: ['checkInHistory'],
    queryFn: async () => {
      const response = await carsApi.getCheckInHistory({ limit: 20 });
      return response.data as CheckInRecord[];
    },
  });

  // Search car by VIN
  const searchByVin = async () => {
    if (!vinInput.trim()) {
      toast.error('Please enter a VIN number');
      return;
    }

    setIsSearching(true);
    try {
      const response = await carsApi.getUnitByVin(vinInput.trim());
      setSelectedCar(response.data as CarUnit);
      toast.success('Car found!');
    } catch {
      toast.error('Car not found with this VIN');
      setSelectedCar(null);
    } finally {
      setIsSearching(false);
    }
  };

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: (data: {
      carUnitId: string;
      type: CheckInType;
      notes?: string;
      toShowroomId?: string;
    }) => carsApi.checkIn({
      carUnitId: data.carUnitId,
      type: data.type,
      notes: data.notes,
      toShowroomId: data.toShowroomId,
    }),
    onSuccess: () => {
      toast.success('Check-in recorded successfully!');
      queryClient.invalidateQueries({ queryKey: ['checkInHistory'] });
      queryClient.invalidateQueries({ queryKey: ['carUnits'] });
      // Reset form
      setSelectedCar(null);
      setVinInput('');
      setCheckInType('');
      setNotes('');
      setToShowroomId('');
    },
    onError: () => {
      toast.error('Failed to record check-in');
    },
  });

  const handleCheckIn = () => {
    if (!selectedCar || !checkInType) {
      toast.error('Please select a car and check-in type');
      return;
    }

    if (checkInType === 'SENT_OUT' && !toShowroomId) {
      toast.error('Please select destination showroom');
      return;
    }

    checkInMutation.mutate({
      carUnitId: selectedCar.id,
      type: checkInType,
      notes: notes || undefined,
      toShowroomId: checkInType === 'SENT_OUT' ? toShowroomId : undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      AVAILABLE: 'bg-green-100 text-green-800',
      RESERVED: 'bg-yellow-100 text-yellow-800',
      OUT_FOR_TEST_DRIVE: 'bg-blue-100 text-blue-800',
      MAINTENANCE: 'bg-orange-100 text-orange-800',
      IN_TRANSIT: 'bg-purple-100 text-purple-800',
      SOLD: 'bg-gray-100 text-gray-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getCheckInTypeBadge = (type: CheckInType) => {
    const typeColors: Record<CheckInType, string> = {
      RECEIVED: 'bg-green-100 text-green-800',
      SENT_OUT: 'bg-purple-100 text-purple-800',
      RETURNED: 'bg-blue-100 text-blue-800',
      OUT_FOR_DRIVE: 'bg-orange-100 text-orange-800',
    };
    return typeColors[type];
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Car Check-In / Check-Out</h1>
        <p className="text-muted-foreground">
          Record car movements: receive, send, or track test drives
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Check-In Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="h-5 w-5" />
              Scan or Enter VIN
            </CardTitle>
            <CardDescription>
              Enter VIN number manually or scan barcode/QR code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* VIN Input */}
            <div className="space-y-2">
              <Label htmlFor="vin">VIN Number</Label>
              <div className="flex gap-2">
                <Input
                  id="vin"
                  placeholder="Enter VIN (e.g., JTJHY7AX2L5123456)"
                  value={vinInput}
                  onChange={(e) => setVinInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && searchByVin()}
                />
                <Button onClick={searchByVin} disabled={isSearching}>
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Selected Car Info */}
            {selectedCar && (
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">
                      {selectedCar.carModel.brand} {selectedCar.carModel.model}
                    </span>
                  </div>
                  <Badge className={getStatusBadge(selectedCar.status)}>
                    {selectedCar.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div>Year: {selectedCar.carModel.year}</div>
                  <div>Color: {selectedCar.color || 'N/A'}</div>
                  <div>Variant: {selectedCar.carModel.variant || 'N/A'}</div>
                  <div>Location: {selectedCar.showroom.name}</div>
                </div>
                {selectedCar.vin && (
                  <div className="text-xs text-muted-foreground font-mono">
                    VIN: {selectedCar.vin}
                  </div>
                )}
              </div>
            )}

            {/* Check-In Type Selection */}
            {selectedCar && (
              <>
                <div className="space-y-2">
                  <Label>Action Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {checkInTypes.map((type) => (
                      <Button
                        key={type.value}
                        variant={checkInType === type.value ? 'default' : 'outline'}
                        className="h-auto py-3 flex flex-col items-center gap-1"
                        onClick={() => setCheckInType(type.value)}
                      >
                        {type.icon}
                        <span className="text-xs">{type.label}</span>
                      </Button>
                    ))}
                  </div>
                  {checkInType && (
                    <p className="text-xs text-muted-foreground">
                      {checkInTypes.find((t) => t.value === checkInType)?.description}
                    </p>
                  )}
                </div>

                {/* Destination Showroom (for SENT_OUT) */}
                {checkInType === 'SENT_OUT' && (
                  <div className="space-y-2">
                    <Label>Destination Showroom</Label>
                    <Select value={toShowroomId} onValueChange={setToShowroomId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                      <SelectContent>
                        {showrooms
                          ?.filter((s: { id: string }) => s.id !== selectedCar.showroom.id)
                          .map((showroom: { id: string; name: string }) => (
                            <SelectItem key={showroom.id} value={showroom.id}>
                              {showroom.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any relevant notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCheckIn}
                  disabled={!checkInType || checkInMutation.isPending}
                >
                  {checkInMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Record Check-In
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest check-in/check-out records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {checkInHistory?.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No check-in records yet
                </p>
              )}
              {checkInHistory?.map((record) => (
                <div
                  key={record.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className="mt-0.5">
                    {checkInTypes.find((t) => t.value === record.type)?.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {record.carUnit.carModel.brand} {record.carUnit.carModel.model}
                      </span>
                      <Badge className={`text-xs ${getCheckInTypeBadge(record.type)}`}>
                        {record.type.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {record.type === 'SENT_OUT' && record.toShowroom && (
                        <span>To: {record.toShowroom.name} • </span>
                      )}
                      {record.type === 'RECEIVED' && record.fromShowroom && (
                        <span>From: {record.fromShowroom.name} • </span>
                      )}
                      <span>
                        By {record.performedBy.firstName} {record.performedBy.lastName}
                      </span>
                    </div>
                    {record.notes && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {record.notes}
                      </p>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {format(new Date(record.createdAt), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
