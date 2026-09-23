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
  Download
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this EFS Client Party?')) return;
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
    }
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
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans p-4 sm:p-6 text-slate-100">
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
        ::-webkit-scrollbar-track { background: #020617; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 9999px; }
        ::-webkit-scrollbar-thumb:hover { background: #64748b; }
      `}</style>

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
            <Building2 className="w-3.5 h-3.5" /> Master Data Directory &bull; Client Parties
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">EFS Authorized Client Parties</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage registered EFS holder companies, authorization certificate numbers, and addresses.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({ companyName: '', ntn: '', address: '' });
            setIsAddModalOpen(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition cursor-pointer flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Add New EFS Party
        </button>
      </div>

      {/* Search Filter */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Company Name or EFS Certificate #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>
      </div>

      {/* Parties Grid Cards */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs">Loading EFS Parties...</div>
      ) : parties.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center text-slate-400 text-xs">
          No EFS client parties registered yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {parties.map((party) => (
            <div 
              key={party.id} 
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between gap-6 hover:border-slate-700 transition"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-950/40 border border-purple-800/50 px-2.5 py-1 rounded-lg">
                    {party.partyCode}
                  </span>
                  
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <button
                      onClick={() => handleViewImports(party)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg border border-emerald-500/30 transition text-[11px] font-semibold cursor-pointer"
                      title="View Party Imports"
                    >
                      <Download className="w-3.5 h-3.5" /> Imports
                    </button>
                    <button
                      onClick={() => handleViewExports(party)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg border border-blue-500/30 transition text-[11px] font-semibold cursor-pointer"
                      title="View Party Exports"
                    >
                      <FileText className="w-3.5 h-3.5" /> Exports
                    </button>
                    <button
                      onClick={() => openEditModal(party)}
                      className="p-1.5 bg-slate-800 hover:bg-blue-600/20 text-slate-300 hover:text-blue-400 rounded-lg border border-slate-700 transition cursor-pointer"
                      title="Edit Party"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(party.id)}
                      className="p-1.5 bg-slate-800 hover:bg-rose-600/20 text-slate-300 hover:text-rose-400 rounded-lg border border-slate-700 transition cursor-pointer"
                      title="Delete Party"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-black text-white">{party.companyName}</h3>
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-blue-400 shadow-inner">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                    EFS Cert: {party.ntn}
                  </div>
                </div>

                <div className="flex items-start gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{party.address || 'No address specified'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Party Imports Modal */}
      {viewingPartyImports && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl text-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4 shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">Imports History for {viewingPartyImports.party.companyName}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Certificate: {viewingPartyImports.party.ntn}</p>
              </div>
              <button
                onClick={() => setViewingPartyImports(null)}
                className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {importsLoading ? (
              <div className="text-center py-12 text-slate-400 text-xs">Loading imports...</div>
            ) : viewingPartyImports.imports.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs bg-slate-950 rounded-xl border border-slate-800">
                No import records found for this party.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-xl shadow-sm bg-slate-950 flex-1 overflow-y-auto">
                <table className="min-w-full divide-y divide-slate-800 text-xs">
                  <thead className="bg-slate-900 text-slate-300 font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left">Sr #</th>
                      <th className="px-4 py-3 text-left">Import GD Number</th>
                      <th className="px-4 py-3 text-left">Items Count</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {viewingPartyImports.imports.map((rec: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-900/50 transition">
                        <td className="px-4 py-3 font-semibold text-slate-400">{i + 1}</td>
                        <td className="px-4 py-3 font-mono font-bold text-emerald-400">{rec.gdNumber}</td>
                        <td className="px-4 py-3">
                          <span className="bg-slate-800 text-slate-200 px-2.5 py-1 rounded-md font-semibold">
                            {rec.items?.length || 0} items
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setSelectedGdItems({ items: rec.items, gdNumber: rec.gdNumber, partyName: viewingPartyImports.party.companyName, type: 'import' })}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
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
                className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Party Exports Modal */}
      {viewingPartyExports && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl text-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4 shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">Exports History for {viewingPartyExports.party.companyName}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Certificate: {viewingPartyExports.party.ntn}</p>
              </div>
              <button
                onClick={() => setViewingPartyExports(null)}
                className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {exportsLoading ? (
              <div className="text-center py-12 text-slate-400 text-xs">Loading exports...</div>
            ) : viewingPartyExports.exports.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs bg-slate-950 rounded-xl border border-slate-800">
                No export records found for this party.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-xl shadow-sm bg-slate-950 flex-1 overflow-y-auto">
                <table className="min-w-full divide-y divide-slate-800 text-xs">
                  <thead className="bg-slate-900 text-slate-300 font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left">Sr #</th>
                      <th className="px-4 py-3 text-left">Export GD Number</th>
                      <th className="px-4 py-3 text-left">Items Count</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {viewingPartyExports.exports.map((rec: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-900/50 transition">
                        <td className="px-4 py-3 font-semibold text-slate-400">{i + 1}</td>
                        <td className="px-4 py-3 font-mono font-bold text-blue-400">{rec.exportGdNumber}</td>
                        <td className="px-4 py-3">
                          <span className="bg-slate-800 text-slate-200 px-2.5 py-1 rounded-md font-semibold">
                            {rec.items?.length || 0} items
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setSelectedGdItems({ items: rec.items, gdNumber: rec.exportGdNumber, partyName: viewingPartyExports.party.companyName, type: 'export' })}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
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
                className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Items Modal with Print Layout */}
      {selectedGdItems && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div id="printable-modal" className="bg-gray-900 border border-gray-700 rounded-2xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl text-gray-100 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  {selectedGdItems.type === 'import' ? 'Import GD Items Details' : 'Export GD Items Details'}
                </h3>
                {selectedGdItems.partyName && (
                  <p className="text-xs text-blue-400 font-semibold mt-1">Party: {selectedGdItems.partyName}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1.5 no-print cursor-pointer"
                >
                  🖨️ Print Items
                </button>
                <button
                  onClick={() => setSelectedGdItems(null)}
                  className="text-gray-400 hover:text-white font-bold text-lg bg-gray-800 px-3 py-1 rounded-lg no-print cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-gray-700 rounded-xl shadow-sm bg-gray-800">
              <table className="min-w-full divide-y divide-gray-700 text-sm">
                <thead className="bg-gray-900 text-gray-300 font-semibold">
                  <tr>
                    <th className="px-4 py-3 text-left">Sr #</th>
                    <th className="px-4 py-3 text-left">
                      {selectedGdItems.type === 'import' ? 'Import GD Number' : 'Export GD Number'}
                    </th>
                    <th className="px-4 py-3 text-left">Particulars</th>
                    <th className="px-4 py-3 text-left">HS Code</th>
                    <th className="px-4 py-3 text-right">Quantity</th>
                    <th className="px-4 py-3 text-left">UOM</th>
                    <th className="px-4 py-3 text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700 text-gray-200">
                  {selectedGdItems.items.map((item: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-750 transition">
                      <td className="px-4 py-3 font-semibold text-gray-400">{item.serialNo || i + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-400">{selectedGdItems.gdNumber}</td>
                      <td className="px-4 py-3 font-medium text-white">
                        {selectedGdItems.type === 'import' ? item.itemDescription : item.exportParticulars}
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {selectedGdItems.type === 'import' ? item.hsCode : item.exportHsCode}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-200">
                        {formatNumber(selectedGdItems.type === 'import' ? item.quantity : item.qtyOfExports, 0)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-300">{item.uom || item.unit || 'KG'}</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-200">
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
                className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-5 py-2.5 rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Party Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 w-full max-w-lg overflow-hidden font-sans">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Register EFS Client Party</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Al-Karim Enterprises"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">EFS Authorization Certificate Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EFS-3192084-7"
                  value={formData.ntn}
                  onChange={(e) => setFormData({ ...formData, ntn: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Address *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Enter business address..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition disabled:opacity-50 cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 w-full max-w-lg overflow-hidden font-sans">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Edit EFS Client Party</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4 text-xs">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">EFS Authorization Certificate Number *</label>
                <input
                  type="text"
                  required
                  value={formData.ntn}
                  onChange={(e) => setFormData({ ...formData, ntn: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Address *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition disabled:opacity-50 cursor-pointer"
                >
                  {submitLoading ? 'Updating...' : 'Update EFS Party'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}