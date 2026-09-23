'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Loader2, CheckCircle2, ShieldCheck, FileText, CreditCard, Activity } from 'lucide-react';
import Link from 'next/link';

export default function WeBocLandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Login failed');
      }

      // Successful login hone par dashboard par bhej dein
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between">
      
      {/* --- TOP WEENOC STYLE HEADER WITH LOGIN BAR --- */}
      <header className="bg-slate-900 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black tracking-wider text-white">
              HASH <span className="text-xs font-mono uppercase bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-700/50">Customs ERP</span>
            </span>
          </div>

          {/* Top Login Form (WeBoc Style) */}
          <div className="flex flex-col items-end">
            <form onSubmit={handleLogin} className="flex items-center gap-2 flex-wrap">
              {error && <span className="text-xs text-red-400 font-medium mr-2">{error}</span>}
              
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  placeholder="Enter Email / User ID"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-48"
                />
              </div>

              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-36"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg transition shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Login
              </button>
            </form>
            
            {/* Register link added right below the login form */}
            <div className="text-[11px] text-slate-400 mt-1 mr-1">
              Don't have an account? <Link href="/register" className="text-cyan-400 font-bold hover:underline">Register Admin</Link>
            </div>
          </div>

        </div>        
      </header>

      {/* --- HERO SECTION --- */}
      <main className="max-w-6xl mx-auto px-4 py-12 flex-grow flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-cyan-950/60 border border-cyan-700/50 text-cyan-300 px-3 py-1 rounded-full text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-cyan-400" /> Authorized Secure Portal
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight">
              Web Based <br /><span className="text-cyan-400">One Customs ERP</span>
            </h1>
            
            <p className="text-slate-400 text-sm leading-relaxed">
              Since inception, this platform has been playing a pivotal role in facilitating Traders, Custom Officers, and Clearing Agents. Streamline GD clearance, automated IOCO consumption, and inventory tracking seamlessly.
            </p>

            <div className="pt-2 flex flex-col gap-3">
              <div className="flex items-center gap-3 text-xs text-slate-300 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> Paperless Declarations &amp; Import/Export Ledgers
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> Autogenerated EFS Reconciliation
              </div>
            </div>
          </div>

          {/* Right Visual Card */}
          <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-inner space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Activity className="w-4 h-4" /> System Quick Modules
            </h3>
            
            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="font-semibold text-white">Import &amp; Export GDs</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="font-semibold text-white">Analysis Certificates</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="font-semibold text-white">IOCO Analysis &amp; Wastage</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 text-center pt-2">
              Use your admin credentials on the top right bar to sign in.
            </p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-center py-4 text-xs text-slate-500">
        &copy; 2026 Customs Clearing ERP &bull; Powered by EFS Advanced Compliance Engine. All rights reserved.
      </footer>

    </div>
  );
}