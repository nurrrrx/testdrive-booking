'use client';

import Image from 'next/image';
import { Fuel, Gauge, Zap, ChevronRight, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCarModels } from '@/hooks/use-bookings';
import { useBookingStore } from '@/stores/booking';
import type { CarModel } from '@/types';

const fuelTypeLabels: Record<string, string> = {
  PETROL: 'Petrol',
  DIESEL: 'Diesel',
  ELECTRIC: 'Electric',
  HYBRID: 'Hybrid',
  PLUGIN_HYBRID: 'Plug-in Hybrid',
};

const fuelTypeIcons: Record<string, typeof Fuel> = {
  PETROL: Fuel,
  DIESEL: Fuel,
  ELECTRIC: Zap,
  HYBRID: Zap,
  PLUGIN_HYBRID: Zap,
};

export function CarSelect() {
  const { data: carModels, isLoading } = useCarModels({ isAvailableForTestDrive: true });
  const { selectedCarModel, setCarModel, nextStep, prevStep } = useBookingStore();

  const handleSelect = (carModel: CarModel) => {
    setCarModel(carModel);
    nextStep();
  };

  const handleSkip = () => {
    setCarModel(null);
    nextStep();
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <Skeleton className="h-48 w-full rounded-t-lg" />
            <CardContent className="p-4">
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Group by brand
  const brandGroups = carModels?.reduce((acc, car) => {
    if (!acc[car.brand]) acc[car.brand] = [];
    acc[car.brand].push(car);
    return acc;
  }, {} as Record<string, CarModel[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={prevStep}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button variant="outline" onClick={handleSkip}>
          Skip - Any Car
        </Button>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold">Choose a Car</h2>
        <p className="text-muted-foreground mt-2">
          Select the car you&apos;d like to test drive, or skip to see any available
        </p>
      </div>

      {brandGroups && Object.entries(brandGroups).map(([brand, cars]) => (
        <div key={brand} className="space-y-4">
          <h3 className="text-lg font-semibold">{brand}</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cars.map((car) => {
              const FuelIcon = fuelTypeIcons[car.fuelType] || Fuel;
              return (
                <Card
                  key={car.id}
                  className={`cursor-pointer transition-all hover:shadow-md overflow-hidden ${
                    selectedCarModel?.id === car.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleSelect(car)}
                >
                  <div className="relative h-48 bg-slate-100">
                    {car.imageUrl ? (
                      <Image
                        src={car.imageUrl}
                        alt={`${car.brand} ${car.model}`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Gauge className="h-16 w-16 text-slate-300" />
                      </div>
                    )}
                    <Badge className="absolute top-2 right-2">
                      {car.year}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{car.model}</h4>
                        {car.variant && (
                          <p className="text-sm text-muted-foreground">{car.variant}</p>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <FuelIcon className="h-4 w-4" />
                        <span>{fuelTypeLabels[car.fuelType]}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {car.transmission}
                      </div>
                    </div>
                    {car.specs && (
                      <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                        {car.specs.power && <span>{car.specs.power}</span>}
                        {car.specs.acceleration && (
                          <span className="ml-3">{car.specs.acceleration}</span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {carModels?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No cars available for test drive at the moment.</p>
        </div>
      )}
    </div>
  );
}
