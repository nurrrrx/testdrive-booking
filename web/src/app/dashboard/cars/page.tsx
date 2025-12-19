'use client';

import { useState } from 'react';
import {
  Car,
  Search,
  Filter,
  Loader2,
  CheckCircle,
  AlertCircle,
  Wrench,
  Truck,
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useCarUnits, useUpdateCarUnitStatus, useCarModels } from '@/hooks/use-cars';
import { VinBarcode } from '@/components/vin-barcode';
import type { CarUnitStatus } from '@/types';

const statusOptions: { value: CarUnitStatus; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'AVAILABLE', label: 'Available', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  { value: 'OUT_FOR_TEST_DRIVE', label: 'Out for Test Drive', icon: Car, color: 'bg-blue-100 text-blue-800' },
  { value: 'RESERVED', label: 'Reserved', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'MAINTENANCE', label: 'Maintenance', icon: Wrench, color: 'bg-orange-100 text-orange-800' },
  { value: 'IN_TRANSIT', label: 'In Transit', icon: Truck, color: 'bg-purple-100 text-purple-800' },
];

const getStatusConfig = (status: CarUnitStatus) => {
  return statusOptions.find((s) => s.value === status) || statusOptions[0];
};

export default function CarsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modelFilter, setModelFilter] = useState<string>('all');

  const { data: carUnits = [], isLoading } = useCarUnits();
  const { data: carModels = [] } = useCarModels();
  const updateStatus = useUpdateCarUnitStatus();

  // Filter car units
  const filteredUnits = carUnits.filter((unit) => {
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesVin = unit.vin?.toLowerCase().includes(searchLower);
      const matchesModel = unit.carModel?.model.toLowerCase().includes(searchLower);
      const matchesBrand = unit.carModel?.brand.toLowerCase().includes(searchLower);
      const matchesColor = unit.color.toLowerCase().includes(searchLower);
      if (!matchesVin && !matchesModel && !matchesBrand && !matchesColor) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== 'all' && unit.status !== statusFilter) {
      return false;
    }

    // Model filter
    if (modelFilter !== 'all' && unit.carModelId !== modelFilter) {
      return false;
    }

    return true;
  });

  // Group by status for summary
  const statusCounts = carUnits.reduce((acc, unit) => {
    acc[unit.status] = (acc[unit.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleStatusChange = (unitId: string, newStatus: CarUnitStatus) => {
    updateStatus.mutate({ id: unitId, status: newStatus });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Car Inventory</h1>
          <p className="text-muted-foreground">
            Manage your showroom&apos;s vehicle inventory and availability
          </p>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statusOptions.map((status) => (
          <button
            key={status.value}
            onClick={() => setStatusFilter(statusFilter === status.value ? 'all' : status.value)}
            className={cn(
              'p-4 rounded-lg border transition-all',
              statusFilter === status.value
                ? 'border-primary ring-2 ring-primary/20'
                : 'hover:border-primary/50'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-full', status.color)}>
                <status.icon className="h-4 w-4" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-semibold">
                  {statusCounts[status.value] || 0}
                </div>
                <div className="text-xs text-muted-foreground">{status.label}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by VIN, model, brand, or color..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={modelFilter} onValueChange={setModelFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Models" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Models</SelectItem>
            {carModels.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.brand} {model.model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredUnits.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Car className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Cars Found</h3>
            <p className="text-muted-foreground max-w-md">
              {search || statusFilter !== 'all' || modelFilter !== 'all'
                ? 'No cars match your current filters. Try adjusting your search criteria.'
                : 'No cars are assigned to your showroom yet.'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>VIN</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUnits.map((unit) => {
                const statusConfig = getStatusConfig(unit.status);
                return (
                  <TableRow key={unit.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                          <Car className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {unit.carModel?.brand} {unit.carModel?.model}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {unit.carModel?.year} • {unit.carModel?.variant || 'Standard'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {unit.vin || 'N/A'}
                      </code>
                    </TableCell>
                    <TableCell>
                      {unit.vin && <VinBarcode vin={unit.vin} height={35} width={1} />}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{
                            backgroundColor:
                              unit.color.toLowerCase() === 'white'
                                ? '#fff'
                                : unit.color.toLowerCase() === 'black'
                                ? '#000'
                                : unit.color.toLowerCase() === 'silver'
                                ? '#c0c0c0'
                                : unit.color.toLowerCase() === 'red'
                                ? '#dc2626'
                                : '#6b7280',
                          }}
                        />
                        <span className="capitalize">{unit.color}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {unit.isDemoOnly ? (
                        <Badge variant="secondary">Demo Only</Badge>
                      ) : (
                        <Badge variant="outline">Test Drive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('gap-1', statusConfig.color)}>
                        <statusConfig.icon className="h-3 w-3" />
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Change Status
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {statusOptions.map((status) => (
                            <DropdownMenuItem
                              key={status.value}
                              onClick={() => handleStatusChange(unit.id, status.value)}
                              disabled={unit.status === status.value}
                              className="gap-2"
                            >
                              <status.icon className="h-4 w-4" />
                              {status.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Summary */}
      {!isLoading && filteredUnits.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredUnits.length} of {carUnits.length} vehicles
        </div>
      )}
    </div>
  );
}
