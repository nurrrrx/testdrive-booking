'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, User, LogOut, LayoutDashboard, Calendar, Phone, Heart, ShoppingBag, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useAuthStore } from '@/stores/auth';
import { useLogout } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

const publicNav = [
  { href: '/models', label: 'Models' },
  { href: '/testdrive', label: 'Test Drive' },
  { href: '/offers', label: 'Offers' },
  { href: '/contact', label: 'Contact Us' },
];

const staffNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/bookings', label: 'Bookings', icon: Calendar },
  { href: '/dashboard/leads', label: 'Leads', icon: Phone },
];

export function Header() {
  const pathname = usePathname();
  const { isAuthenticated, user, isStaff } = useAuthStore();
  const logout = useLogout();

  const isDashboard = pathname.startsWith('/dashboard');
  const navItems = isDashboard && isStaff() ? staffNav : publicNav;

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Left side - Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/lexus_logo.webp"
                alt="Lexus"
                width={100}
                height={20}
                className="h-5 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Center - Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'nav-link text-sm font-medium tracking-wide uppercase text-foreground/70 hover:text-foreground py-2',
                  pathname === item.href && 'text-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side - Icons */}
          <div className="flex items-center space-x-4">
            {/* Language Toggle */}
            <button className="hidden md:flex items-center space-x-1 text-sm text-foreground/70 hover:text-foreground transition-colors">
              <Globe className="h-4 w-4" />
              <span>EN</span>
            </button>

            {/* Favorites */}
            <button className="hidden md:block p-2 text-foreground/70 hover:text-foreground transition-colors">
              <Heart className="h-5 w-5" />
            </button>

            {/* User Account */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {user.firstName && (
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                      )}
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email || user.phone}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  {isStaff() && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {!isStaff() && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/my-bookings">
                          <Calendar className="mr-2 h-4 w-4" />
                          My Bookings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login" className="hidden md:block p-2 text-foreground/70 hover:text-foreground transition-colors">
                <User className="h-5 w-5" />
              </Link>
            )}

            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] bg-white">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="mt-8">
                  <nav className="flex flex-col space-y-6">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'text-lg font-medium tracking-wide uppercase transition-colors hover:text-foreground',
                          pathname === item.href ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {item.label}
                      </Link>
                    ))}
                    <div className="border-t pt-6 mt-6">
                      {!isAuthenticated && (
                        <Link
                          href="/login"
                          className="text-lg font-medium tracking-wide uppercase text-muted-foreground hover:text-foreground"
                        >
                          Sign In
                        </Link>
                      )}
                    </div>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
