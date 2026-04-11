import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/widgets/Sidebar';
import { Navbar } from '@/widgets/Navbar';
import { useUiStore } from '@/shared/store/ui';
import { cn } from '@/shared/lib/utils';

export const DashboardLayout = () => {
  const isSidebarCollapsed = useUiStore((state) => state.isSidebarCollapsed);

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className={cn("flex flex-1 flex-col transition-all duration-300", isSidebarCollapsed ? "md:pl-[88px]" : "md:pl-[260px]")}>
        <Navbar />
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
