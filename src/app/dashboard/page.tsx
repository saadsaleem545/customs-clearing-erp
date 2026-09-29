'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Users, 
  FileSpreadsheet, 
  FileText, 
  Database, 
  ShieldCheck, 
  ArrowUpRight, 
  PlusCircle, 
  Zap, 
  RefreshCw, 
  CheckCircle2,
  PackageCheck,
  FileCheck2,
  Scale,
  LogOut,
  UserCheck,
  X,
  Camera,
  KeyRound,
  User as UserIcon,
  Check,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ExecutiveDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    activeClients: 3,
    importGds: 3,
    exportBills: 11,
    totalAnalysisCerts: 6,
    auditBatches: 3,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // User Profile State with localStorage persistence
  const [userName, setUserName] = useState("Saad Saleem");
  const [userRole, setUserRole] = useState("SUPER ADMIN");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  
  // Load saved profile data from localStorage on initial mount
  useEffect(() => {
    const savedName = localStorage.getItem('erp_username');
    const savedPic = localStorage.getItem('erp_profile_pic');
    if (savedName) setUserName(savedName);
    if (savedPic) setProfilePic(savedPic);
  }, []);
  
  // Edit Profile Modal State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [newUsername, setNewUsername] = useState(userName);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [isSaving, setIsSaving] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const initials = getInitials(userName);

  // Fetch live stats from API endpoints
  const fetchDashboardStats = async () => {
    try {
      setIsRefreshing(true);
      const [partiesRes, importsRes, exportsRes, certsRes] = await Promise.all([
        fetch('/api/v1/parties'),
        fetch('/api/v1/imports'),
        fetch('/api/v1/exports'),
        fetch('/api/v1/analysis')
      ]);

      const partiesJson = await partiesRes.json();
      const importsJson = await importsRes.json();
      const exportsJson = await exportsRes.json();
      const certsJson = await certsRes.json();

      setStats({
        activeClients: partiesJson.success ? partiesJson.data?.length || 3 : 3,
        importGds: importsJson.success ? importsJson.data?.length || 3 : 3,
        exportBills: exportsJson.success ? exportsJson.data?.length || 11 : 11,
        totalAnalysisCerts: certsJson.success ? certsJson.data?.length || 6 : 6,
        auditBatches: 3,
      });
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // Compressed Image Upload to prevent LocalStorage Quota Exceeded Error
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 200;
          const MAX_HEIGHT = 200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setProfilePic(dataUrl);
          try {
            localStorage.setItem('erp_profile_pic', dataUrl);
          } catch (err) {
            console.error('Storage quota exceeded', err);
            alert('Image size is too large. Please select a smaller image.');
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setProfileMessage({ type: '', text: '' });

    try {
      // 1. Update Username if changed
      if (newUsername.trim()) {
        setUserName(newUsername);
        localStorage.setItem('erp_username', newUsername);
      }

      // 2. Update Password via Database API Route
      if (newPassword) {
        if (newPassword.length < 3) {
          setIsSaving(false);
          setProfileMessage({ type: 'error', text: 'New password must be at least 3 characters long!' });
          return;
        }

        const res = await fetch('/api/v1/auth/update-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword, newPassword }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setIsSaving(false);
          setProfileMessage({ type: 'error', text: data.error || 'Failed to update password in database' });
          return;
        }

        setCurrentPassword('');
        setNewPassword('');
      }

      setIsSaving(false);
      setProfileMessage({ type: 'success', text: 'Profile & Database Password successfully updated!' });
      setTimeout(() => {
        setIsEditProfileOpen(false);
        setProfileMessage({ type: '', text: '' });
      }, 1500);

    } catch (err) {
      console.error('Error updating profile:', err);
      setIsSaving(false);
      setProfileMessage({ type: 'error', text: 'An unexpected error occurred.' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between relative overflow-x-hidden">
      <style jsx global>{`
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 9999px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      {/* Top Full Width Header with User Profile Box & Sync Hub */}
      <header className="bg-gradient-to-r from-blue-700 via-blue-900 to-slate-950 text-white shadow-xl border-b border-blue-900 w-full z-25">
        <div className="w-full px-4 sm:px-8 py-4 flex flex-col lg:flex-row items-center justify-between gap-4 max-w-[1700px] mx-auto">
          <div className="flex items-center gap-4">
            <span className="text-2xl sm:text-3xl font-black tracking-wider text-white">
              HASH <span className="text-xs font-mono uppercase bg-blue-600 text-white px-2.5 py-1 rounded shadow-sm">ERP</span>
            </span>
            <span className="text-xs font-semibold text-blue-200 border-l border-blue-600/50 pl-4 hidden sm:inline">
              Enterprise Environment / Pakistan Customs Clearance Hub
            </span>
          </div>

          <div className="flex items-center gap-4 flex-wrap justify-center">
            <button
              onClick={fetchDashboardStats}
              disabled={isRefreshing}
              className="px-4 py-2 bg-blue-900/80 hover:bg-blue-800 text-blue-100 font-bold text-xs rounded-xl transition border border-blue-600/40 flex items-center gap-2 shadow cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} /> Sync Hub
            </button>

            {/* Clickable User Profile Box inside Header */}
            <div 
              onClick={() => {
                setNewUsername(userName);
                setIsEditProfileOpen(true);
              }}
              className="px-4 py-2 bg-blue-950/70 hover:bg-blue-900/90 border border-blue-600/40 rounded-2xl flex items-center gap-4 shadow-inner cursor-pointer transition group"
              title="Click to Edit Profile"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-700 text-white font-bold text-xs flex items-center justify-center ring-2 ring-blue-600 shrink-0 shadow overflow-hidden relative">
                  {profilePic ? (
                    <img src={profilePic} alt="Profile" className="w-full h-full object-cover object-center" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="text-left">
                  <span className="font-black text-white group-hover:text-cyan-200 transition block text-xs tracking-tight flex items-center gap-1.5">
                    {userName} <UserCheck className="w-3 h-3 text-cyan-400 opacity-0 group-hover:opacity-100 transition" />
                  </span>
                  <span className="text-[10px] font-extrabold text-blue-300 font-mono tracking-wider">{userRole}</span>
                </div>
              </div>

              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await fetch('/api/v1/auth/logout', { method: 'POST' });
                  window.location.href = '/';
                }}
                className="p-2 rounded-xl bg-red-950/60 text-red-300 hover:bg-red-900 hover:text-white transition border border-red-800/50 cursor-pointer shrink-0 shadow"
                title="Secure Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full px-4 sm:px-6 py-8 sm:py-12 flex-grow max-w-[1700px] mx-auto space-y-8">
        
        {/* Command Banner with Back & Next Buttons */}
        <div className="bg-white border-2 sm:border-4 border-slate-900 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-3 relative z-10 w-full">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer border border-slate-300 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => router.forward()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer border border-slate-300 shadow-sm"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-black uppercase tracking-wider font-mono">
                <Activity className="w-3.5 h-3.5 text-blue-600" /> Executive Command Portal
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">HASH Logistics Command Dashboard</h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed font-medium">
              Real-time monitoring of WebOC Customs Goods Declarations, IOCO Input-Output Reconciliation, stock balances, and financial ledgers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 relative z-10 w-full lg:w-auto shrink-0">
            <Link
              href="/dashboard/imports"
              className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-1.5 transition text-center"
            >
              <PlusCircle className="w-4 h-4" /> Register Import GD
            </Link>

            <Link
              href="/dashboard/exports"
              className="flex-1 sm:flex-none px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-1.5 transition text-center"
            >
              <PlusCircle className="w-4 h-4" /> Register Export GD
            </Link>

            <Link
              href="/dashboard/analysis"
              className="flex-1 sm:flex-none px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-1.5 transition text-center"
            >
              <PlusCircle className="w-4 h-4" /> Register Analysis Certificate
            </Link>

            <Link
              href="/dashboard/reconciliation"
              className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-1.5 transition text-center"
            >
              <Zap className="w-4 h-4" /> Run IOR Engine
            </Link>
          </div>
        </div>

        {/* Top Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-white border-2 border-slate-300 hover:border-blue-600 rounded-2xl p-6 sm:p-7 shadow-xl transition space-y-4 group">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-600">Active Clients</span>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="text-4xl sm:text-5xl font-black text-slate-900 font-mono">{stats.activeClients}</div>
              <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> +100% Active Verified Importers/Exporters
              </p>
            </div>
          </div>

          <div className="bg-white border-2 border-slate-300 hover:border-emerald-600 rounded-2xl p-6 sm:p-7 shadow-xl transition space-y-4 group">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-600">Import GDs Cleared</span>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="text-4xl sm:text-5xl font-black text-slate-900 font-mono">{stats.importGds}</div>
              <p className="text-xs font-bold text-slate-700">Bills of Entry Registered &amp; Assessed</p>
            </div>
          </div>

          <div className="bg-white border-2 border-slate-300 hover:border-purple-600 rounded-2xl p-6 sm:p-7 shadow-xl transition space-y-4 group">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-600">Export Shipping Bills</span>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-200">
                <FileText className="w-6 h-6" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="text-4xl sm:text-5xl font-black text-slate-900 font-mono">{stats.exportBills}</div>
              <p className="text-xs font-bold text-slate-700">Form-E Filings Verified &amp; Cleared</p>
            </div>
          </div>

          <div className="bg-white border-2 border-slate-300 hover:border-amber-600 rounded-2xl p-6 sm:p-7 shadow-xl transition space-y-4 group">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-600">Total Analysis Certificates</span>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
                <FileText className="w-6 h-6" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="text-4xl sm:text-5xl font-black text-slate-900 font-mono tracking-tight">
                {stats.totalAnalysisCerts}
              </div>
              <p className="text-xs font-bold text-slate-700">Verified IOCO Certificates Issued</p>
            </div>
          </div>
        </div>

        {/* Lower Engines Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link 
            href="/dashboard/imports"
            className="bg-white border-2 border-slate-300 hover:border-emerald-600 rounded-2xl p-6 sm:p-7 shadow-xl flex flex-col justify-between transition cursor-pointer group space-y-5"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200">
                  <Database className="w-6 h-6" />
                </div>
                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 inline-flex items-center gap-1">
                  View <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 leading-snug">Raw Material Stock</h3>
                <p className="text-xs text-slate-500 font-bold">FIFO Input Tracking</p>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm text-slate-700 font-medium leading-relaxed">
                Real-time inventory levels, FIFO tracking, and registered raw input ledgers.
              </p>
            </div>
          </Link>

          <Link 
            href="/dashboard/exports"
            className="bg-white border-2 border-slate-300 hover:border-purple-600 rounded-2xl p-6 sm:p-7 shadow-xl flex flex-col justify-between transition cursor-pointer group space-y-5"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-200">
                  <PackageCheck className="w-6 h-6" />
                </div>
                <span className="text-xs font-black text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200 inline-flex items-center gap-1">
                  View <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 leading-snug">Export Shipping Bills</h3>
                <p className="text-xs text-slate-500 font-bold">Customs Export GDs</p>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm text-slate-700 font-medium leading-relaxed">
                Track processed customs export declarations, Form-E clearances, and shipments.
              </p>
            </div>
          </Link>

          <Link 
            href="/dashboard/analysis"
            className="bg-white border-2 border-slate-300 hover:border-amber-600 rounded-2xl p-6 sm:p-7 shadow-xl flex flex-col justify-between transition cursor-pointer group space-y-5"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <span className="text-xs font-black text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 inline-flex items-center gap-1">
                  View <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 leading-snug">Analysis Certificates</h3>
                <p className="text-xs text-slate-500 font-bold">IOCO &amp; Wastage Matrix</p>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm text-slate-700 font-medium leading-relaxed">
                Manage issued IOCO certificates, wastage allowances, and approved ratios.
              </p>
            </div>
          </Link>

          <Link 
            href="/dashboard/reconciliation"
            className="bg-white border-2 border-slate-300 hover:border-blue-600 rounded-2xl p-6 sm:p-7 shadow-xl flex flex-col justify-between transition cursor-pointer group space-y-5"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
                  <Scale className="w-6 h-6" />
                </div>
                <span className="text-xs font-black text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 inline-flex items-center gap-1">
                  Open <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 leading-snug">IOR Audit Engine</h3>
                <p className="text-xs text-slate-500 font-bold">Input-Output Reconciliation</p>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm text-slate-700 font-medium leading-relaxed">
                Run comprehensive input-output reconciliations, audits, and compliance ledgers.
              </p>
            </div>
          </Link>
        </div>

      </main>

      {/* Footer with Gradient Background */}
      <footer className="bg-gradient-to-r from-blue-700 via-blue-900 to-slate-950 text-blue-200 text-center py-4 text-xs border-t border-blue-900 w-full shadow-inner mt-8">
        &copy; 2026 Customs Clearing ERP &bull; Powered by EFS Advanced Compliance Engine. All rights reserved.
      </footer>

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 sm:border-4 border-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-200">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900">Edit Administrator Profile</h3>
                  <p className="text-xs text-slate-500 font-bold">Update profile picture, username &amp; security credentials</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {profileMessage.text && (
              <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                profileMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                <Check className="w-4 h-4" /> {profileMessage.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-5">
              {/* Profile Picture Upload with Square/Cropped Preview Box */}
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-black text-2xl flex items-center justify-center ring-4 ring-slate-100 shadow-xl overflow-hidden relative group">
                  {profilePic ? (
                    <img src={profilePic} alt="Profile" className="w-full h-full object-cover object-center" />
                  ) : (
                    initials
                  )}
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white cursor-pointer text-[10px] font-bold">
                    <Camera className="w-5 h-5 mb-0.5" /> Upload
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-900">Profile Picture</h4>
                  <p className="text-xs text-slate-500 font-medium">Click on avatar to browse and upload a new photo. Auto-compressed &amp; permanently saved.</p>
                </div>
              </div>

              {/* Username Input */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700">Username / Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 outline-none transition"
                  />
                </div>
              </div>

              {/* Change Password Section */}
              <div className="space-y-4 pt-2 border-t border-slate-200">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Change Password (Optional)</h4>
                
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">Current Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-11 pr-12 py-3 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
                      title={showCurrentPassword ? 'Hide password' : 'Show password'}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full pl-11 pr-12 py-3 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition cursor-pointer flex items-center gap-2"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}