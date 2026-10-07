'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  ArrowRight, 
  Lock, 
  Mail, 
  Activity,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle,
  KeyRound,
  ArrowLeft
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
  // Auth Views: 'login' | 'forgot_email' | 'forgot_otp' | 'forgot_new_pass'
  const [authView, setAuthView] = useState<'login' | 'forgot_email' | 'forgot_otp' | 'forgot_new_pass'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const validateEmailFormat = (emailStr: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(emailStr);
  };

  const validateStrongPassword = (pass: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(pass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (authView === 'login') {
      if (!email || !password) {
        setError('Please enter both email and password.');
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          localStorage.setItem('isLoggedIn', 'true');
          router.push('/dashboard');
        } else {
          setError(data.message || 'Invalid credentials or inactive account.');
        }
      } catch (err) {
        setError('A server connection error occurred.');
      } finally {
        setIsLoading(false);
      }
    } 
    else if (authView === 'forgot_email') {
      if (!email || !validateEmailFormat(email)) {
        setError('Please enter a valid registered email address.');
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch('/api/v1/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setSuccessMsg('Verification OTP has been sent to your email address.');
          setAuthView('forgot_otp');
        } else {
          setError(data.message || 'Failed to send OTP to email.');
        }
      } catch (err) {
        setError('A server connection error occurred.');
      } finally {
        setIsLoading(false);
      }
    }
    else if (authView === 'forgot_otp') {
      if (!otpCode || otpCode.length < 4) {
        setError('Please enter a valid verification OTP code.');
        return;
      }
      setSuccessMsg('OTP verified successfully! Please set your new password.');
      setAuthView('forgot_new_pass');
    }
    else if (authView === 'forgot_new_pass') {
      if (!validateStrongPassword(newPassword)) {
        setError('Password must be at least 8 characters long and include 1 uppercase, 1 lowercase, 1 number, and 1 special character.');
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setError('Passwords do not match. Please verify.');
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch('/api/v1/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp: otpCode, newPassword }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setSuccessMsg('Password successfully reset! Please sign in with your new password.');
          setAuthView('login');
          setPassword('');
          setNewPassword('');
          setConfirmNewPassword('');
          setOtpCode('');
        } else {
          setError(data.message || 'Failed to reset password.');
        }
      } catch (err) {
        setError('A server connection error occurred.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col lg:flex-row font-sans selection:bg-blue-600 selection:text-white bg-slate-950 overflow-x-hidden">
      
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
        <div className="relative z-10 my-8 lg:my-0 space-y-4 lg:space-y-6 max-w-2xl">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-none">
            Digital Customs Clearing that keeps your logistics moving.
          </h2>
          
          <p className="text-xs sm:text-sm lg:text-base text-slate-300 leading-relaxed font-medium">
            Manage importer/exporter parties, Goods Declarations (GD), IOCO input-output consumption matrices, analysis certificates, and automated audit reconciliations from one secure enterprise workspace.
          </p>

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

        <div className="relative z-10 pt-4 border-t border-white/10 text-xs text-slate-400 font-medium flex items-center justify-between">
          <span>Secure access for authorized logistics teams only.</span>
        </div>
      </div>

      {/* Right Side: Admin Sign In Card Area */}
      <div className="lg:w-5/12 bg-slate-50 flex items-center justify-center p-4 sm:p-8 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 relative my-auto">
          
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {authView === 'login' && 'Admin Sign In'}
              {authView === 'forgot_email' && 'Reset Password'}
              {authView === 'forgot_otp' && 'Enter Verification OTP'}
              {authView === 'forgot_new_pass' && 'Set New Password'}
            </h3>
            <p className="text-xs text-slate-600 font-semibold leading-relaxed">
              {authView === 'login' && 'Sign in with your authorized admin account to continue.'}
              {authView === 'forgot_email' && 'Enter your registered email address to receive a password reset OTP.'}
              {authView === 'forgot_otp' && 'Enter the 6-digit verification code sent to your email.'}
              {authView === 'forgot_new_pass' && 'Please enter and confirm your new secure password.'}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-700 text-xs font-semibold">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            
            {/* EMAIL FIELD (Login & Forgot Email) */}
            {(authView === 'login' || authView === 'forgot_email') && (
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-800">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs sm:text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>
              </div>
            )}

            {/* PASSWORD FIELD (Login) */}
            {authView === 'login' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-800">Password</label>
                  <button
                    type="button"
                    onClick={() => { setAuthView('forgot_email'); setError(''); setSuccessMsg(''); }}
                    className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-11 pr-10 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs sm:text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 placeholder:font-normal"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* OTP ENTER VIEW */}
            {authView === 'forgot_otp' && (
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-800">Verification OTP Code</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-sm font-bold tracking-widest text-slate-900 outline-none transition placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>
              </div>
            )}

            {/* NEW PASSWORD RESET VIEW */}
            {authView === 'forgot_new_pass' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-800">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs sm:text-sm font-bold text-slate-900 outline-none transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-800">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs sm:text-sm font-bold text-slate-900 outline-none transition"
                  />
                </div>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-70 mt-3"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  {authView === 'login' && 'Sign in securely'}
                  {authView === 'forgot_email' && 'Send Reset OTP'}
                  {authView === 'forgot_otp' && 'Verify OTP Code'}
                  {authView === 'forgot_new_pass' && 'Update Password'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* BACK TO LOGIN LINK */}
            {authView !== 'login' && (
              <button
                type="button"
                onClick={() => { setAuthView('login'); setError(''); setSuccessMsg(''); }}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 pt-2 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </button>
            )}
          </form>

          <div className="text-center pt-3 border-t border-slate-100">
            <p className="text-[11px] text-slate-600 font-bold">
              Need access? Contact your organization administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}