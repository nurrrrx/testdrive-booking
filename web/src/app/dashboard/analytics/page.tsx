'use client';

import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Detailed reports and insights
        </p>
      </div>

      <div className="flex flex-col items-center justify-center p-12 text-center bg-white border rounded-lg">
        <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Analytics Dashboard</h3>
        <p className="text-muted-foreground max-w-md">
          Detailed analytics and reporting features will be available here.
          The main dashboard already shows key metrics for your showroom.
        </p>
      </div>
    </div>
  );
}
