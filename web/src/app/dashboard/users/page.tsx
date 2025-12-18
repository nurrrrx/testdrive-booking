'use client';

import { Users } from 'lucide-react';

export default function UsersPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          Staff user management
        </p>
      </div>

      <div className="flex flex-col items-center justify-center p-12 text-center bg-white border rounded-lg">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">User Management</h3>
        <p className="text-muted-foreground max-w-md">
          This page is available for admin users to manage staff accounts and permissions.
        </p>
      </div>
    </div>
  );
}
