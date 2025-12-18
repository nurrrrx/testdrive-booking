'use client';

import { Building2 } from 'lucide-react';

export default function ShowroomsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Showrooms</h1>
        <p className="text-muted-foreground">
          View showroom information
        </p>
      </div>

      <div className="flex flex-col items-center justify-center p-12 text-center bg-white border rounded-lg">
        <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Showroom Details</h3>
        <p className="text-muted-foreground max-w-md">
          This page is available for admin users to manage showroom locations and settings.
        </p>
      </div>
    </div>
  );
}
