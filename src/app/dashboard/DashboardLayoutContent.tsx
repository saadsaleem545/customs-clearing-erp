'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Scale, 
  Activity,
  ChevronRight,
  ChevronLeft,
  FileCheck2,
  Menu,
  X
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userName: string;
  userRole: string;
}

export default function DashboardLayoutContent({
  children,
  userName,
  userRole,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Executive Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Client Parties Directory', href: '/dashboard/parties', icon: Users },
    { name: 'Import Clearance (GD)', href: '/dashboard/imports', icon: ArrowDownLeft },
    { name: 'Analysis Certificates', href: '/dashboard/analysis', icon: FileCheck2 },
    { name: 'Export Shipping Bills', href: '/dashboard/exports', icon: ArrowUpRight },
    { name: 'IOR Audit Engine', href: '/dashboard/reconciliation', icon: Scale },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex selection:bg-blue-600 selection:text-white overflow-x-hidden relative">
      
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Wider Blue Gradient Sidebar */}
      <aside 
        className={`fixed md:relative inset-y-0 left-0 bg-gradient-to-b from-blue-700 via-blue-900 to-slate-950 border-r border-blue-900 flex flex-col shrink-0 shadow-2xl z-50 transition-all duration-300 ease-in-out text-white ${
          isMobileMenuOpen ? 'translate-x-0 w-80' : '-translate-x-full md:translate-x-0'
        } ${isSidebarOpen ? 'md:w-80' : 'md:w-20'}`}
      >
        <div className="p-6 border-b border-blue-600/30 flex items-center justify-between">
          <div className={`flex items-center gap-3.5 overflow-hidden ${!isSidebarOpen && 'md:justify-center md:w-full'}`}>
            <div className="w-12 h-12 bg-white text-blue-900 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shrink-0">
              CC
            </div>
            {(isSidebarOpen || isMobileMenuOpen) && (
              <div className="transition-opacity duration-200 truncate">
                <h1 className="text-lg font-black text-white tracking-wider uppercase flex items-center gap-1.5">
                  HASH ERP
                </h1>
                <p className="text-xs font-semibold text-blue-200">Customs &amp; Freight Hub</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-xl bg-blue-900 text-blue-200 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`hidden md:flex p-2 rounded-xl bg-blue-900/80 text-blue-200 hover:text-white hover:bg-blue-800 transition shadow-md border border-blue-600/30 shrink-0 cursor-pointer ${
              !isSidebarOpen && 'absolute -right-3.5 top-6 z-30 bg-blue-800'
            }`}
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2.5 overflow-y-auto mt-2">
          {(isSidebarOpen || isMobileMenuOpen) && (
            <div className="px-3 py-2 text-xs font-black text-blue-300 uppercase tracking-widest">
              Core Modules
            </div>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`group relative flex items-center justify-between px-4 py-4 rounded-xl text-base font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-blue-950 shadow-xl shadow-black/20'
                    : 'text-blue-100 hover:bg-blue-800/60 hover:text-white'
                }`}
                title={!isSidebarOpen ? item.name : undefined}
              >
                <div className={`flex items-center gap-4 ${!isSidebarOpen && 'md:justify-center md:w-full'}`}>
                  <Icon className={`w-6 h-6 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-blue-700' : 'text-blue-300 group-hover:text-white'}`} />
                  {(isSidebarOpen || isMobileMenuOpen) && <span className="truncate">{item.name}</span>}
                </div>
                {(isSidebarOpen || isMobileMenuOpen) && isActive && <ChevronRight className="w-5 h-5 text-blue-700 shrink-0" />}

                {!isSidebarOpen && (
                  <div className="hidden md:group-hover:block absolute left-full ml-3 px-3 py-1.5 bg-slate-900 border border-slate-700 text-white text-xs rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* System Health Card at Bottom (Converted from Green to Blue Theme) */}
        {(isSidebarOpen || isMobileMenuOpen) ? (
          <div className="p-4 m-4 bg-blue-950/60 border border-blue-600/30 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-blue-200 flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4 text-cyan-400 animate-pulse" /> WeBOC Portal
              </span>
              <span className="text-xs font-black text-cyan-200 bg-blue-900/80 border border-blue-500 px-2.5 py-0.5 rounded-full">
                LIVE
              </span>
            </div>
            <p className="text-xs font-semibold text-blue-300">IOCO Matrix API Engine Online</p>
          </div>
        ) : (
          <div className="hidden md:flex justify-center py-4" title="WeBOC Portal Live">
            <span className="w-4 h-4 rounded-full bg-cyan-400 animate-pulse block shadow-md"></span>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden">
        <div className="md:hidden h-14 bg-blue-900 text-white border-b border-blue-800 px-4 flex items-center justify-between shrink-0 z-30 shadow-sm">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-xl bg-blue-800 text-white hover:bg-blue-700 transition cursor-pointer"
            title="Open Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-base font-bold text-white">HASH ERP Command</span>
          <div className="w-6"></div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">{children}</main>
      </div>
    </div>
  );
}