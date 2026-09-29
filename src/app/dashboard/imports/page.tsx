'use client';

import React from 'react';
import ImportGdForm from '@/components/ImportGdForm';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';

export default function ImportsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between p-6 space-y-8 max-w-[1700px] mx-auto">
      {/* Custom Sleek Scrollbars Styling */}
      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 9999px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

      {/* Top Banner Header with Back & Next Buttons */}
      <div className="bg-white border-2 sm:border-4 border-slate-900 rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-700 via-blue-900 to-slate-950 p-5 sm:p-8 text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl transition cursor-pointer border border-white/20 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => router.forward()}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl transition cursor-pointer border border-white/20 shadow-sm"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-blue-100 text-xs sm:text-sm font-black uppercase tracking-wider">
                <ArrowUpRight className="w-4 h-4 text-cyan-400" /> EFS Advanced Compliance &bull; Imports Module
              </div>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">Imports Management</h1>
            <p className="text-sm sm:text-base text-blue-200 font-medium max-w-3xl">
              Manage your import GD records, auto-excel uploads, and manual entries seamlessly.
            </p>
          </div>
        </div>
      </div>

      <ImportGdForm />
    </div>
  );
}