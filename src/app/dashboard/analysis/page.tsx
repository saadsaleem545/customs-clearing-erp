'use client';

import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, CheckCircle2, Filter, Search, Trash2, Printer, Plus } from 'lucide-react';
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

  // Manual Item Form States (Sirf zaroori fields)
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
    
    // Clear inputs
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

  const handleDeleteCertificate = async (id: string, certNo: string) => {
    if (!confirm(`Are you sure you want to delete Analysis Certificate: ${certNo}?`)) return;

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
    }
  };

  const handlePrintCertificate = (certId: string) => {
    setPrintingCertId(certId);
    setTimeout(() => {
      window.print();
      setPrintingCertId(null);
    }, 100);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans text-xs text-slate-100 p-4 sm:p-6">
      <style jsx global>{`
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

        @media print {
          body * {
            visibility: hidden;
          }
          .printable-cert-card, .printable-cert-card * {
            visibility: visible;
          }
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
            font-size: 10px !important;
          }
          th {
            background-color: #f1f5f9 !important;
          }
        }
      `}</style>

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="text-emerald-400 font-bold uppercase tracking-wider mb-1">EFS Compliance &bull; IOCO Engine</div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Analysis Certificate Manager</h1>
          <p className="text-slate-400 mt-1 text-xs sm:text-sm">Upload EFS Excel document or add items manually, and manage party-wise certificates.</p>
        </div>
      </div>

      {/* Upload & Manual Entry Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4 border-b border-slate-800">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Select Party / Importer *</label>
            <select
              value={selectedPartyId}
              onChange={(e) => setSelectedPartyId(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:border-emerald-500 outline-none text-xs sm:text-sm"
            >
              <option value="">-- Choose Party --</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>{p.companyName} ({p.ntn})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Upload Excel Document (.xlsx)</label>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Analysis Certificate Number *</label>
            <input
              type="text"
              placeholder="Auto-extracted or Type manually"
              value={certNumber}
              onChange={(e) => setCertNumber(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:border-emerald-500 outline-none text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* Manual Item Entry Form (Clean & Simple) */}
        <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add Item Manually
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">HS Code *</label>
              <input
                type="text"
                placeholder="e.g. 5206.1300"
                value={hsCodeInput}
                onChange={(e) => setHsCodeInput(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono text-xs focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="lg:col-span-1">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Item Description *</label>
              <input
                type="text"
                placeholder="e.g. 100% COTTON YARN"
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">UOM</label>
              <input
                type="text"
                placeholder="KG"
                value={uomInput}
                onChange={(e) => setUomInput(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:border-emerald-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Requirement Qty *</label>
              <input
                type="number"
                step="any"
                placeholder="0.0"
                value={reqQtyInput}
                onChange={(e) => setReqQtyInput(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:border-emerald-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Wastage Qty (KG)</label>
              <input
                type="number"
                step="any"
                placeholder="0.0"
                value={wastQtyInput}
                onChange={(e) => setWastQtyInput(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:border-emerald-500 outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleAddManualItem}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Item to Matrix
            </button>
          </div>
        </div>

        {parsedItems.length > 0 && (
          <div className="border border-slate-800 rounded-xl overflow-hidden mt-4">
            <div className="bg-slate-950 px-4 py-2.5 text-slate-400 font-bold uppercase text-[10px] flex justify-between items-center border-b border-slate-800">
              <span>Certificate Items Matrix Preview</span>
              <span className="text-emerald-400 font-mono">Total Items: {parsedItems.length}</span>
            </div>
            <div className="max-h-[350px] overflow-y-auto">
              <table className="w-full text-left font-mono">
                <thead className="bg-slate-950/90 border-b border-slate-800 text-slate-500 text-[10px] sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                    <th className="p-2.5">S.No</th>
                    <th className="p-2.5">HS Code</th>
                    <th className="p-2.5">Item Description</th>
                    <th className="p-2.5">UOM</th>
                    <th className="p-2.5 text-right">Requirement</th>
                    <th className="p-2.5 text-right">Wastage (KG)</th>
                    <th className="p-2.5 text-right">Input w/ Wastage</th>
                    <th className="p-2.5 text-right">Wastage %</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  {parsedItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="p-2.5">{item.serialNo}</td>
                      <td className="p-2.5 text-blue-400">{item.hsCode}</td>
                      <td className="p-2.5 font-bold">{item.itemDescription}</td>
                      <td className="p-2.5">{item.uom}</td>
                      <td className="p-2.5 text-right text-emerald-400 font-bold">{item.requirementQty}</td>
                      <td className="p-2.5 text-right">{item.wastageQty}</td>
                      <td className="p-2.5 text-right text-amber-400 font-bold">{item.inputWithWastage}</td>
                      <td className="p-2.5 text-right">{item.wastagePct}%</td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveParsedItem(idx)}
                          className="p-1 bg-red-950/60 hover:bg-red-900 text-red-300 rounded transition cursor-pointer"
                          title="Remove Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveCertificate}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/25 disabled:opacity-50 text-xs sm:text-sm cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Certificate & All Items'}
          </button>
        </div>
      </div>

      {/* Saved Certificates Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-800 pb-4 no-print">
          <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">Saved Party Analysis Certificates</h3>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex items-center w-full sm:w-auto">
              <Search className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                type="text"
                placeholder="Search Certificate No..."
                value={searchCertNo}
                onChange={(e) => setSearchCertNo(e.target.value)}
                className="w-full sm:w-52 pl-9 pr-3 py-2.5 sm:py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-mono focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-400 shrink-0" />
              <select
                value={filterPartyId}
                onChange={(e) => setFilterPartyId(e.target.value)}
                className="w-full sm:w-auto p-2.5 sm:p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:border-emerald-500 outline-none"
              >
                <option value="">-- All Parties --</option>
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>{p.companyName}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {certificates.length === 0 ? (
            <p className="text-slate-500 italic text-center py-6">No analysis certificates found matching your search or filter.</p>
          ) : (
            certificates.map((cert) => (
              <div 
                key={cert.id} 
                className={`bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 shadow-inner ${printingCertId === cert.id ? 'printable-cert-card' : ''}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 font-sans">
                  <div>
                    <span className="text-emerald-400 font-bold text-xs sm:text-sm font-mono block sm:inline">{cert.certificateNumber}</span>
                    <span className="text-slate-400 sm:ml-3 block sm:inline text-xs">Party: <strong className="text-white">{cert.party?.companyName}</strong></span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2.5">
                    <span className="text-[10px] text-slate-500 font-mono no-print">Items: {cert.items?.length || 0} &bull; {new Date(cert.createdAt).toLocaleDateString()}</span>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedMobileCertItems({ items: cert.items, certNumber: cert.certificateNumber, partyName: cert.party?.companyName })}
                        className="block sm:hidden bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition shadow cursor-pointer no-print"
                      >
                        View Items
                      </button>

                      <button
                        onClick={() => handlePrintCertificate(cert.id)}
                        className="flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/30 transition text-[11px] font-semibold cursor-pointer no-print"
                        title="Print Certificate"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print
                      </button>

                      <button
                        onClick={() => handleDeleteCertificate(cert.id, cert.certificateNumber)}
                        className="flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg border border-red-500/30 transition text-[11px] font-semibold cursor-pointer no-print"
                        title="Delete Certificate"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="hidden sm:block max-h-[280px] overflow-y-auto">
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead className="text-slate-500 border-b border-slate-900 sticky top-0 bg-slate-950 z-10">
                      <tr>
                        <th className="py-2 px-3">S.No</th>
                        <th className="py-2 px-3">HS Code</th>
                        <th className="py-2 px-3">Item Description</th>
                        <th className="py-2 px-3">UOM</th>
                        <th className="py-2 px-3 text-right">Requirement</th>
                        <th className="py-2 px-3 text-right">Wastage (KG)</th>
                        <th className="py-2 px-3 text-right">Input w/ Wastage</th>
                        <th className="py-2 px-3 text-right">Wastage %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-slate-300">
                      {cert.items.map((i: any) => (
                        <tr key={i.id} className="hover:bg-slate-900/60 transition">
                          <td className="py-2 px-3">{i.serialNo}</td>
                          <td className="py-2 px-3 text-blue-400">{i.hsCode}</td>
                          <td className="py-2 px-3 font-bold">{i.itemDescription}</td>
                          <td className="py-2 px-3">{i.uom}</td>
                          <td className="py-2 px-3 text-right text-emerald-400 font-bold">{Number(i.requirementQty)}</td>
                          <td className="py-2 px-3 text-right">{Number(i.wastageQty)}</td>
                          <td className="py-2 px-3 text-right text-amber-400 font-bold">{Number(i.inputWithWastage)}</td>
                          <td className="py-2 px-3 text-right">{Number(i.wastagePct)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="block sm:hidden text-slate-400 text-[11px]">
                  <span>Tap <strong>View Items</strong> to inspect full item breakdown matrix.</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedMobileCertItems && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl text-slate-100 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">Certificate Items Details</h3>
                <p className="text-xs text-emerald-400 font-mono mt-0.5">{selectedMobileCertItems.certNumber}</p>
                {selectedMobileCertItems.partyName && (
                  <p className="text-xs text-slate-400 mt-0.5">Party: {selectedMobileCertItems.partyName}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedMobileCertItems(null)}
                className="text-slate-400 hover:text-white font-bold text-lg bg-slate-800 px-3 py-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-700 rounded-xl shadow-sm bg-slate-800">
              <table className="min-w-full divide-y divide-slate-700 text-xs font-mono">
                <thead className="bg-slate-900 text-slate-300 font-semibold">
                  <tr>
                    <th className="px-3 py-2.5 text-left">S.No</th>
                    <th className="px-3 py-2.5 text-left">HS Code</th>
                    <th className="px-3 py-2.5 text-left">Description</th>
                    <th className="px-3 py-2.5 text-left">UOM</th>
                    <th className="px-3 py-2.5 text-right">Req</th>
                    <th className="px-3 py-2.5 text-right">Wastage</th>
                    <th className="px-3 py-2.5 text-right">Input</th>
                    <th className="px-3 py-2.5 text-right">Wast%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700 text-slate-200">
                  {selectedMobileCertItems.items.map((item: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-750 transition">
                      <td className="px-3 py-2.5">{item.serialNo || i + 1}</td>
                      <td className="px-3 py-2.5 text-blue-400">{item.hsCode}</td>
                      <td className="px-3 py-2.5 font-bold text-white">{item.itemDescription}</td>
                      <td className="px-3 py-2.5">{item.uom || 'KG'}</td>
                      <td className="px-3 py-2.5 text-right text-emerald-400 font-bold">{Number(item.requirementQty)}</td>
                      <td className="px-3 py-2.5 text-right">{Number(item.wastageQty)}</td>
                      <td className="px-3 py-2.5 text-right text-amber-400 font-bold">{Number(item.inputWithWastage)}</td>
                      <td className="px-3 py-2.5 text-right">{Number(item.wastagePct)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={() => setSelectedMobileCertItems(null)}
                className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-5 py-2.5 rounded-xl transition cursor-pointer text-xs"
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