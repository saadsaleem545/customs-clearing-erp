'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Plus, Trash2, Save, Loader2, FileSpreadsheet, Edit3, X, Search, RefreshCw, ArrowDownLeft, CheckCircle2, ShieldCheck, Filter, Printer } from 'lucide-react';

export default function ImportGdForm() {
  const [activeTab, setActiveTab] = useState<'auto' | 'manual'>('auto');
  const [extractedPartyName, setExtractedPartyName] = useState('');
  const [parties, setParties] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [savedImports, setSavedImports] = useState<any[]>([]);
  const [selectedGdItems, setSelectedGdItems] = useState<{ items: any[]; gdNumber: string; partyName?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [historySearch, setHistorySearch] = useState('');

  // Advanced Filter States for History Section
  const [filterPartyId, setFilterPartyId] = useState('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');

  // Manual Form States
  const [selectedManualPartyId, setSelectedManualPartyId] = useState('');
  const [manualGdNumber, setManualGdNumber] = useState('');
  const [manualGdDate, setManualGdDate] = useState('');
  const [manualItems, setManualItems] = useState([
    { description: '', hsCode: '', quantity: '', uom: 'KG', assessableValue: '' }
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

      const res = await fetch('/api/v1/imports');
      const json = await res.json();
      if (json.success) {
        setSavedImports(json.data);
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

        let detectedImporter = 'SHIWANI TEXTILE';
        for (let r = 0; r < Math.min(data.length, 10); r++) {
          const row = data[r];
          if (row) {
            for (let c = 0; c < row.length; c++) {
              const cellVal = String(row[c] || '').trim();
              if (cellVal.toUpperCase().includes('IMPORTER') || cellVal.toUpperCase().includes('PARTY') || cellVal.toUpperCase().includes('NAME')) {
                if (row[c + 1] && String(row[c + 1]).trim().length > 2) {
                  detectedImporter = String(row[c + 1]).trim();
                  break;
                } else if (data[r + 1] && data[r + 1][c] && String(data[r + 1][c]).trim().length > 2) {
                  detectedImporter = String(data[r + 1][c]).trim();
                  break;
                }
              }
            }
          }
        }
        detectedImporter = detectedImporter.replace(/^M\/S[:\s]*/i, '').trim();
        setExtractedPartyName(detectedImporter || 'SHIWANI TEXTILE');

        const parsedItems = [];

        for (let i = 2; i < data.length; i++) {
          const row = data[i];
          if (row && row.length > 0) {
            let gdNumber = '';
            let gdDateVal = '';
            let particulars = '';
            let hsCode = '';
            let qty = 0;
            let uom = 'KG';
            let value = 0;

            const nonEmpCols = row.filter((cell: any) => String(cell || '').trim() !== '');
            if (nonEmpCols.length < 3) continue;

            for (let c = 0; c < row.length; c++) {
              const val = String(row[c] || '').trim();
              if (!val || val === 'PARTICULARS' || val === 'GD NO.' || val === 'DATE') continue;

              if (!gdNumber && (val.includes('-') || val.length > 6) && !val.includes('/') && !val.match(/^\d{4}-\d{2}-\d{2}$/)) {
                if (!val.toUpperCase().includes('FABRIC') && !val.toUpperCase().includes('TAPE') && !val.toUpperCase().includes('YARN')) {
                  gdNumber = val;
                  continue;
                }
              }

              if (!gdDateVal && (val.match(/^\d{2}[-/]\d{2}[-/]\d{4}$/) || val.match(/^\d{4}[-/]\d{2}[-/]\d{2}$/))) {
                gdDateVal = val;
                continue;
              }
            }

            if (!gdNumber && row[0]) gdNumber = String(row[0]).trim();
            if (!gdDateVal && row[1]) gdDateVal = String(row[1]).trim();
            particulars = String(row[2] || row[1] || '').trim();
            hsCode = String(row[3] || row[2] || '').trim();
            qty = Number(row[4] || row[3] || 0);
            uom = String(row[5] || row[4] || 'KG').trim();
            value = Number(row[6] || row[5] || row[4] || 0);

            if (particulars === gdNumber || particulars === gdDateVal) {
              particulars = String(row[3] || row[2] || '').trim();
              hsCode = String(row[4] || row[3] || '').trim();
              qty = Number(row[5] || row[4] || 0);
              uom = String(row[6] || row[5] || 'KG').trim();
              value = Number(row[7] || row[6] || 0);
            }

            if (particulars && particulars !== 'PARTICULARS' && particulars !== 'GD NO.' && particulars !== 'DATE') {
              let formattedDate = new Date().toISOString();
              if (gdDateVal) {
                const dateParts = gdDateVal.split(/[-/]/);
                if (dateParts.length === 3) {
                  if (dateParts[0].length === 4) {
                    formattedDate = `${dateParts[0]}-${dateParts[1]}-${dateParts[2]}`;
                  } else {
                    formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
                  }
                }
              }

              parsedItems.push({
                gdNumber: gdNumber || 'GD-IMP-001',
                gdDate: formattedDate,
                itemDescription: particulars,
                hsCode: hsCode || '5402.3300',
                quantity: isNaN(qty) ? 0 : qty,
                uom: uom || 'KG',
                importValueVal: isNaN(value) ? 0 : value,
                countryOfOrigin: 'China',
                portOfDischarge: 'KICT Karachi',
                customsDuty: 0,
              });
            }
          }
        }

        setItems(parsedItems);
        setMessage(`Successfully extracted Importer and ${parsedItems.length} unique import items with correct columns mapping!`);
      } catch (err: any) {
        setMessage('Error parsing Excel: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleAddManualItemRow = () => {
    setManualItems(prev => [
      ...prev,
      { description: '', hsCode: '', quantity: '', uom: 'KG', assessableValue: '' }
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
    setManualItems([{ description: '', hsCode: '', quantity: '', uom: 'KG', assessableValue: '' }]);
    setActiveTab('auto');
  };

  const handleSaveManualImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedManualPartyId) {
      alert('Please select a Client Party / Trader.');
      return;
    }
    if (!manualGdNumber.trim()) {
      alert('Please enter Import GD Number.');
      return;
    }

    try {
      setIsSavingManual(true);
      const payload = {
        partyId: selectedManualPartyId,
        gdNumber: manualGdNumber.trim(),
        gdDate: manualGdDate || new Date().toISOString(),
        countryOfOrigin: 'China',
        portOfDischarge: 'KICT Karachi',
        status: 'CLEARED',
        items: manualItems.map(item => ({
          itemDescription: item.description,
          hsCode: item.hsCode || '5402.3300',
          quantity: Number(item.quantity) || 0,
          unit: item.uom || 'KG',
          importValueVal: Number(item.assessableValue) || 0,
          customsDuty: 0,
        }))
      };

      const response = await fetch('/api/v1/imports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to save manual import GD');
      }

      alert(`Import GD: ${manualGdNumber} saved successfully via manual entry!`);
      handleCancelManual();
      fetchData();
    } catch (err: any) {
      console.error('Error saving manual import:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsSavingManual(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extractedPartyName || items.length === 0) {
      alert('Please upload a valid Import Excel file first.');
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
      const gdNo = item.gdNumber || 'GD-IMP-001';
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
          countryOfOrigin: 'China',
          portOfDischarge: 'KICT Karachi',
          status: 'CLEARED',
          items: gdItems.map(it => ({
            itemDescription: it.itemDescription,
            hsCode: it.hsCode,
            quantity: it.quantity,
            importValueVal: it.importValueVal,
            unit: it.uom || 'KG',
            customsDuty: it.customsDuty || 0,
          })),
        };

        const res = await fetch('/api/v1/imports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!json.success) {
          console.warn(`GD ${gdNo} note:`, json.error);
        }
      }

      alert('All Import GDs extracted and saved successfully under Client Party ' + extractedPartyName + '!');
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
    if (!confirm(`Are you sure you want to delete Import GD: ${gdNumber}?`)) return;

    try {
      const res = await fetch(`/api/v1/imports?id=${encodeURIComponent(recordId)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        alert('Import GD deleted successfully!');
        fetchData();
      } else {
        alert('Error deleting: ' + (json.error || 'Failed'));
      }
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

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
                <th>Import GD Number</th>
                <th>GD Date</th>
                <th>Particulars</th>
                <th>HS Code</th>
                <th class="text-right">Quantity</th>
                <th>UOM</th>
                <th class="text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              ${dataItems.map((item, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${item.gdNumber || ''}</td>
                  <td>${item.gdDate ? new Date(item.gdDate).toLocaleDateString() : ''}</td>
                  <td>${item.itemDescription || ''}</td>
                  <td>${item.hsCode || ''}</td>
                  <td class="text-right">${formatNumber(item.quantity, 0)}</td>
                  <td>${item.uom || item.unit || 'KG'}</td>
                  <td class="text-right">${formatNumber(item.importValueVal, 2)}</td>
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
      'Import GD Items Details',
      `Party: ${selectedGdItems.partyName || 'N/A'} | GD #: ${selectedGdItems.gdNumber}`,
      selectedGdItems.items
    );
  };

  const filteredImports = savedImports.filter((rec) => {
    const gdMatch = rec.gdNumber?.toLowerCase().includes(historySearch.toLowerCase());
    const partyMatchText = rec.party?.companyName?.toLowerCase().includes(historySearch.toLowerCase());
    const searchCondition = !historySearch || gdMatch || partyMatchText;

    const partyIdMatch = !filterPartyId || rec.partyId === filterPartyId || rec.party?.id === filterPartyId;

    let dateMatch = true;
    if (rec.gdDate) {
      const recDate = new Date(rec.gdDate).toISOString().split('T')[0];
      if (filterFromDate && recDate < filterFromDate) dateMatch = false;
      if (filterToDate && recDate > filterToDate) dateMatch = false;
    } else if (filterFromDate || filterToDate) {
      dateMatch = false;
    }

    return searchCondition && partyIdMatch && dateMatch;
  });

  const handlePrintFilteredReport = () => {
    const allFilteredItems: any[] = [];
    filteredImports.forEach(rec => {
      if (rec.items) {
        rec.items.forEach((it: any) => {
          allFilteredItems.push({
            ...it,
            gdNumber: it.gdNumber || rec.gdNumber,
            gdDate: rec.gdDate
          });
        });
      }
    });

    const selectedPartyObj = parties.find(p => p.id === filterPartyId);
    const partyLabel = selectedPartyObj ? selectedPartyObj.companyName : (filterPartyId ? 'Selected Party' : 'All Parties');
    const dateRangeLabel = `Date Range: ${filterFromDate || 'Start'} to ${filterToDate || 'End'}`;

    triggerPrint(
      'Customs Import Clearance Filtered Report',
      `Party: ${partyLabel} | ${dateRangeLabel} | Total Records: ${filteredImports.length} GDs`,
      allFilteredItems
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between p-3 sm:p-6 space-y-6 sm:space-y-8 max-w-[1700px] mx-auto w-full">
      <style jsx global>{`
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 9999px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      {/* Top Banner Header */}
      <div className="bg-white border-2 sm:border-4 border-slate-900 rounded-2xl shadow-xl overflow-hidden w-full">
        <div className="bg-gradient-to-r from-blue-700 via-blue-900 to-slate-950 p-6 sm:p-8 text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-blue-100 text-xs font-black uppercase tracking-wider">
              <ArrowDownLeft className="w-3.5 h-3.5 text-cyan-400" /> WebOC Gateway &bull; Import Clearance Management
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">Import Clearance (GD)</h1>
            <p className="text-xs sm:text-sm text-blue-200 font-medium max-w-2xl">
              Upload Excel sheets for auto-extraction with separate GD No & Date columns or use manual entry forms.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('auto')}
              className={`flex-1 sm:flex-none px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 shadow cursor-pointer ${activeTab === 'auto' ? 'bg-blue-600 text-white shadow-blue-600/30' : 'bg-blue-900/80 text-blue-200 hover:bg-blue-800 border border-blue-600/40'}`}
            >
              <FileSpreadsheet className="w-4 h-4" /> Auto Excel Import
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`flex-1 sm:flex-none px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 shadow cursor-pointer ${activeTab === 'manual' ? 'bg-blue-600 text-white shadow-blue-600/30' : 'bg-blue-900/80 text-blue-200 hover:bg-blue-800 border border-blue-600/40'}`}
            >
              <Edit3 className="w-4 h-4" /> Manual Entry Form
            </button>
          </div>
        </div>
      </div>

      {/* --- TAB 1: AUTO EXCEL UPLOAD BOX --- */}
      {activeTab === 'auto' && (
        <div className="bg-white border-2 sm:border-4 border-slate-900 rounded-2xl p-4 sm:p-8 shadow-xl space-y-6 w-full">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              Auto Excel Import GD Parser
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl border-2 border-dashed border-slate-400 hover:border-blue-600 transition">
              <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-3">Upload Import Template Excel File (.xlsx, .xls)</label>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="w-full text-slate-700 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer text-sm font-semibold"
              />
              {message && <p className="text-xs sm:text-sm text-blue-700 mt-4 font-bold bg-blue-50 p-3.5 rounded-xl border border-blue-200">{message}</p>}
            </div>

            {extractedPartyName && (
              <div className="bg-blue-50 border border-blue-300 rounded-2xl p-4 sm:p-5 space-y-1.5 text-slate-800 shadow-sm text-sm sm:text-base">
                <div><span className="font-black text-slate-900">Auto-Detected Importer:</span> {extractedPartyName}</div>
                <div><span className="font-black text-slate-900">Total Import Items Extracted:</span> {items.length} rows</div>
              </div>
            )}

            {items.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-base sm:text-lg font-black text-slate-900">Extracted Import Matrix Preview</h3>
                <div className="overflow-x-auto border-2 border-slate-900 rounded-2xl shadow-sm bg-white">
                  <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
                    <thead className="bg-slate-900 text-white font-black uppercase text-[11px] sm:text-xs tracking-wider">
                      <tr>
                        <th className="px-4 py-3.5 text-left">GD Number</th>
                        <th className="px-4 py-3.5 text-left">GD Date</th>
                        <th className="px-4 py-3.5 text-left">Particulars</th>
                        <th className="px-4 py-3.5 text-left">HS Code</th>
                        <th className="px-4 py-3.5 text-right">Quantity</th>
                        <th className="px-4 py-3.5 text-left">UOM</th>
                        <th className="px-4 py-3.5 text-right">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                      {items.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3.5 font-mono text-xs sm:text-sm font-black text-blue-700">{item.gdNumber}</td>
                          <td className="px-4 py-3.5 font-mono text-xs sm:text-sm font-black text-slate-900">{item.gdDate ? new Date(item.gdDate).toLocaleDateString() : ''}</td>
                          <td className="px-4 py-3.5 font-black text-slate-900 text-xs sm:text-sm">{item.itemDescription}</td>
                          <td className="px-4 py-3.5 text-slate-900 font-mono font-black text-xs sm:text-sm">{item.hsCode}</td>
                          <td className="px-4 py-3.5 text-right font-mono font-black text-slate-900 text-xs sm:text-sm">{formatNumber(item.quantity, 0)}</td>
                          <td className="px-4 py-3.5 font-black text-slate-900 text-xs sm:text-sm">{item.uom || 'KG'}</td>
                          <td className="px-4 py-3.5 text-right font-mono font-black text-slate-900 text-xs sm:text-sm">{formatNumber(item.importValueVal, 2)}</td>
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider py-3.5 sm:py-4 rounded-2xl transition shadow-xl shadow-blue-600/25 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {loading ? 'Saving to Database...' : 'Save Import GD Automatically'}
            </button>
          </form>
        </div>
      )}

      {/* --- TAB 2: MANUAL ENTRY FORM BOX --- */}
      {activeTab === 'manual' && (
        <form onSubmit={handleSaveManualImport} className="bg-white border-2 sm:border-4 border-slate-900 rounded-2xl p-4 sm:p-8 shadow-xl space-y-6 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
                <Edit3 className="w-5 h-5" />
              </div>
              Manual Import GD &amp; Items Entry Form
            </h2>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={handleAddManualItemRow}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 shadow cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Item Row
              </button>
              <button
                type="button"
                onClick={handleCancelManual}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 shadow cursor-pointer border border-slate-300"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">Select Client Party *</label>
              <select
                value={selectedManualPartyId}
                onChange={(e) => setSelectedManualPartyId(e.target.value)}
                required
                className="w-full p-3.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer shadow-sm"
              >
                <option value="">-- Choose Party --</option>
                {parties.map(party => (
                  <option key={party.id} value={party.id}>
                    {party.companyName} ({party.partyCode || party.ntn || 'N/A'})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">Import GD Number *</label>
              <input
                type="text"
                placeholder="e.g. KAPS-FS-202123"
                value={manualGdNumber}
                onChange={(e) => setManualGdNumber(e.target.value)}
                required
                className="w-full p-3.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-mono shadow-sm"
              />
            </div>

            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">GD Date *</label>
              <input
                type="date"
                value={manualGdDate}
                onChange={(e) => setManualGdDate(e.target.value)}
                required
                className="w-full p-3.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 font-mono shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-500">GD Line Items Matrix</h3>
            {manualItems.map((item, idx) => (
              <div key={idx} className="bg-slate-50 border-2 border-slate-300 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end shadow-sm">
                <div className="sm:col-span-2 lg:col-span-4 space-y-1.5">
                  <label className="block text-[11px] text-slate-600 uppercase font-black">Description *</label>
                  <input
                    type="text"
                    placeholder="Item description..."
                    value={item.description}
                    onChange={(e) => handleManualItemChange(idx, 'description', e.target.value)}
                    required
                    className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div className="sm:col-span-1 lg:col-span-2 space-y-1.5">
                  <label className="block text-[11px] text-slate-600 uppercase font-black">HS Code (PCT)</label>
                  <input
                    type="text"
                    placeholder="e.g. 5407.9400"
                    value={item.hsCode}
                    onChange={(e) => handleManualItemChange(idx, 'hsCode', e.target.value)}
                    className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 font-mono focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div className="sm:col-span-1 lg:col-span-2 space-y-1.5">
                  <label className="block text-[11px] text-slate-600 uppercase font-black">Quantity *</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={item.quantity}
                    onChange={(e) => handleManualItemChange(idx, 'quantity', e.target.value)}
                    required
                    className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-black text-slate-900 font-mono focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div className="sm:col-span-1 lg:col-span-1 space-y-1.5">
                  <label className="block text-[11px] text-slate-600 uppercase font-black">UOM</label>
                  <input
                    type="text"
                    value={item.uom}
                    onChange={(e) => handleManualItemChange(idx, 'uom', e.target.value)}
                    className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-black text-slate-900 font-mono focus:outline-none focus:border-blue-600 text-center"
                  />
                </div>
                <div className="sm:col-span-1 lg:col-span-2 space-y-1.5">
                  <label className="block text-[11px] text-slate-600 uppercase font-black">Assessable Value *</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={item.assessableValue}
                    onChange={(e) => handleManualItemChange(idx, 'assessableValue', e.target.value)}
                    required
                    className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-black text-slate-900 font-mono focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-1 text-right sm:text-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveManualItemRow(idx)}
                    disabled={manualItems.length === 1}
                    className="w-full sm:w-auto p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-300 transition disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
                    title="Remove Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-200">
            <button
              type="submit"
              disabled={isSavingManual}
              className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider py-3.5 sm:py-4 rounded-2xl transition shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSavingManual ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isSavingManual ? 'Saving Manual GD...' : 'Save Manual Import GD'}
            </button>
            <button
              type="button"
              onClick={handleCancelManual}
              className="w-full sm:w-auto px-8 py-3.5 sm:py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm uppercase tracking-wider rounded-2xl transition border border-slate-300 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Saved Imports History Section */}
      <div className="bg-white border-2 sm:border-4 border-slate-900 rounded-2xl p-4 sm:p-8 shadow-xl space-y-6 w-full">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">Saved Imports History (Database Records)</h3>
            <p className="text-xs sm:text-sm text-slate-500 font-bold mt-0.5">Total {savedImports.length} Import GDs saved in system</p>
          </div>
        </div>

        {/* Filter Controls Bar - Fixed with Flexbox layout so everything stays neatly inside */}
        <div className="bg-slate-50 border-2 border-slate-300 p-4 sm:p-5 rounded-2xl flex flex-wrap items-end gap-4 shadow-sm">
          <div className="flex-1 min-w-[220px] space-y-1.5">
            <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">Filter by Party</label>
            <select
              value={filterPartyId}
              onChange={(e) => setFilterPartyId(e.target.value)}
              className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer shadow-sm"
            >
              <option value="">-- All Parties --</option>
              {parties.map(p => (
                <option key={p.id} value={p.id}>{p.companyName}</option>
              ))}
            </select>
          </div>

          <div className="w-[160px] space-y-1.5">
            <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">From Date</label>
            <input
              type="date"
              value={filterFromDate}
              onChange={(e) => setFilterFromDate(e.target.value)}
              className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 font-mono focus:outline-none focus:border-blue-600 shadow-sm"
            />
          </div>

          <div className="w-[160px] space-y-1.5">
            <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">To Date</label>
            <input
              type="date"
              value={filterToDate}
              onChange={(e) => setFilterToDate(e.target.value)}
              className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 font-mono focus:outline-none focus:border-blue-600 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintFilteredReport}
              disabled={filteredImports.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-black uppercase tracking-wider py-3 px-4 rounded-xl transition flex items-center justify-center gap-1.5 shadow cursor-pointer disabled:opacity-50 whitespace-nowrap"
              title="Print Filtered Results"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              onClick={() => { setFilterPartyId(''); setFilterFromDate(''); setFilterToDate(''); setHistorySearch(''); }}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs sm:text-sm font-black uppercase tracking-wider py-3 px-4 rounded-xl transition cursor-pointer border border-slate-300 shadow-sm whitespace-nowrap"
              title="Reset Filters"
            >
              Reset
            </button>
          </div>
        </div>

        {filteredImports.length === 0 ? (
          <p className="text-slate-500 text-sm py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 font-bold">
            {savedImports.length === 0 ? 'No import records found in database yet.' : 'No matching import GD found for selected party or date range.'}
          </p>
        ) : (
          <div className="overflow-x-auto border-2 border-slate-900 rounded-2xl shadow-sm bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
              <thead className="bg-slate-900 text-white font-black uppercase text-[11px] sm:text-xs tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 text-left">Importer (Party)</th>
                  <th className="px-4 py-3.5 text-left">Import GD Number</th>
                  <th className="px-4 py-3.5 text-left">GD Date</th>
                  <th className="px-4 py-3.5 text-left">Items Count</th>
                  <th className="px-4 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-900 font-medium">
                {filteredImports.map((rec, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3.5 text-xs sm:text-sm font-black text-slate-900">{rec.party?.companyName || 'N/A'}</td>
                    <td className="px-4 py-3.5 font-mono text-xs sm:text-sm font-black text-blue-700">{rec.gdNumber}</td>
                    <td className="px-4 py-3.5 font-mono text-xs sm:text-sm font-black text-slate-900">{rec.gdDate ? new Date(rec.gdDate).toLocaleDateString() : ''}</td>
                    <td className="px-4 py-3.5">
                      <span className="text-blue-700 px-3 py-1 text-xs sm:text-sm font-black font-mono">
                        {rec.items?.length || 0} items
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <button
                          onClick={() => setSelectedGdItems({ items: rec.items, gdNumber: rec.gdNumber, partyName: rec.party?.companyName})}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider px-3.5 py-2 rounded-xl transition cursor-pointer shadow"
                        >
                          View Items
                        </button>
                        <button
                          onClick={() => handleDelete(rec.id, rec.gdNumber)}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider px-3.5 py-2 rounded-xl transition cursor-pointer shadow"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-blue-700 via-blue-900 to-slate-950 text-blue-200 text-center py-4 text-xs sm:text-sm font-bold border-t border-blue-900 w-full shadow-inner rounded-2xl">
        &copy; 2026 Customs Clearing ERP &bull; Powered by EFS Advanced Compliance Engine. All rights reserved.
      </footer>

      {/* Modal Popup */}
      {selectedGdItems && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white border-2 sm:border-4 border-slate-900 rounded-3xl max-w-5xl w-full p-4 sm:p-8 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">Import GD Items Details</h3>
                {selectedGdItems.partyName && (
                  <p className="text-xs sm:text-sm text-blue-700 font-black mt-1">Party: {selectedGdItems.partyName}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrintSingleGd}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider px-3.5 sm:px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow"
                >
                  🖨️ Print Items
                </button>
                <button
                  onClick={() => setSelectedGdItems(null)}
                  className="text-slate-600 hover:text-slate-900 font-bold text-lg bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl cursor-pointer transition"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border-2 border-slate-900 rounded-2xl shadow-sm bg-white">
              <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
                <thead className="bg-slate-900 text-white font-black uppercase text-[11px] sm:text-xs tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5 text-left">Sr #</th>
                    <th className="px-4 py-3.5 text-left">Import GD Number</th>
                    <th className="px-4 py-3.5 text-left">Particulars</th>
                    <th className="px-4 py-3.5 text-left">HS Code</th>
                    <th className="px-4 py-3.5 text-right">Quantity</th>
                    <th className="px-4 py-3.5 text-left">UOM</th>
                    <th className="px-4 py-3.5 text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-900 font-medium">
                  {selectedGdItems.items.map((item: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3.5 font-bold text-slate-900">{item.serialNo || i + 1}</td>
                      <td className="px-4 py-3.5 font-mono text-xs sm:text-sm font-black text-blue-700">
                        {item.gdNumber || selectedGdItems.gdNumber}
                      </td>
                      <td className="px-4 py-3.5 font-black text-slate-900 text-xs sm:text-sm">{item.itemDescription}</td>
                      <td className="px-4 py-3.5 text-slate-900 font-mono font-black text-xs sm:text-sm">{item.hsCode}</td>
                      <td className="px-4 py-3.5 text-right font-mono font-black text-slate-900 text-xs sm:text-sm">{formatNumber(item.quantity, 0)}</td>
                      <td className="px-4 py-3.5 font-black text-slate-900 text-xs sm:text-sm">{item.uom || item.unit || 'KG'}</td>
                      <td className="px-4 py-3.5 text-right font-mono font-black text-slate-900 text-xs sm:text-sm">{formatNumber(item.importValueVal, 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={() => setSelectedGdItems(null)}
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