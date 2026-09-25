'use client';

import React from 'react';
import ExportGdForm from '@/components/ExportGdForm';

export default function ImportsPage() {
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

      <div className="space-y-2">
        <h1 className="text-3xl font-black text-blue-600 tracking-tight">Exports Management</h1>
        <p className="text-base text-slate-900 font-bold">
          Manage your Exports GD records, auto-excel uploads, and manual entries seamlessly.
        </p>
      </div>

      <ExportGdForm />
    </div>
  );
}