'use client';

import * as React from 'react';
import { Sidebar } from '@/components/sidebar';
import { BottomNav } from '@/components/bottom-nav';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      {/* Desktop sidebar - always visible on lg+ */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Tablet menu button - visible on md only */}
      <div className="hidden md:block lg:hidden fixed top-4 left-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Menu" className="bg-card shadow-sm">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-6 md:p-8 pb-20 md:pb-8">{children}</div>
      </main>

      {/* Phone bottom nav - visible on small screens only */}
      <BottomNav />
    </div>
  );
}
