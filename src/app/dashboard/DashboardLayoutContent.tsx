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

  // Generate initials dynamically from name (e.g., "Saad Saleem" -> "SS")
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const initials = getInitials(userName);

  const navItems = [
    { name: 'Executive Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Client Parties Directory', href: '/dashboard/parties', icon: Users },
    { name: 'Import Clearance (GD)', href: '/dashboard/imports', icon: ArrowDownLeft },
    { name: 'Analysis Certificates', href: '/dashboard/analysis', icon: FileCheck2 },
    { name: 'Export Shipping Bills', href: '/dashboard/exports', icon: ArrowUpRight },
    { name: 'IOR Audit Engine', href: '/dashboard/reconciliation', icon: Scale },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden relative">
      
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Enterprise Dark Sidebar */}
      <aside 
        className={`fixed md:relative inset-y-0 left-0 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 shadow-2xl z-50 transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${isSidebarOpen ? 'md:w-64' : 'md:w-20'}`}
      >
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className={`flex items-center gap-3 overflow-hidden ${!isSidebarOpen && 'md:justify-center md:w-full'}`}>
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/20 ring-1 ring-white/20 shrink-0">
              CC
            </div>
            {(isSidebarOpen || isMobileMenuOpen) && (
              <div className="transition-opacity duration-200 truncate">
                <h1 className="text-sm font-extrabold text-white tracking-wider uppercase flex items-center gap-1.5">
                  HASH ERP
                </h1>
                <p className="text-[10px] font-medium text-slate-400">Customs &amp; Freight Hub</p>
              </div>
            )}
          </div>

          {/* Close button for mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop Toggle Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`hidden md:flex p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition shadow-md border border-slate-700/60 shrink-0 cursor-pointer ${
              !isSidebarOpen && 'absolute -right-3.5 top-6 z-30'
            }`}
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {(isSidebarOpen || isMobileMenuOpen) && (
            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
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
                className={`group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20 ring-1 ring-white/10'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
                title={!isSidebarOpen ? item.name : undefined}
              >
                <div className={`flex items-center gap-3 ${!isSidebarOpen && 'md:justify-center md:w-full'}`}>
                  <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  {(isSidebarOpen || isMobileMenuOpen) && <span className="truncate">{item.name}</span>}
                </div>
                {(isSidebarOpen || isMobileMenuOpen) && isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70 shrink-0" />}

                {/* Tooltip when collapsed */}
                {!isSidebarOpen && (
                  <div className="hidden md:group-hover:block absolute left-full ml-3 px-3 py-1.5 bg-slate-900 border border-slate-700 text-white text-xs rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* System Health Card */}
        {(isSidebarOpen || isMobileMenuOpen) ? (
          <div className="p-3 m-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> WeBOC Portal
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                LIVE
              </span>
            </div>
            <p className="text-[10px] text-slate-400">IOCO Matrix API Engine Online</p>
          </div>
        ) : (
          <div className="hidden md:flex justify-center py-3" title="WeBOC Portal Live">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse block shadow-lg shadow-emerald-500/50"></span>
          </div>
        )}

        {/* User Account Bar with Dynamic Name and Logout */}
        <div className={`p-3.5 border-t border-slate-800/80 flex items-center justify-between bg-slate-900/50 ${!isSidebarOpen && 'md:justify-center'}`}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center ring-2 ring-slate-800 shrink-0">
              {initials}
            </div>
            {(isSidebarOpen || isMobileMenuOpen) && (
              <div className="text-xs truncate">
                <span className="font-bold text-slate-200 block truncate">{userName}</span>
                <span className="text-[10px] text-slate-400 font-mono">{userRole.replace('_', ' ')}</span>
              </div>
            )}
          </div>

          {/* Logout Button */}
          {(isSidebarOpen || isMobileMenuOpen) ? (
            <button
              onClick={async () => {
                await fetch('/api/v1/auth/logout', { method: 'POST' });
                window.location.href = '/';
              }}
              className="p-2 rounded-xl bg-red-950/40 text-red-400 hover:bg-red-900/60 hover:text-white transition border border-red-800/40 cursor-pointer"
              title="Secure Logout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          ) : (
            <button
              onClick={async () => {
                await fetch('/api/v1/auth/logout', { method: 'POST' });
                window.location.href = '/';
              }}
              className="hidden md:flex p-2 rounded-xl bg-red-950/40 text-red-400 hover:bg-red-900/60 hover:text-white transition border border-red-800/40 cursor-pointer"
              title="Secure Logout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-hidden">
        <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
              title="Open Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold text-slate-400 truncate">
              <span className="hidden sm:inline">Enterprise Environment</span>
              <span className="hidden sm:inline">/</span>
              <span className="text-slate-200 font-bold truncate">Pakistan Customs Clearance Hub</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">{children}</main>
      </div>
    </div>
  );
}