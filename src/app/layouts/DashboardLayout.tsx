import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/widgets/Sidebar';
import { Navbar } from '@/widgets/Navbar';
import { useUiStore } from '@/shared/store/ui';
import { cn } from '@/shared/lib/utils';

export const DashboardLayout = () => {
  const isSidebarCollapsed = useUiStore((state) => state.isSidebarCollapsed);

  return (
    <div className="flex min-h-screen bg-slate-50/30">
      <Sidebar />
      <div className={cn(
        "flex flex-1 flex-col transition-all duration-700 ease-[0.16, 1, 0.3, 1]", 
        isSidebarCollapsed ? "md:pl-24" : "md:pl-80"
      )}>
        <Navbar />
        <main className="flex-1 p-4 md:p-6 animate-in fade-in duration-1000">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
