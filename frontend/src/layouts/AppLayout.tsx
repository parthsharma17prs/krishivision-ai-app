import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Navbar } from '../components/layout/Navbar';
import { MobileNav } from '../components/layout/MobileNav';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-100 font-sans">
      <Sidebar demoMode={true} />
      
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        <Navbar />
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <MobileNav />
    </div>
  );
};
