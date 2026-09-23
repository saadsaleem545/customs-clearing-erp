'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Plus, Trash2, Save, Loader2, FileSpreadsheet, Edit3, X } from 'lucide-react';

export default function ExportGdForm() {
  const [activeTab, setActiveTab] = useState<'auto' | 'manual'>('auto');
  const [extractedPartyName, setExtractedPartyName] = useState('');
  const [parties, setParties] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [savedExports, setSavedExports] = useState<any[]>([]);
  const [selectedGdItems, setSelectedGdItems] = useState<{ items: any[]; gdNumber: string; partyName?: string } | null>(null);
  const [partyPrintModal, setPartyPrintModal] = useState<{ partyName: string; allItems: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [historySearch, setHistorySearch] = useState('');

  // Manual Form States
  const [selectedManualPartyId, setSelectedManualPartyId] = useState('');
  const [manualGdNumber, setManualGdNumber] = useState('');
  const [manualGdDate, setManualGdDate] = useState('');
  const [manualItems, setManualItems] = useState([
    { description: '', hsCode: '', quantity: '', uom: 'KG', fobValue: '' }
  ]);
  const [isSavingManual, setIsSavingManual] = useState(false);

  const formatNumber = (val: number, decimals: number = 2) => {
    if (isNaN(val) || val === null) return '0';
    return Number(val).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });
  };

  const fetchData = async () => {
    try {
      const partyRes = await fetch('/api/v1/parties');
      const partyJson = await partyRes.json();
      if (partyJson.success) {
        setParties(partyJson.data);
      }

      const res = await fetch('/api/v1/exports');
      const json = await res.json();
      if (json.success) {
        // Normalize data to prevent blank fields
        const normalizedData = (json.data || []).map((rec: any) => ({
          ...rec,
          items: (rec.items || []).map((it: any) => ({
            ...it,
            gdNumber: it.gdNumber || rec.gdNumber,
            itemDescription: it.itemDescription || it.description || it.particulars || '',
            hsCode: it.hsCode || '',
            quantity: Number(it.quantity ?? it.qty ?? 0),
            uom: it.uom || it.unit || 'KG',
            fobValueVal: Number(it.fobValueVal ?? it.fobValue ?? it.value ?? 0)
          }))
        }));
        setSavedExports(normalizedData);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[];

        let detectedExporter = 'SHIWANI TEXTILE';
        for (let r = 0; r < Math.min(data.length, 10); r++) {
          const row = data[r];
          if (row) {
            for (let c = 0; c < row.length; c++) {
              const cellVal = String(row[c] || '').trim();
              if (cellVal.toUpperCase().includes('EXPORTER') || cellVal.toUpperCase().includes('PARTY') || cellVal.toUpperCase().includes('NAME')) {
                if (row[c + 1] && String(row[c + 1]).trim().length > 2) {
                  detectedExporter = String(row[c + 1]).trim();
                  break;
                } else if (data[r + 1] && data[r + 1][c] && String(data[r + 1][c]).trim().length > 2) {
                  detectedExporter = String(data[r + 1][c]).trim();
                  break;
                }
              }
            }
          }
        }
        detectedExporter = detectedExporter.replace(/^M\/S[:\s]*/i, '').trim();
        setExtractedPartyName(detectedExporter || 'SHIWANI TEXTILE');

        const parsedItems = [];
        let currentGdNumber = '';

        for (let i = 2; i < data.length; i++) {
          const row = data[i];
          if (row && row.length > 0) {
            for (let c = 0; c < row.length; c++) {
              const val = String(row[c] || '').trim();
              if (val.length > 5 && (val.includes('-') || val.includes('EXP') || val.includes('KP') || val.includes('EX'))) {
                if (val !== 'PARTICULARS' && !val.includes('HS CODE')) {
                  currentGdNumber = val;
                  break;
                }
              }
            }

            if (!currentGdNumber && row[0]) {
              currentGdNumber = String(row[0]).trim();
            }

            let particulars = '';
            let hsCode = '';
            let qty = 0;
            let uom = 'KG';
            let value = 0;

            if (row.length >= 6) {
              particulars = String(row[1] || row[2] || '').trim();
              hsCode = String(row[2] || row[3] || '').trim();
              qty = Number(row[3] || row[4] || 0);
              uom = String(row[4] || row[5] || 'KG').trim();
              value = Number(row[5] || row[6] || 0);
            } else {
              particulars = String(row[1] || row[0] || '').trim();
            }

            if (particulars && particulars !== 'PARTICULARS' && particulars !== 'GD NO. & DATE') {
              let extractedDate = '';
              const parts = currentGdNumber.split('-');
              if (parts.length >= 3) {
                const day = parts[parts.length - 3];
                const month = parts[parts.length - 2];
                const year = parts[parts.length - 1];
                if (year && year.length === 4) {
                  extractedDate = `${year}-${month}-${day}`;
                }
              }

              parsedItems.push({
                gdNumber: currentGdNumber || 'GD-EXP-UNKNOWN',
                gdDate: extractedDate || new Date().toISOString(),
                itemDescription: particulars,
                hsCode: hsCode || '5402.3300',
                quantity: isNaN(qty) ? 0 : qty,
                uom: uom || 'KG',
                fobValueVal: isNaN(value) ? 0 : value,
                destinationCountry: 'China',
                portOfLoading: 'Port Qasim Karachi',
              });
            }
          }
        }

        setItems(parsedItems);
        setMessage(`Successfully extracted Exporter and ${parsedItems.length} unique export items matrix with GD numbers!`);
      } catch (err: any) {
        setMessage('Error parsing Excel: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleAddManualItemRow = () => {
    setManualItems(prev => [
      ...prev,
      { description: '', hsCode: '', quantity: '', uom: 'KG', fobValue: '' }
    ]);
  };

  const handleRemoveManualItemRow = (index: number) => {
    if (manualItems.length === 1) return;
    setManualItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleManualItemChange = (index: number, field: string, value: string) => {
    setManualItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleCancelManual = () => {
    setSelectedManualPartyId('');
    setManualGdNumber('');
    setManualGdDate('');
    setManualItems([{ description: '', hsCode: '', quantity: '', uom: 'KG', fobValue: '' }]);
    setActiveTab('auto');
  };

  const handleSaveManualExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedManualPartyId) {
      alert('Please select a Client Party / Exporter.');
      return;
    }
    if (!manualGdNumber.trim()) {
      alert('Please enter Export GD Number.');
      return;
    }

    try {
      setIsSavingManual(true);
      const payload = {
        partyId: selectedManualPartyId,
        gdNumber: manualGdNumber.trim(),
        gdDate: manualGdDate || new Date().toISOString(),
        destinationCountry: 'China',
        portOfLoading: 'Port Qasim Karachi',
        status: 'CLEARED',
        items: manualItems.map(item => ({
          itemDescription: item.description,
          hsCode: item.hsCode || '5402.3300',
          quantity: Number(item.quantity) || 0,
          unit: item.uom || 'KG',
          fobValueVal: Number(item.fobValue) || 0,
        }))
      };

      const response = await fetch('/api/v1/exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to save manual export GD');
      }

      alert(`Export GD: ${manualGdNumber} saved successfully via manual entry!`);
      handleCancelManual();
      fetchData();
    } catch (err: any) {
      console.error('Error saving manual export:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsSavingManual(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extractedPartyName || items.length === 0) {
      alert('Please upload a valid Export Excel file first.');
      return;
    }

    const matchedParty = parties.find(
      p => p.companyName.toLowerCase().includes(extractedPartyName.toLowerCase()) || 
           extractedPartyName.toLowerCase().includes(p.companyName.toLowerCase())
    );
    const partyId = matchedParty ? matchedParty.id : (parties.length > 0 ? parties[0].id : null);

    if (!partyId) {
      alert('Error: No matching Client Party found in directory. Please register this party first.');
      return;
    }

    const gdsMap: { [key: string]: any[] } = {};
    items.forEach(item => {
      const gdNo = item.gdNumber || 'GD-EXP-001';
      if (!gdsMap[gdNo]) gdsMap[gdNo] = [];
      gdsMap[gdNo].push(item);
    });

    setLoading(true);
    try {
      for (const gdNo of Object.keys(gdsMap)) {
        const gdItems = gdsMap[gdNo];
        const payload = {
          gdNumber: gdNo,
          gdDate: gdItems[0]?.gdDate || new Date().toISOString(),
          partyId: partyId,
          destinationCountry: 'China',
          portOfLoading: 'Port Qasim Karachi',
          status: 'CLEARED',
          items: gdItems.map(it => ({
            itemDescription: it.itemDescription,
            hsCode: it.hsCode,
            quantity: it.quantity,
            fobValueVal: it.fobValueVal,
            unit: it.uom || 'KG',
          })),
        };

        const res = await fetch('/api/v1/exports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!json.success) {
          console.warn(`GD ${gdNo} note:`, json.error);
        }
      }

      alert('All Export GDs extracted and saved successfully under Client Party ' + extractedPartyName + '!');
      setItems([]);
      setExtractedPartyName('');
      fetchData();
    } catch (err: any) {
      alert('Submission failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recordId: string, gdNumber: string) => {
    if (!confirm(`Are you sure you want to delete Export GD: ${gdNumber}?`)) return;

    try {
      const res = await fetch(`/api/v1/exports?id=${encodeURIComponent(recordId)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        alert('Export GD deleted successfully!');
        fetchData();
      } else {
        alert('Error deleting: ' + (json.error || 'Failed'));
      }
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleDeletePartyAll = async (partyName: string) => {
    if (!confirm(`WARNING: Are you sure you want to delete ALL export records and items for party "${partyName}"? This action cannot be undone.`)) return;

    try {
      const partyRecords = savedExports.filter(rec => rec.party?.companyName?.toLowerCase() === partyName.toLowerCase());
      for (const rec of partyRecords) {
        if (rec.id) {
          await fetch(`/api/v1/exports?id=${encodeURIComponent(rec.id)}`, { method: 'DELETE' });
        }
      }
      alert(`All export records for ${partyName} deleted successfully!`);
      fetchData();
    } catch (err: any) {
      alert('Bulk delete failed: ' + err.message);
    }
  };

  // Dedicated Clean Popup Print Function for Exports
  const triggerPrint = (title: string, subTitle: string, dataItems: any[]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for printing');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #000; padding: 20px; margin: 0; }
            h2 { margin: 0 0 5px 0; font-size: 18px; }
            p { margin: 0 0 15px 0; font-size: 12px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #000; padding: 6px 8px; font-size: 11px; text-align: left; }
            th { background-color: #e2e8f0; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <h2>${title}</h2>
          <p>${subTitle}</p>
          <table>
            <thead>
              <tr>
                <th>Sr #</th>
                <th>Export GD Number</th>
                <th>Particulars</th>
                <th>HS Code</th>
                <th class="text-right">Quantity</th>
                <th>UOM</th>
                <th class="text-right">FOB Value</th>
              </tr>
            </thead>
            <tbody>
              ${dataItems.map((item, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${item.gdNumber || ''}</td>
                  <td>${item.itemDescription || ''}</td>
                  <td>${item.hsCode || ''}</td>
                  <td class="text-right">${formatNumber(item.quantity, 0)}</td>
                  <td>${item.uom || 'KG'}</td>
                  <td class="text-right">${formatNumber(item.fobValueVal, 2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handlePrintSingleGd = () => {
    if (!selectedGdItems) return;
    triggerPrint(
      'Export GD Items Details',
      `Party: ${selectedGdItems.partyName || 'N/A'} | GD #: ${selectedGdItems.gdNumber}`,
      selectedGdItems.items
    );
  };

  const handlePrintPartyAllItems = () => {
    if (!partyPrintModal) return;
    triggerPrint(
      'Party Complete Export Items Summary',
      `Exporter Party: ${partyPrintModal.partyName} (Total Items: ${partyPrintModal.allItems.length})`,
      partyPrintModal.allItems
    );
  };

  const handlePrintPartyAll = (partyName: string) => {
    const partyRecords = savedExports.filter(rec => rec.party?.companyName?.toLowerCase() === partyName.toLowerCase());
    const allPartyItems: any[] = [];
    partyRecords.forEach(rec => {
      if (rec.items) {
        rec.items.forEach((it: any) => {
          allPartyItems.push(it);
        });
      }
    });
    setPartyPrintModal({ partyName, allItems: allPartyItems });
  };

  const filteredExports = savedExports.filter((rec) => {
    const gdMatch = rec.gdNumber?.toLowerCase().includes(historySearch.toLowerCase());
    const partyMatch = rec.party?.companyName?.toLowerCase().includes(historySearch.toLowerCase());
    return gdMatch || partyMatch;
  });

  const uniqueParties = Array.from(new Set(savedExports.map(r => r.party?.companyName).filter(Boolean)));

  return (
    <div id="export-app-container" className="space-y-6 sm:space-y-8 max-w-6xl mx-auto p-4 sm:p-6 text-slate-100 relative">
      <style jsx global>{`
        @media print {
          #export-app-container > *:not(.print-only-container),
          .no-print, nav, header, aside, .dashboard-sidebar, button, form {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .print-only-container {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            padding: 10px !important;
            z-index: 999999 !important;
          }
        }
        .print-only-container {
          display: none;
        }
      `}</style>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-end gap-2 no-print">
        <button
          type="button"
          onClick={() => setActiveTab('auto')}
          className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'auto' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
        >
          <FileSpreadsheet className="w-4 h-4" /> Auto Excel Export
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'manual' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
        >
          <Edit3 className="w-4 h-4" /> Manual Entry Form
        </button>
      </div>

      {/* --- TAB 1: AUTO EXCEL UPLOAD BOX --- */}
      {activeTab === 'auto' && (
        <div className="p-5 sm:p-8 bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 text-slate-100 animate-fadeIn space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white border-b border-slate-800 pb-4 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" /> Export GD Module - Auto Excel Import
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-slate-800/60 p-5 sm:p-6 rounded-xl border-2 border-dashed border-slate-700 hover:border-emerald-500 transition">
              <label className="block text-sm font-semibold text-slate-300 mb-2">Upload Export Template Excel File</label>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="w-full text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer text-xs"
              />
              {message && <p className="text-xs text-green-400 mt-3 font-medium bg-green-950/50 p-2.5 rounded border border-green-800">{message}</p>}
            </div>

            {extractedPartyName && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-5 space-y-2 text-slate-200 shadow-sm text-xs sm:text-sm">
                <div><span className="font-bold text-white">Auto-Detected Exporter:</span> {extractedPartyName}</div>
                <div><span className="font-bold text-white">Total Export Items Extracted:</span> {items.length} rows</div>
              </div>
            )}

            {items.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white mb-3">Extracted Export Matrix Preview</h3>
                <div className="overflow-x-auto border border-slate-700 rounded-xl shadow-sm bg-slate-800">
                  <table className="min-w-full divide-y divide-slate-700 text-xs sm:text-sm">
                    <thead className="bg-slate-900 text-slate-300 font-semibold">
                      <tr>
                        <th className="px-3 sm:px-4 py-3 text-left">GD Number &amp; Date</th>
                        <th className="px-3 sm:px-4 py-3 text-left">Particulars</th>
                        <th className="px-3 sm:px-4 py-3 text-left">HS Code</th>
                        <th className="px-3 sm:px-4 py-3 text-right">Quantity</th>
                        <th className="px-3 sm:px-4 py-3 text-left">UOM</th>
                        <th className="px-3 sm:px-4 py-3 text-right">FOB Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700 text-slate-200">
                      {items.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-750 transition">
                          <td className="px-3 sm:px-4 py-3 font-mono text-xs font-semibold text-emerald-400">{item.gdNumber}</td>
                          <td className="px-3 sm:px-4 py-3 font-medium text-white">{item.itemDescription}</td>
                          <td className="px-3 sm:px-4 py-3 text-slate-300">{item.hsCode}</td>
                          <td className="px-3 sm:px-4 py-3 text-right font-mono text-slate-200">{formatNumber(item.quantity, 0)}</td>
                          <td className="px-3 sm:px-4 py-3 font-semibold text-slate-300">{item.uom || 'KG'}</td>
                          <td className="px-3 sm:px-4 py-3 text-right font-mono text-slate-200">{formatNumber(item.fobValueVal, 2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition duration-200 shadow-lg disabled:opacity-50 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {loading ? 'Saving to Database...' : 'Save Export GD Automatically'}
            </button>
          </form>
        </div>
      )}

      {/* --- TAB 2: MANUAL ENTRY FORM BOX --- */}
      {activeTab === 'manual' && (
        <form onSubmit={handleSaveManualExport} className="p-5 sm:p-8 bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 text-slate-100 space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Edit3 className="w-6 h-6 text-blue-400" /> Manual Export GD &amp; Items Entry
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddManualItemRow}
                className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Item Row
              </button>
              <button
                type="button"
                onClick={handleCancelManual}
                className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow cursor-pointer border border-slate-700"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase">Select Client Party *</label>
              <select
                value={selectedManualPartyId}
                onChange={(e) => setSelectedManualPartyId(e.target.value)}
                required
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="">-- Choose Party --</option>
                {parties.map(party => (
                  <option key={party.id} value={party.id}>
                    {party.companyName} ({party.partyCode || party.ntn || 'N/A'})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase">Export GD Number *</label>
              <input
                type="text"
                placeholder="e.g. KAPS-EXP-202123-30-05-2026"
                value={manualGdNumber}
                onChange={(e) => setManualGdNumber(e.target.value)}
                required
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-bold text-slate-300 uppercase">GD Date</label>
              <input
                type="date"
                value={manualGdDate}
                onChange={(e) => setManualGdDate(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">GD Line Items</h3>
            {manualItems.map((item, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-800 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-2 lg:col-span-4 space-y-1">
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold">Description *</label>
                  <input
                    type="text"
                    placeholder="Item description..."
                    value={item.description}
                    onChange={(e) => handleManualItemChange(idx, 'description', e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="sm:col-span-1 lg:col-span-2 space-y-1">
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold">HS Code (PCT)</label>
                  <input
                    type="text"
                    placeholder="e.g. 5407.9400"
                    value={item.hsCode}
                    onChange={(e) => handleManualItemChange(idx, 'hsCode', e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="sm:col-span-1 lg:col-span-2 space-y-1">
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold">Quantity *</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={item.quantity}
                    onChange={(e) => handleManualItemChange(idx, 'quantity', e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="sm:col-span-1 lg:col-span-1 space-y-1">
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold">UOM</label>
                  <input
                    type="text"
                    value={item.uom}
                    onChange={(e) => handleManualItemChange(idx, 'uom', e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-blue-500 text-center"
                  />
                </div>
                <div className="sm:col-span-1 lg:col-span-2 space-y-1">
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold">FOB Value *</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={item.fobValue}
                    onChange={(e) => handleManualItemChange(idx, 'fobValue', e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-1 text-right sm:text-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveManualItemRow(idx)}
                    disabled={manualItems.length === 1}
                    className="w-full sm:w-auto p-2.5 bg-red-950/60 hover:bg-red-900 text-red-300 rounded-lg border border-red-700/50 transition disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
                    title="Remove Item"
                  >
                    <Trash2 className="w-4 h-4" /> <span className="sm:hidden text-xs">Remove Row</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSavingManual}
              className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition duration-200 shadow-lg text-xs sm:text-base flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSavingManual ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isSavingManual ? 'Saving Manual GD...' : 'Save Manual Export GD'}
            </button>
            <button
              type="button"
              onClick={handleCancelManual}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition border border-slate-700 cursor-pointer text-xs sm:text-base"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Saved Exports History Section */}
      <div className="p-5 sm:p-8 bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 text-slate-100 space-y-6 no-print">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white">Saved Exports History (Database Records)</h3>
            <p className="text-xs text-slate-400 mt-0.5">Total {savedExports.length} Export GDs saved in system</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {uniqueParties.map((partyName: string, pIdx: number) => (
              <div key={pIdx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  onClick={() => handlePrintPartyAll(partyName)}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow cursor-pointer"
                >
                  🖨️ Print {partyName} All
                </button>
                <button
                  onClick={() => handleDeletePartyAll(partyName)}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow cursor-pointer"
                  title={`Delete all export records for ${partyName}`}
                >
                  🗑️ Delete All {partyName} Items
                </button>
              </div>
            ))}

            <input
              type="text"
              placeholder="🔍 Search Export GD # or Party..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="w-full sm:w-64 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>
        </div>

        {filteredExports.length === 0 ? (
          <p className="text-slate-400 text-xs sm:text-sm py-8 text-center bg-slate-950 rounded-xl border border-slate-800">
            {savedExports.length === 0 ? 'No export records found in database yet.' : 'No matching export GD found for your search.'}
          </p>
        ) : (
          <>
            {/* MOBILE CARDS VIEW (Hidden on Desktop) */}
            <div className="block sm:hidden space-y-4">
              {filteredExports.map((rec, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Exporter (Party)</span>
                      <h4 className="text-sm font-black text-white">{rec.party?.companyName || 'N/A'}</h4>
                    </div>
                    <span className="bg-slate-800 text-slate-200 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0">
                      {rec.items?.length || 0} items
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Export GD Number</span>
                    <p className="text-xs font-mono font-bold text-emerald-400 break-all">{rec.gdNumber}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedGdItems({ items: rec.items, gdNumber: rec.gdNumber, partyName: rec.party?.companyName })}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 rounded-xl transition text-center cursor-pointer shadow"
                    >
                      View Items
                    </button>
                    <button
                      onClick={() => handleDelete(rec.id, rec.gdNumber)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-2 rounded-xl transition text-center cursor-pointer shadow"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP TABLE VIEW (Hidden on Mobile) */}
            <div className="hidden sm:block overflow-x-auto border border-slate-700 rounded-xl shadow-sm bg-slate-800">
              <table className="min-w-full divide-y divide-slate-700 text-xs sm:text-sm">
                <thead className="bg-slate-900 text-slate-300 font-semibold">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 text-left">Exporter (Party)</th>
                    <th className="px-3 sm:px-4 py-3 text-left">Export GD Number</th>
                    <th className="px-3 sm:px-4 py-3 text-left">Items Count</th>
                    <th className="px-3 sm:px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700 text-slate-200">
                  {filteredExports.map((rec, idx) => (
                    <tr key={idx} className="hover:bg-slate-750 transition">
                      <td className="px-3 sm:px-4 py-3 font-semibold text-white">{rec.party?.companyName || 'N/A'}</td>
                      <td className="px-3 sm:px-4 py-3 font-mono text-xs font-semibold text-emerald-400">{rec.gdNumber}</td>
                      <td className="px-3 sm:px-4 py-3">
                        <span className="bg-slate-700 text-slate-200 px-2.5 py-1 rounded-md text-xs font-semibold">
                          {rec.items?.length || 0} items
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-center space-x-2">
                        <button
                          onClick={() => setSelectedGdItems({ items: rec.items, gdNumber: rec.gdNumber, partyName: rec.party?.companyName })}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          View Items
                        </button>
                        <button
                          onClick={() => handleDelete(rec.id, rec.gdNumber)}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal Popup to View Single Export GD Items */}
      {selectedGdItems && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl text-slate-100 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Export GD Items Details</h3>
                {selectedGdItems.partyName && (
                  <p className="text-xs text-emerald-400 font-semibold mt-1">Party: {selectedGdItems.partyName}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintSingleGd}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  🖨️ Print Items
                </button>
                <button
                  onClick={() => setSelectedGdItems(null)}
                  className="text-slate-400 hover:text-white font-bold text-lg bg-slate-800 px-3 py-1 rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-700 rounded-xl shadow-sm bg-slate-800">
              <table className="min-w-full divide-y divide-slate-700 text-xs sm:text-sm">
                <thead className="bg-slate-900 text-slate-300 font-semibold">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 text-left">Sr #</th>
                    <th className="px-3 sm:px-4 py-3 text-left">Export GD Number</th>
                    <th className="px-3 sm:px-4 py-3 text-left">Particulars</th>
                    <th className="px-3 sm:px-4 py-3 text-left">HS Code</th>
                    <th className="px-3 sm:px-4 py-3 text-right">Quantity</th>
                    <th className="px-3 sm:px-4 py-3 text-left">UOM</th>
                    <th className="px-3 sm:px-4 py-3 text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700 text-slate-200">
                  {selectedGdItems.items.map((item: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-750 transition">
                      <td className="px-3 sm:px-4 py-3 font-semibold text-slate-400">{item.serialNo || i + 1}</td>
                      <td className="px-3 sm:px-4 py-3 font-mono text-xs font-semibold text-emerald-400">
                        {item.gdNumber || selectedGdItems.gdNumber}
                      </td>
                      <td className="px-3 sm:px-4 py-3 font-medium text-white">{item.itemDescription || ''}</td>
                      <td className="px-3 sm:px-4 py-3 text-slate-300">{item.hsCode || ''}</td>
                      <td className="px-3 sm:px-4 py-3 text-right font-mono text-slate-200">{formatNumber(item.quantity, 0)}</td>
                      <td className="px-3 sm:px-4 py-3 font-semibold text-slate-300">{item.uom || 'KG'}</td>
                      <td className="px-3 sm:px-4 py-3 text-right font-mono text-slate-200">{formatNumber(item.fobValueVal, 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={() => setSelectedGdItems(null)}
                className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-5 py-2.5 rounded-xl transition cursor-pointer text-xs sm:text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Popup to Print ALL Export Items of a Party across all GDs */}
      {partyPrintModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl text-slate-100 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Party Complete Export Items Summary</h3>
                <p className="text-xs text-purple-400 font-semibold mt-1">Exporter Party: {partyPrintModal.partyName} (Total Items: {partyPrintModal.allItems.length})</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintPartyAllItems}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  🖨️ Print Party All Items
                </button>
                <button
                  onClick={() => setPartyPrintModal(null)}
                  className="text-slate-400 hover:text-white font-bold text-lg bg-slate-800 px-3 py-1 rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-700 rounded-xl shadow-sm bg-slate-800">
              <table className="min-w-full divide-y divide-slate-700 text-xs sm:text-sm">
                <thead className="bg-slate-900 text-slate-300 font-semibold">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 text-left">Sr #</th>
                    <th className="px-3 sm:px-4 py-3 text-left">Export GD Number</th>
                    <th className="px-3 sm:px-4 py-3 text-left">Particulars</th>
                    <th className="px-3 sm:px-4 py-3 text-left">HS Code</th>
                    <th className="px-3 sm:px-4 py-3 text-right">Quantity</th>
                    <th className="px-3 sm:px-4 py-3 text-left">UOM</th>
                    <th className="px-3 sm:px-4 py-3 text-right">FOB Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700 text-slate-200">
                  {partyPrintModal.allItems.map((item: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-750 transition">
                      <td className="px-3 sm:px-4 py-3 font-semibold text-slate-400">{i + 1}</td>
                      <td className="px-3 sm:px-4 py-3 font-mono text-xs font-semibold text-emerald-400">
                        {item.gdNumber}
                      </td>
                      <td className="px-3 sm:px-4 py-3 font-medium text-white">{item.itemDescription || ''}</td>
                      <td className="px-3 sm:px-4 py-3 text-slate-300">{item.hsCode || ''}</td>
                      <td className="px-3 sm:px-4 py-3 text-right font-mono text-slate-200">{formatNumber(item.quantity, 0)}</td>
                      <td className="px-3 sm:px-4 py-3 font-semibold text-slate-300">{item.uom || 'KG'}</td>
                      <td className="px-3 sm:px-4 py-3 text-right font-mono text-slate-200">{formatNumber(item.fobValueVal, 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={() => setPartyPrintModal(null)}
                className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-5 py-2.5 rounded-xl transition cursor-pointer text-xs sm:text-sm"
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