'use client';

import Link from 'next/link';
import { Car } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerLoginForm } from '@/components/auth/customer-login-form';
import { StaffLoginForm } from '@/components/auth/staff-login-form';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <Link href="/" className="flex items-center space-x-2 mb-8">
        <Car className="h-8 w-8" />
        <span className="text-2xl font-bold">TestDrive</span>
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="customer" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="customer">Customer</TabsTrigger>
              <TabsTrigger value="staff">Staff</TabsTrigger>
            </TabsList>
            <TabsContent value="customer" className="mt-6">
              <CustomerLoginForm />
            </TabsContent>
            <TabsContent value="staff" className="mt-6">
              <StaffLoginForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <p className="mt-6 text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/book" className="text-primary hover:underline">
          Book a test drive
        </Link>
      </p>
    </div>
  );
}
