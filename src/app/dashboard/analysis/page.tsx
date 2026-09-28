'use client';

import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, CheckCircle2, Filter, Search, Trash2, Printer, Plus, ShieldCheck } from 'lucide-react';
import * as XLSX from 'xlsx';

interface CertItem {
  serialNo: number;
  hsCode: string;
  itemDescription: string;
  uom: string;
  requirementQty: number;
  wastageQty: number;
  inputWithWastage: number;
  wastagePct: number;
}

export default function AnalysisCertificatePage() {
  const [parties, setParties] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [certNumber, setCertNumber] = useState('');
  const [parsedItems, setParsedItems] = useState<CertItem[]>([]);
  
  const [filterPartyId, setFilterPartyId] = useState('');
  const [searchCertNo, setSearchCertNo] = useState('');

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

  // Manual Item Form States
  const [hsCodeInput, setHsCodeInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [uomInput, setUomInput] = useState('KG');
  const [reqQtyInput, setReqQtyInput] = useState('');
  const [wastQtyInput, setWastQtyInput] = useState('');

  const [printingCertId, setPrintingCertId] = useState<string | null>(null);
  const [selectedMobileCertItems, setSelectedMobileCertItems] = useState<{ items: any[]; certNumber: string; partyName?: string } | null>(null);

  useEffect(() => {
    fetchPartiesAndCerts();
  }, [filterPartyId, searchCertNo]);

  const fetchPartiesAndCerts = async () => {
    try {
      const pRes = await fetch('/api/v1/parties');
      const pData = await pRes.json();
      if (pData.success) setParties(pData.data);

      const params = new URLSearchParams();
      if (filterPartyId) params.append('partyId', filterPartyId);
      if (searchCertNo) params.append('certNumber', searchCertNo);

      const url = `/api/v1/analysis${params.toString() ? `?${params.toString()}` : ''}`;
      const cRes = await fetch(url);
      const cData = await cRes.json();
      if (cData.success) setCertificates(cData.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        let detectedCertNo = '';
        let extractedItems: CertItem[] = [];
        let startIndex = -1;

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          for (let j = 0; j < row.length; j++) {
            const val = String(row[j] || '').trim();
            if (val.toUpperCase().includes('KEXP') || val.toUpperCase().includes('KPQE') || val.includes('-')) {
              if (val.length > 10 && !detectedCertNo) {
                detectedCertNo = val;
              }
            }
            if (val.toUpperCase() === 'HS CODE') {
              startIndex = i + 1;
            }
          }
        }

        if (startIndex !== -1) {
          let sNoCounter = parsedItems.length + 1;
          for (let i = startIndex; i < data.length; i++) {
            const row = data[i];
            const hsCode = String(row[0] || '').trim();
            const desc = String(row[1] || '').trim();
            const uom = String(row[2] || 'KG').trim();
            const reqQty = parseFloat(row[3]) || 0;
            const wastQty = parseFloat(row[4]) || 0;
            const inputWast = parseFloat(row[5]) || (reqQty + wastQty);
            const wastPct = parseFloat(row[6]) || (reqQty > 0 ? Number(((wastQty / reqQty) * 100).toFixed(4)) : 0);

            if (hsCode && desc) {
              extractedItems.push({
                serialNo: sNoCounter++,
                hsCode,
                itemDescription: desc,
                uom,
                requirementQty: reqQty,
                wastageQty: wastQty,
                inputWithWastage: inputWast,
                wastagePct: wastPct,
              });
            }
          }
        }

        if (detectedCertNo && !certNumber) setCertNumber(detectedCertNo);

        if (extractedItems.length > 0) {
          setParsedItems(prev => [...prev, ...extractedItems]);
          alert(`Success! Extracted ${extractedItems.length} items.`);
        } else {
          alert('Could not parse items automatically.');
        }
      } catch (err) {
        console.error(err);
        alert('Error parsing Excel file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleAddManualItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hsCodeInput || !descInput || !reqQtyInput) {
      alert('Please fill in HS Code, Item Description, and Requirement Qty.');
      return;
    }

    const reqQty = parseFloat(reqQtyInput) || 0;
    const wastQty = parseFloat(wastQtyInput) || 0;
    const inputWast = reqQty + wastQty;
    const wastPct = reqQty > 0 ? Number(((wastQty / reqQty) * 100).toFixed(4)) : 0;

    const newItem: CertItem = {
      serialNo: parsedItems.length + 1,
      hsCode: hsCodeInput.trim(),
      itemDescription: descInput.trim(),
      uom: uomInput.trim() || 'KG',
      requirementQty: reqQty,
      wastageQty: wastQty,
      inputWithWastage: inputWast,
      wastagePct: wastPct,
    };

    setParsedItems(prev => [...prev, newItem]);
    setHsCodeInput('');
    setDescInput('');
    setReqQtyInput('');
    setWastQtyInput('');
  };

  const handleRemoveParsedItem = (index: number) => {
    setParsedItems(prev => prev.filter((_, i) => i !== index).map((item, idx) => ({ ...item, serialNo: idx + 1 })));
  };

  const handleSaveCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartyId || !certNumber || parsedItems.length === 0) {
      alert('Please select a Party, enter Certificate Number, and ensure items are added.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificateNumber: certNumber,
          partyId: selectedPartyId,
          items: parsedItems,
        }),
      });

      const result = await res.json();
      if (result.success) {
        alert('Analysis Certificate saved successfully!');
        setCertNumber('');
        setParsedItems([]);
        fetchPartiesAndCerts();
      } else {
        alert(result.error || 'Failed to save certificate');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCertificate = (id: string, certNo: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Analysis Certificate',
      message: `Are you sure you want to delete Analysis Certificate: ${certNo}?`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/analysis?id=${id}`, {
            method: 'DELETE',
          });
          const result = await res.json();
          if (result.success) {
            alert('Analysis Certificate deleted successfully.');
            fetchPartiesAndCerts();
          } else {
            alert(result.error || 'Failed to delete certificate.');
          }
        } catch (err) {
          console.error(err);
          alert('Error deleting certificate.');
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handlePrintCertificate = (certId: string) => {
    setPrintingCertId(certId);
    setTimeout(() => {
      window.print();
      setPrintingCertId(null);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between p-3 sm:p-6 space-y-6 sm:space-y-8 max-w-[1700px] mx-auto overflow-x-hidden">
      <style jsx global>{`
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 9999px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        @media print {
          body * { visibility: hidden; }
          .printable-cert-card, .printable-cert-card * { visibility: visible; }
          .printable-cert-card {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            border: none !important;
            box-shadow: none !important;
            padding: 20px !important;
            margin: 0 !important;
          }
          .no-print { display: none !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border: 1px solid #cbd5e1 !important; color: black !important; padding: 8px 10px !important; font-size: 10px !important; }
          th { background-color: #f1f5f9 !important; }
        }
      `}</style>

      {/* Top Banner Header with Blue Gradient Theme */}
      <div className="bg-white border-2 sm:border-4 border-slate-900 rounded-2xl shadow-xl overflow-hidden no-print">
        <div className="bg-gradient-to-r from-blue-700 via-blue-900 to-slate-950 p-5 sm:p-8 text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-blue-100 text-xs sm:text-sm font-black uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-cyan-400" /> EFS Compliance &bull; IOCO Engine
            </div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">Analysis Certificate Manager</h1>
            <p className="text-sm sm:text-base text-blue-200 font-medium max-w-2xl">
              Upload EFS Excel document or add items manually, and manage party-wise certificates.
            </p>
          </div>
        </div>
      </div>

      {/* Upload & Manual Entry Section */}
      <div className="bg-white border-2 sm:border-4 border-slate-900 rounded-2xl p-4 sm:p-8 shadow-xl space-y-6 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pb-6 border-b border-slate-200">
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">Select Party / Importer *</label>
            <select
              value={selectedPartyId}
              onChange={(e) => setSelectedPartyId(e.target.value)}
              className="w-full p-3.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 shadow-sm"
            >
              <option value="">-- Choose Party --</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>{p.companyName} ({p.ntn})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">Upload Excel Document (.xlsx)</label>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="w-full text-slate-700 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer text-xs font-semibold bg-slate-50 border-2 border-slate-300 rounded-xl p-1.5"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">Analysis Certificate Number *</label>
            <input
              type="text"
              placeholder="Auto-extracted or Type manually"
              value={certNumber}
              onChange={(e) => setCertNumber(e.target.value)}
              className="w-full p-3.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 font-mono focus:outline-none focus:border-blue-600 shadow-sm"
            />
          </div>
        </div>

        {/* Manual Item Entry Form */}
        <div className="bg-slate-50 border-2 border-slate-300 p-4 sm:p-5 rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-600" /> Add Item Manually to Matrix
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div className="space-y-1.5">
              <label className="block text-[11px] text-slate-600 uppercase font-black">HS Code *</label>
              <input
                type="text"
                placeholder="e.g. 5206.1300"
                value={hsCodeInput}
                onChange={(e) => setHsCodeInput(e.target.value)}
                className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 font-mono focus:outline-none focus:border-blue-600"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] text-slate-600 uppercase font-black">Item Description *</label>
              <input
                type="text"
                placeholder="e.g. 100% COTTON YARN"
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
                className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] text-slate-600 uppercase font-black">UOM</label>
              <input
                type="text"
                placeholder="KG"
                value={uomInput}
                onChange={(e) => setUomInput(e.target.value)}
                className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 font-mono text-center focus:outline-none focus:border-blue-600"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] text-slate-600 uppercase font-black">Requirement Qty *</label>
              <input
                type="number"
                step="any"
                placeholder="0.0"
                value={reqQtyInput}
                onChange={(e) => setReqQtyInput(e.target.value)}
                className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-black text-slate-900 font-mono focus:outline-none focus:border-blue-600"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] text-slate-600 uppercase font-black">Wastage Qty (KG)</label>
              <input
                type="number"
                step="any"
                placeholder="0.0"
                value={wastQtyInput}
                onChange={(e) => setWastQtyInput(e.target.value)}
                className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-black text-slate-900 font-mono focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleAddManualItem}
              className="w-full sm:w-auto px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl transition shadow cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Item to Matrix
            </button>
          </div>
        </div>

        {parsedItems.length > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-base sm:text-lg font-black text-slate-900">Certificate Items Matrix Preview</h3>
              <span className="text-xs sm:text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-300 font-mono">Total Items: {parsedItems.length}</span>
            </div>
            <div className="overflow-x-auto border-2 border-slate-300 rounded-2xl shadow-sm bg-white max-h-[350px]">
              <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm font-mono">
                <thead className="bg-slate-900 text-white font-black uppercase text-[11px] sm:text-xs tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3.5 text-left">S.No</th>
                    <th className="px-4 py-3.5 text-left">HS Code</th>
                    <th className="px-4 py-3.5 text-left">Item Description</th>
                    <th className="px-4 py-3.5 text-left">UOM</th>
                    <th className="px-4 py-3.5 text-right">Requirement</th>
                    <th className="px-4 py-3.5 text-right">Wastage (KG)</th>
                    <th className="px-4 py-3.5 text-right">Input w/ Wastage</th>
                    <th className="px-4 py-3.5 text-right">Wastage %</th>
                    <th className="px-4 py-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                  {parsedItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3.5 font-bold">{item.serialNo}</td>
                      <td className="px-4 py-3.5 text-blue-700 font-black">{item.hsCode}</td>
                      <td className="px-4 py-3.5 font-black text-slate-900">{item.itemDescription}</td>
                      <td className="px-4 py-3.5 font-black">{item.uom}</td>
                      <td className="px-4 py-3.5 text-right text-emerald-700 font-black">{item.requirementQty}</td>
                      <td className="px-4 py-3.5 text-right font-black">{item.wastageQty}</td>
                      <td className="px-4 py-3.5 text-right text-amber-700 font-black">{item.inputWithWastage}</td>
                      <td className="px-4 py-3.5 text-right font-black">{item.wastagePct}%</td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveParsedItem(idx)}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition cursor-pointer"
                          title="Remove Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleSaveCertificate}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider py-3.5 sm:py-4 rounded-2xl transition shadow-xl shadow-blue-600/25 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          <CheckCircle2 className="w-5 h-5" /> {loading ? 'Saving...' : 'Save Certificate & All Items'}
        </button>
      </div>

      {/* Saved Certificates Section */}
      <div className="bg-white border-2 sm:border-4 border-slate-900 rounded-2xl p-4 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 pb-5 no-print">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Saved Party Analysis Certificates</h3>
            <p className="text-xs sm:text-sm text-slate-500 font-bold mt-0.5">Total {certificates.length} certificates saved in system</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
            <div className="relative flex items-center w-full sm:w-auto">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                type="text"
                placeholder="Search Certificate No..."
                value={searchCertNo}
                onChange={(e) => setSearchCertNo(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
              />
            </div>

            <select
              value={filterPartyId}
              onChange={(e) => setFilterPartyId(e.target.value)}
              className="p-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 shadow-sm cursor-pointer"
            >
              <option value="">-- All Parties --</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>{p.companyName}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {certificates.length === 0 ? (
            <p className="text-slate-500 text-sm py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 font-bold">
              No analysis certificates found matching your search or filter.
            </p>
          ) : (
            certificates.map((cert) => (
              <div 
                key={cert.id} 
                className={`bg-slate-50 border-2 sm:border-4 border-slate-900 rounded-2xl p-4 sm:p-6 shadow-md space-y-4 ${printingCertId === cert.id ? 'printable-cert-card' : ''}`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-blue-700 font-black text-sm sm:text-base font-mono block sm:inline">{cert.certificateNumber}</span>
                    <span className="text-slate-600 sm:ml-3 block sm:inline text-xs sm:text-sm font-bold">Party: <strong className="text-slate-900 font-black">{cert.party?.companyName}</strong></span>
                  </div>
                  <div className="flex items-center justify-between lg:justify-end gap-3 flex-wrap">
                    <span className="text-xs text-slate-500 font-bold font-mono no-print">Items: {cert.items?.length || 0} &bull; {new Date(cert.createdAt).toLocaleDateString()}</span>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setSelectedMobileCertItems({ items: cert.items, certNumber: cert.certificateNumber, partyName: cert.party?.companyName })}
                        className="block sm:hidden bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider px-3.5 py-2 rounded-xl transition shadow cursor-pointer no-print"
                      >
                        View Items
                      </button>

                      <button
                        onClick={() => handlePrintCertificate(cert.id)}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 sm:px-4 py-2 rounded-xl transition text-xs font-black uppercase tracking-wider cursor-pointer no-print shadow"
                        title="Print Certificate"
                      >
                        <Printer className="w-4 h-4" /> Print
                      </button>

                      <button
                        onClick={() => handleDeleteCertificate(cert.id, cert.certificateNumber)}
                        className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3.5 sm:px-4 py-2 rounded-xl transition text-xs font-black uppercase tracking-wider cursor-pointer no-print shadow"
                        title="Delete Certificate"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="hidden sm:block max-h-[280px] overflow-y-auto border-2 border-slate-300 rounded-2xl shadow-sm bg-white">
                  <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm font-mono">
                    <thead className="bg-slate-900 text-white font-black uppercase text-[11px] sm:text-xs tracking-wider sticky top-0 z-10">
                      <tr>
                        <th className="py-3 px-4 text-left">S.No</th>
                        <th className="py-3 px-4 text-left">HS Code</th>
                        <th className="py-3 px-4 text-left">Item Description</th>
                        <th className="py-3 px-4 text-left">UOM</th>
                        <th className="py-3 px-4 text-right">Requirement</th>
                        <th className="py-3 px-4 text-right">Wastage (KG)</th>
                        <th className="py-3 px-4 text-right">Input w/ Wastage</th>
                        <th className="py-3 px-4 text-right">Wastage %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                      {cert.items.map((i: any) => (
                        <tr key={i.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4 font-bold">{i.serialNo}</td>
                          <td className="py-3 px-4 text-blue-700 font-black">{i.hsCode}</td>
                          <td className="py-3 px-4 font-black text-slate-900">{i.itemDescription}</td>
                          <td className="py-3 px-4 font-black">{i.uom}</td>
                          <td className="py-3 px-4 text-right text-emerald-700 font-black">{Number(i.requirementQty)}</td>
                          <td className="py-3 px-4 text-right font-black">{Number(i.wastageQty)}</td>
                          <td className="py-3 px-4 text-right text-amber-700 font-black">{Number(i.inputWithWastage)}</td>
                          <td className="py-3 px-4 text-right font-black">{Number(i.wastagePct)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="block sm:hidden text-slate-600 text-xs font-bold">
                  <span>Tap <strong>View Items</strong> to inspect full item breakdown matrix.</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-blue-700 via-blue-900 to-slate-950 text-blue-200 text-center py-4 text-xs sm:text-sm font-bold border-t border-blue-900 w-full shadow-inner rounded-2xl no-print">
        &copy; 2026 Customs Clearing ERP &bull; Powered by EFS Advanced Compliance Engine. All rights reserved.
      </footer>

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

      {selectedMobileCertItems && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white border-2 sm:border-4 border-slate-900 rounded-3xl max-w-5xl w-full p-4 sm:p-8 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto text-slate-900">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">Certificate Items Details</h3>
                <p className="text-xs sm:text-sm text-blue-700 font-mono font-black mt-1">{selectedMobileCertItems.certNumber}</p>
                {selectedMobileCertItems.partyName && (
                  <p className="text-xs sm:text-sm text-slate-600 font-bold mt-0.5">Party: {selectedMobileCertItems.partyName}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedMobileCertItems(null)}
                className="text-slate-600 hover:text-slate-900 font-bold text-lg bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <div className="overflow-x-auto border-2 border-slate-300 rounded-2xl shadow-sm bg-white">
              <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm font-mono">
                <thead className="bg-slate-900 text-white font-black uppercase text-[11px] sm:text-xs tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5 text-left">S.No</th>
                    <th className="px-4 py-3.5 text-left">HS Code</th>
                    <th className="px-4 py-3.5 text-left">Description</th>
                    <th className="px-4 py-3.5 text-left">UOM</th>
                    <th className="px-4 py-3.5 text-right">Req</th>
                    <th className="px-4 py-3.5 text-right">Wastage</th>
                    <th className="px-4 py-3.5 text-right">Input</th>
                    <th className="px-4 py-3.5 text-right">Wast%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                  {selectedMobileCertItems.items.map((item: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3.5 font-bold">{item.serialNo || i + 1}</td>
                      <td className="px-4 py-3.5 text-blue-700 font-black">{item.hsCode}</td>
                      <td className="px-4 py-3.5 font-black text-slate-900">{item.itemDescription}</td>
                      <td className="px-4 py-3.5 font-black">{item.uom || 'KG'}</td>
                      <td className="px-4 py-3.5 text-right text-emerald-700 font-black">{Number(item.requirementQty)}</td>
                      <td className="px-4 py-3.5 text-right font-black">{Number(item.wastageQty)}</td>
                      <td className="px-4 py-3.5 text-right text-amber-700 font-black">{Number(item.inputWithWastage)}</td>
                      <td className="px-4 py-3.5 text-right font-black">{Number(item.wastagePct)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={() => setSelectedMobileCertItems(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs sm:text-sm uppercase tracking-wider px-6 py-3 rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}