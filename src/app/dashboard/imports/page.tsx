'use client';

import React from 'react';
import ImportGdForm from '@/components/ImportGdForm';

export default function ImportsPage() {
  return (
    <div className="p-6 text-slate-100 min-h-screen max-w-[1700px] mx-auto font-sans">
      {/* Custom Sleek Scrollbars Styling */}
      <style dangerouslySetInnerHTML={{
        __html: `
          ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          ::-webkit-scrollbar-track {
            background: #020617;
          }
          ::-webkit-scrollbar-thumb {
            background: #334155;
            border-radius: 9999px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #64748b;
          }
        `
      }} />

      <div className="mb-6">
        <h1 className="text-3xl font-black text-white">Imports Management</h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your import GD records, auto-excel uploads, and manual entries seamlessly.
        </p>
      </div>

      <ImportGdForm />
    </div>
  );
} 