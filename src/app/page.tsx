'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  FileText, 
  ArrowRight, 
  Lock, 
  Mail, 
  Activity,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 1. Check local storage override first (for offline/demo persistence sync)
      const savedPassword = localStorage.getItem('erp_password') || localStorage.getItem('user_password');
      const savedEmail = localStorage.getItem('erp_email') || 'saad@saleem.com';

      if (savedPassword && password === savedPassword) {
        // Successful local override login
        localStorage.setItem('isLoggedIn', 'true');
        setTimeout(() => {
          router.push('/dashboard');
        }, 500);
        return;
      }

      // 2. Fallback to regular Backend API authentication route
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push('/dashboard');
      } else {
        setError(data.message || 'Invalid credentials. Please check your email or password.');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // If backend fails but password matches default or local storage, allow entry
      const savedPassword = localStorage.getItem('erp_password') || 'admin123';
      if (password === savedPassword) {
        router.push('/dashboard');
        return;
      }

      setError('An unexpected error occurred. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col lg:flex-row font-sans selection:bg-blue-600 selection:text-white bg-slate-950 overflow-hidden">
      
      {/* Left Side: Modern Dark Gradient Showcase Area */}
      <div className="lg:w-7/12 bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950 p-6 lg:p-12 flex flex-col justify-between relative overflow-hidden border-r border-blue-950">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Brand Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white rounded-2xl flex items-center justify-center font-black text-xl lg:text-2xl shadow-xl shadow-blue-500/20">
            CC
          </div>
          <div>
            <h1 className="text-lg lg:text-xl font-black text-white tracking-wider uppercase flex items-center gap-2">
              HASH <span className="text-xs font-mono bg-blue-600 text-white px-2 py-0.5 rounded shadow">ERP</span>
            </h1>
            <p className="text-xs font-medium text-blue-300">Digital Customs &amp; Freight Portal</p>
          </div>
        </div>

        {/* Center Main Value Proposition */}
        <div className="relative z-10 my-6 lg:my-0 space-y-4 lg:space-y-6 max-w-2xl">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-none">
            Digital Customs Clearing that keeps your logistics moving.
          </h2>
          
          <p className="text-xs sm:text-sm lg:text-base text-slate-300 leading-relaxed font-medium">
            Manage importer/exporter parties, Goods Declarations (GD), IOCO input-output consumption matrices, analysis certificates, and automated audit reconciliations from one secure enterprise workspace.
          </p>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-4 bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl space-y-1.5 hover:border-blue-500/50 transition">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-black text-white">Compliant Declarations</h3>
              <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                Seamless structured Goods Declarations.
              </p>
            </div>

            <div className="p-4 bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl space-y-1.5 hover:border-blue-500/50 transition">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-black text-white">Clear Workflow</h3>
              <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                Track live import/export clearances.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="relative z-10 pt-4 border-t border-white/10 text-xs text-slate-400 font-medium flex items-center justify-between">
          <span>Secure access for authorized logistics teams only.</span>
        </div>
      </div>

      {/* Right Side: Clean White Login Card Area with Larger, Bolder Fonts */}
      <div className="lg:w-5/12 bg-slate-50 flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-md bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl space-y-6 relative">
          
          <div className="space-y-1.5">
            <h3 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">Welcome back</h3>
            <p className="text-xs lg:text-sm text-slate-600 font-semibold leading-relaxed">
              Sign in with your authorized account to continue.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-xs font-semibold">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 lg:space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-800">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-2xl text-sm lg:text-base font-bold text-slate-900 outline-none transition placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-800">Password</label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-2xl text-sm lg:text-base font-bold text-slate-900 outline-none transition placeholder:text-slate-400 placeholder:font-normal"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2.5 transition cursor-pointer disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>Sign in securely <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-600 font-bold">
              Need access? Contact your organization administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}