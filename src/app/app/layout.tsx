'use client';

import { createContext, useContext, useState } from 'react';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { DashboardTopbar } from '@/components/dashboard/dashboard-topbar';

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: false,
  setIsCollapsed: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      <div className="min-h-screen bg-[#0e0e0e] text-white">
        <DashboardSidebar />
        <DashboardTopbar />
        <main className={`pt-16 min-h-screen transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
          {children}
        </main>
      </div>
    </SidebarContext.Provider>
  );
}
