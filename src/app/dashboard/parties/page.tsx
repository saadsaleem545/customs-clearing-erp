'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  X, 
  MapPin, 
  ShieldCheck,
  FileText,
  Download,
  Users,
  RefreshCw
} from 'lucide-react';

interface Party {
  id: string;
  partyCode: string;
  companyName: string;
  ntn: string;
  address: string;
  city: string;
}

export default function PartiesPage() {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);

  // Custom Professional Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // View Party Exports Modal State
  const [viewingPartyExports, setViewingPartyExports] = useState<{ party: Party; exports: any[] } | null>(null);
  const [exportsLoading, setExportsLoading] = useState(false);

  // View Party Imports Modal State
  const [viewingPartyImports, setViewingPartyImports] = useState<{ party: Party; imports: any[] } | null>(null);
  const [importsLoading, setImportsLoading] = useState(false);

  // Selected GD Items Modal State (with print layout support)
  const [selectedGdItems, setSelectedGdItems] = useState<{ items: any[]; gdNumber: string; partyName?: string; type?: 'export' | 'import' } | null>(null);
  
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    companyName: '',
    ntn: '',
    address: '',
  });

  const formatNumber = (val: number, decimals: number = 2) => {
    if (isNaN(val) || val === null) return '0';
    return Number(val).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });
  };

  const fetchParties = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/parties?search=${encodeURIComponent(searchTerm)}`);
      const result = await res.json();
      if (result.success) {
        setParties(result.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParties();
  }, [searchTerm]);

  const handleViewExports = async (party: Party) => {
    setExportsLoading(true);
    setViewingPartyExports({ party, exports: [] });
    try {
      const res = await fetch(`/api/v1/exports?partyId=${party.id}`);
      const json = await res.json();
      if (json.success) {
        setViewingPartyExports({ party, exports: json.data });
      }
    } catch (err) {
      console.error('Error fetching party exports:', err);
    } finally {
      setExportsLoading(false);
    }
  };

  const handleViewImports = async (party: Party) => {
    setImportsLoading(true);
    setViewingPartyImports({ party, imports: [] });
    try {
      const res = await fetch(`/api/v1/imports?partyId=${party.id}`);
      const json = await res.json();
      if (json.success) {
        setViewingPartyImports({ party, imports: json.data });
      }
    } catch (err) {
      console.error('Error fetching party imports:', err);
    } finally {
      setImportsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/v1/parties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (!result.success) {
        setErrorMessage(result.error || 'Failed to create party.');
        return;
      }
      setIsAddModalOpen(false);
      setFormData({ companyName: '', ntn: '', address: '' });
      fetchParties();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParty) return;
    setSubmitLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch(`/api/v1/parties/${selectedParty.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (!result.success) {
        setErrorMessage(result.error || 'Failed to update party.');
        return;
      }
      setIsEditModalOpen(false);
      setSelectedParty(null);
      setFormData({ companyName: '', ntn: '', address: '' });
      fetchParties();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete EFS Client Party',
      message: 'Are you sure you want to delete this EFS Client Party?',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/parties/${id}`, {
            method: 'DELETE',
          });
          const result = await res.json();
          if (result.success) {
            fetchParties();
          } else {
            alert(result.error || 'Failed to delete party.');
          }
        } catch (err) {
          console.error(err);
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const openEditModal = (party: Party) => {
    setSelectedParty(party);
    setFormData({
      companyName: party.companyName,
      ntn: party.ntn,
      address: party.address || '',
    });
    setIsEditModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between p-6 space-y-8 max-w-[1700px] mx-auto overflow-x-hidden">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-modal, #printable-modal * {
            visibility: visible;
          }
          #printable-modal {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-height: none !important;
            overflow: visible !important;
            background: white !important;
            color: black !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #cbd5e1 !important;
            color: black !important;
            padding: 8px 10px !important;
            font-size: 11px !important;
          }
          th {
            background-color: #f1f5f9 !important;
          }
        }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 9999px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      {/* Top Banner Header with Blue Gradient Theme */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-700 via-blue-900 to-slate-950 p-8 text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-blue-100 text-xs font-black uppercase tracking-wider">
              <Users className="w-4 h-4 text-cyan-400" /> Master Data Directory &bull; Client Parties
            </div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white">EFS Authorized Client Parties</h1>
            <p className="text-sm text-blue-200 font-medium max-w-2xl">
              Manage registered EFS holder companies, authorization certificate numbers, and addresses.
            </p>
          </div>

          <button
            onClick={() => {
              setFormData({ companyName: '', ntn: '', address: '' });
              setIsAddModalOpen(true);
            }}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" /> Add New EFS Party
          </button>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-xl flex items-center gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Search by Company Name or EFS Certificate #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 placeholder:font-normal"
          />
        </div>
        <div className="px-4 py-3.5 bg-slate-100 rounded-xl text-xs font-black text-slate-700 uppercase tracking-wider border border-slate-200 shrink-0">
          Total Parties: <span className="text-blue-600 font-mono text-sm">{parties.length}</span>
        </div>
      </div>

      {/* Parties Grid Cards */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 font-bold text-sm">Loading EFS Parties...</div>
      ) : parties.length === 0 ? (
        <div className="bg-white border-2 border-slate-300 rounded-2xl p-16 text-center shadow-xl space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-200">
            <Building2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900">No EFS Client Parties Found</h3>
          <p className="text-sm text-slate-500 font-medium max-w-md mx-auto">
            No EFS client parties registered yet. Click &quot;Add New EFS Party&quot; to add a new client.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {parties.map((party) => (
            <div 
              key={party.id} 
              className="bg-white border-2 border-slate-300 hover:border-blue-600 rounded-2xl shadow-xl transition overflow-hidden group flex flex-col justify-between"
            >
              <div className="p-6 sm:p-7 space-y-5">
                {/* Top Row: Party Code & All Action Buttons Wrap-Fixed */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-4 gap-2 flex-wrap">
                  <span className="text-xs font-black text-purple-700 bg-purple-50 px-3 py-1 rounded-lg border border-purple-200 font-mono">
                    {party.partyCode}
                  </span>
                  
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => handleViewImports(party)}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition text-[11px] font-black uppercase tracking-wider cursor-pointer shadow-sm inline-flex items-center gap-1"
                      title="View Party Imports"
                    >
                      <Download className="w-3 h-3" /> Imp
                    </button>
                    <button
                      onClick={() => handleViewExports(party)}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition text-[11px] font-black uppercase tracking-wider cursor-pointer shadow-sm inline-flex items-center gap-1"
                      title="View Party Exports"
                    >
                      <FileText className="w-3 h-3" /> Exp
                    </button>
                    <button
                      onClick={() => openEditModal(party)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition border border-slate-200 shadow-sm cursor-pointer"
                      title="Edit Party"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(party.id)}
                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition border border-red-200 shadow-sm cursor-pointer"
                      title="Delete Party"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-blue-600 transition tracking-tight leading-snug">
                    {party.companyName}
                  </h3>
                  <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold font-mono w-full">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="truncate">EFS Cert: {party.ntn}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-xs text-slate-700 font-medium bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2 leading-relaxed font-bold">{party.address || 'No address specified'}</span>
                </div>
              </div>

              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="font-black text-slate-500 uppercase tracking-wider text-[11px]">Authorized EFS Importer</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Party Imports Modal */}
      {viewingPartyImports && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-slate-900 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4 shrink-0">
              <div>
                <h3 className="text-xl font-black text-slate-900">Imports History for {viewingPartyImports.party.companyName}</h3>
                <p className="text-xs text-emerald-700 font-black mt-1 font-mono">Certificate: {viewingPartyImports.party.ntn}</p>
              </div>
              <button
                onClick={() => setViewingPartyImports(null)}
                className="text-slate-600 hover:text-slate-900 font-bold text-lg bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            {importsLoading ? (
              <div className="text-center py-12 text-slate-500 font-bold text-xs">Loading imports...</div>
            ) : viewingPartyImports.imports.length === 0 ? (
              <div className="text-center py-12 text-slate-500 font-bold text-xs bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
                No import records found for this party.
              </div>
            ) : (
              <div className="overflow-x-auto border-2 border-slate-200 rounded-2xl shadow-sm bg-white flex-1 overflow-y-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
                  <thead className="bg-slate-900 text-white font-black uppercase text-[11px] tracking-wider sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3.5 text-left">Sr #</th>
                      <th className="px-4 py-3.5 text-left">Import GD Number</th>
                      <th className="px-4 py-3.5 text-left">Items Count</th>
                      <th className="px-4 py-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                    {viewingPartyImports.imports.map((rec: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3.5 font-bold text-slate-500">{i + 1}</td>
                        <td className="px-4 py-3.5 font-mono text-xs font-black text-emerald-700">{rec.gdNumber}</td>
                        <td className="px-4 py-3.5">
                          <span className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-lg text-xs font-black font-mono">
                            {rec.items?.length || 0} items
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => setSelectedGdItems({ items: rec.items, gdNumber: rec.gdNumber, partyName: viewingPartyImports.party.companyName, type: 'import' })}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl transition cursor-pointer shadow"
                          >
                            View Items
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 text-right shrink-0">
              <button
                onClick={() => setViewingPartyImports(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Party Exports Modal */}
      {viewingPartyExports && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-slate-900 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4 shrink-0">
              <div>
                <h3 className="text-xl font-black text-slate-900">Exports History for {viewingPartyExports.party.companyName}</h3>
                <p className="text-xs text-blue-700 font-black mt-1 font-mono">Certificate: {viewingPartyExports.party.ntn}</p>
              </div>
              <button
                onClick={() => setViewingPartyExports(null)}
                className="text-slate-600 hover:text-slate-900 font-bold text-lg bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            {exportsLoading ? (
              <div className="text-center py-12 text-slate-500 font-bold text-xs">Loading exports...</div>
            ) : viewingPartyExports.exports.length === 0 ? (
              <div className="text-center py-12 text-slate-500 font-bold text-xs bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
                No export records found for this party.
              </div>
            ) : (
              <div className="overflow-x-auto border-2 border-slate-200 rounded-2xl shadow-sm bg-white flex-1 overflow-y-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
                  <thead className="bg-slate-900 text-white font-black uppercase text-[11px] tracking-wider sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3.5 text-left">Sr #</th>
                      <th className="px-4 py-3.5 text-left">Export GD Number</th>
                      <th className="px-4 py-3.5 text-left">Items Count</th>
                      <th className="px-4 py-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                    {viewingPartyExports.exports.map((rec: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3.5 font-bold text-slate-500">{i + 1}</td>
                        <td className="px-4 py-3.5 font-mono text-xs font-black text-blue-700">{rec.exportGdNumber}</td>
                        <td className="px-4 py-3.5">
                          <span className="bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-lg text-xs font-black font-mono">
                            {rec.items?.length || 0} items
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => setSelectedGdItems({ items: rec.items, gdNumber: rec.exportGdNumber, partyName: viewingPartyExports.party.companyName, type: 'export' })}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl transition cursor-pointer shadow"
                          >
                            View Items
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 text-right shrink-0">
              <button
                onClick={() => setViewingPartyExports(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Items Modal with Print Layout */}
      {selectedGdItems && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div id="printable-modal" className="bg-white border-4 border-slate-900 rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  {selectedGdItems.type === 'import' ? 'Import GD Items Details' : 'Export GD Items Details'}
                </h3>
                {selectedGdItems.partyName && (
                  <p className="text-xs text-blue-700 font-black mt-1">Party: {selectedGdItems.partyName}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 no-print cursor-pointer shadow"
                >
                  🖨️ Print Items
                </button>
                <button
                  onClick={() => setSelectedGdItems(null)}
                  className="text-slate-600 hover:text-slate-900 font-bold text-lg bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl no-print cursor-pointer transition"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border-2 border-slate-200 rounded-2xl shadow-sm bg-white">
              <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
                <thead className="bg-slate-900 text-white font-black uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5 text-left">Sr #</th>
                    <th className="px-4 py-3.5 text-left">
                      {selectedGdItems.type === 'import' ? 'Import GD Number' : 'Export GD Number'}
                    </th>
                    <th className="px-4 py-3.5 text-left">Particulars</th>
                    <th className="px-4 py-3.5 text-left">HS Code</th>
                    <th className="px-4 py-3.5 text-right">Quantity</th>
                    <th className="px-4 py-3.5 text-left">UOM</th>
                    <th className="px-4 py-3.5 text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                  {selectedGdItems.items.map((item: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3.5 font-bold text-slate-500">{item.serialNo || i + 1}</td>
                      <td className="px-4 py-3.5 font-mono text-xs font-black text-blue-700">{selectedGdItems.gdNumber}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        {selectedGdItems.type === 'import' ? item.itemDescription : item.exportParticulars}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-mono">
                        {selectedGdItems.type === 'import' ? item.hsCode : item.exportHsCode}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">
                        {formatNumber(selectedGdItems.type === 'import' ? item.quantity : item.qtyOfExports, 0)}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-700">{item.uom || item.unit || 'KG'}</td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">
                        {formatNumber(selectedGdItems.type === 'import' ? item.importValueVal : item.valueOfeExports, 2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 text-right no-print">
              <button
                onClick={() => setSelectedGdItems(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Party Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-slate-900 rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6 relative animate-in fade-in zoom-in duration-200 font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-200">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Register EFS Client Party</h3>
                  <p className="text-xs text-slate-500 font-bold">Add authorized company details &amp; certificate</p>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-5 text-xs">
              {errorMessage && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 font-bold">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-2">
                <label className="block font-black uppercase tracking-wider text-slate-700">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Al-Karim Enterprises"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 outline-none transition"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-black uppercase tracking-wider text-slate-700">EFS Authorization Certificate Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EFS-3192084-7"
                  value={formData.ntn}
                  onChange={(e) => setFormData({ ...formData, ntn: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 outline-none transition font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-black uppercase tracking-wider text-slate-700">Address *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Enter business address..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 outline-none transition resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/30 transition cursor-pointer disabled:opacity-50"
                >
                  {submitLoading ? 'Saving...' : 'Save EFS Party'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Party Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-slate-900 rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6 relative animate-in fade-in zoom-in duration-200 font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-200">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Edit EFS Client Party</h3>
                  <p className="text-xs text-slate-500 font-bold">Update authorized company details</p>
                </div>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-5 text-xs">
              {errorMessage && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 font-bold">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-2">
                <label className="block font-black uppercase tracking-wider text-slate-700">Company Name *</label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 outline-none transition"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-black uppercase tracking-wider text-slate-700">EFS Authorization Certificate Number *</label>
                <input
                  type="text"
                  required
                  value={formData.ntn}
                  onChange={(e) => setFormData({ ...formData, ntn: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 outline-none transition font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-black uppercase tracking-wider text-slate-700">Address *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-sm font-bold text-slate-900 outline-none transition resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/30 transition cursor-pointer disabled:opacity-50"
                >
                  {submitLoading ? 'Updating...' : 'Update EFS Party'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM PROFESSIONAL CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white border-2 sm:border-4 border-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">{confirmModal.title}</h3>
              <p className="text-xs sm:text-sm font-bold text-slate-600">{confirmModal.message}</p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer border border-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow transition cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer with Gradient Background */}
      <footer className="bg-gradient-to-r from-blue-700 via-blue-900 to-slate-950 text-blue-200 text-center py-4 text-xs border-t border-blue-900 w-full shadow-inner rounded-2xl">
        &copy; 2026 Customs Clearing ERP &bull; Powered by EFS Advanced Compliance Engine. All rights reserved.
      </footer>
    </div>
  );
}