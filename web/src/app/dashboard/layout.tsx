'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Car,
  LayoutDashboard,
  Calendar,
  Phone,
  Users,
  Building2,
  BarChart3,
  CalendarDays,
  LogOut,
  Menu,
  ScanLine,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/stores/auth';
import { useLogout } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

const sidebarNav = [
  {
    title: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/bookings', label: 'Bookings', icon: Calendar },
      { href: '/dashboard/leads', label: 'Leads', icon: Phone },
    ],
  },
  {
    title: 'Management',
    items: [
      { href: '/dashboard/schedule', label: 'Team Schedule', icon: CalendarDays },
      { href: '/dashboard/cars', label: 'Car Inventory', icon: Car },
      { href: '/dashboard/check-in', label: 'Car Check-In', icon: ScanLine },
      { href: '/dashboard/showrooms', label: 'Showrooms', icon: Building2 },
      { href: '/dashboard/users', label: 'Users', icon: Users },
    ],
  },
  {
    title: 'Reports',
    items: [
      { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
];

function SidebarContent() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const logout = useLogout();

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Car className="h-6 w-6" />
          <span className="font-bold">TestDrive</span>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        {sidebarNav.map((section) => (
          <div key={section.title} className="mb-6">
            <h4 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </h4>
            <div className="space-y-1">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </ScrollArea>

      {/* User */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            {user?.firstName?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isStaff, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isStaff())) {
      router.push('/login');
    }
  }, [isAuthenticated, isStaff, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !isStaff()) {
    return null;
  }

  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-background">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Car className="h-6 w-6" />
            <span className="font-bold">TestDrive</span>
          </Link>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
