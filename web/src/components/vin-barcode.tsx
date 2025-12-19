'use client';

import Barcode from 'react-barcode';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Maximize2 } from 'lucide-react';

interface VinBarcodeProps {
  vin: string;
  showText?: boolean;
  height?: number;
  width?: number;
  displayValue?: boolean;
}

export function VinBarcode({
  vin,
  height = 40,
  width = 1.2,
  displayValue = false,
}: VinBarcodeProps) {
  if (!vin) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="bg-white p-1 rounded border">
        <Barcode
          value={vin}
          format="CODE128"
          width={width}
          height={height}
          displayValue={displayValue}
          margin={2}
          background="#ffffff"
          lineColor="#000000"
        />
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Maximize2 className="h-3 w-3" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>VIN Barcode</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="bg-white p-4 rounded-lg border">
              <Barcode
                value={vin}
                format="CODE128"
                width={2}
                height={80}
                displayValue={true}
                margin={10}
                background="#ffffff"
                lineColor="#000000"
                fontSize={14}
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Scan this barcode with the mobile app to quickly check in this vehicle
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function VinWithBarcode({ vin }: { vin: string | null | undefined }) {
  if (!vin) {
    return <span className="text-muted-foreground">N/A</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      <code className="text-xs bg-gray-100 px-2 py-1 rounded inline-block">
        {vin}
      </code>
      <VinBarcode vin={vin} height={30} width={1} />
    </div>
  );
}
