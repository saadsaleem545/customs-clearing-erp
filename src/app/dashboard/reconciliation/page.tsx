'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Layers, Building2, Search, ChevronDown, X, CheckCircle, Circle, Calculator, Save, Loader2, Trash2, Edit3, FileText, Printer, Check, Download } from 'lucide-react';

export default function InputOutputDetailsPage() {
  const [parties, setParties] = useState<any[]>([]);
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [selectedPartyName, setSelectedPartyName] = useState('');
  
  const [partySearchQuery, setPartySearchQuery] = useState('');
  const [isPartyOpen, setIsPartyOpen] = useState(false);
  const [loadingParties, setLoadingParties] = useState(true);

  // Search states for Import GD, Export GD, Analysis Certificate, and Statements Search Filter
  const [importSearchQuery, setImportSearchQuery] = useState('');
  const [exportSearchQuery, setExportSearchQuery] = useState('');
  const [certSearchQuery, setCertSearchQuery] = useState('');
  const [statementsSearchQuery, setStatementsSearchQuery] = useState('');

  const [partyImports, setPartyImports] = useState<any[]>([]);
  const [selectedGdObject, setSelectedGdObject] = useState<any>(null);
  const [selectedImportItem, setSelectedImportItem] = useState<any>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Edit Modal States for Manual Values
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editExportQty, setEditExportQty] = useState('');
  const [editExportValue, setEditExportValue] = useState('');
  const [editConsumptionIncWastage, setEditConsumptionIncWastage] = useState('');
  const [editWastagesKg, setEditWastagesKg] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Matrix table records state
  const [partyReconciliations, setPartyReconciliations] = useState<any[]>([]);
  const [loadingReconciliations, setLoadingReconciliations] = useState(false);

  const [exportGds, setExportGds] = useState<any[]>([]);
  const [selectedExportGdObject, setSelectedExportGdObject] = useState<any>(null);
  const [loadingExportDetails, setLoadingExportDetails] = useState(false);
  const [selectedExportItem, setSelectedExportItem] = useState<any>(null);

  const [analysisCertificates, setAnalysisCertificates] = useState<any[]>([]);
  const [selectedCertObject, setSelectedCertObject] = useState<any>(null);
  const [selectedCertItem, setSelectedCertItem] = useState<any>(null);

  const partyDropdownRef = useRef<HTMLDivElement>(null);

  const formatNumber = (val: any, decimals: number = 2) => {
    const num = Number(val);
    if (isNaN(num) || num === null || num === undefined) return '0';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const importItemQty = Number(selectedImportItem?.quantity ?? selectedImportItem?.netWeight ?? 0);
  const importItemVal = Number(selectedImportItem?.importValueVal ?? selectedImportItem?.assessableValue ?? selectedImportItem?.declaredValue ?? selectedImportItem?.value ?? 0);
  const importItemHsCode = selectedImportItem?.hsCode || selectedImportItem?.hs_code || 'N/A';
  const importItemDesc = selectedImportItem?.itemDescription || selectedImportItem?.particulars || selectedImportItem?.description || 'Import Material';
  const currentGdNumber = selectedGdObject?.gdNumber || selectedGdObject?.importGdNumber || 'N/A';

  const exportQty = Number(selectedExportItem?.qtyOfExports || 0);
  const exportVal = Number(selectedExportItem?.valueOfeExports || selectedExportItem?.fobValue || selectedExportItem?.value || 0);
  const exportGdNumber = selectedExportGdObject?.exportGdNumber || selectedExportGdObject?.gdNumber || selectedExportItem?.exportGdNo || 'N/A';
  const exportDesc = selectedExportItem?.exportParticulars || selectedExportItem?.description || 'Export Item';

  // Direct certificate values mapping
  const certReqQty = Number(selectedCertItem?.requirementQty ?? selectedCertItem?.quantity ?? 0);
  const certWastQtyPerUnit = Number(selectedCertItem?.wastageQty ?? 0); 
  const certInputWithWastage = Number(selectedCertItem?.inputWithWastage ?? (certReqQty + certWastQtyPerUnit));
  const certWastagePct = Number(selectedCertItem?.wastagePct ?? 0);
  
  // Selected Certificate Number for mapping
  const currentCertNumber = selectedCertObject?.certificateNumber || selectedCertObject?.certNumber || 'N/A';
  
  const totalConsumedQty = exportQty * certInputWithWastage;
  const totalWastageQty = exportQty * certWastQtyPerUnit; 

  const unitImportRate = importItemQty > 0 ? (importItemVal / importItemQty) : 0;
  const totalConsumedValue = unitImportRate * totalConsumedQty;
  const valueAdditionPct = exportVal > 0 ? (totalConsumedValue / exportVal) * 100 : 0;

  // Find current party object to retrieve EFS Certificate Number (NTN / certNo)
  const currentPartyObj = parties.find(p => p.id === selectedPartyId);
  const partyEfsCertNo = currentPartyObj?.ntn || currentPartyObj?.certNo || currentPartyObj?.partyCode || 'N/A';

  // Calculate live balance specifically for the currently selected Import GD item using rolling logic
  const currentGdReconciliations = useMemo(() => {
    if (!currentGdNumber || currentGdNumber === 'N/A') return partyReconciliations;
    return partyReconciliations.filter(r => (r.importGdNo || r.importGdNumber) === currentGdNumber);
  }, [partyReconciliations, currentGdNumber]);

  const latestClosingBalanceQty = useMemo(() => {
    if (currentGdReconciliations.length === 0) return importItemQty;
    let runningBal = Number(importItemQty);
    currentGdReconciliations.forEach(r => {
      const consumed = Number(r.consumptionIncWastage || r.totalConsumedQty || 0);
      runningBal -= consumed;
    });
    return runningBal;
  }, [currentGdReconciliations, importItemQty]);

  const latestClosingBalanceVal = useMemo(() => {
    if (currentGdReconciliations.length === 0) return importItemVal;
    let runningVal = Number(importItemVal);
    currentGdReconciliations.forEach(r => {
      const uRate = Number(r.importQty || 0) > 0 ? (Number(r.importValue || 0) / Number(r.importQty || 1)) : unitImportRate;
      const consumed = Number(r.consumptionIncWastage || r.totalConsumedQty || 0);
      runningVal -= (uRate * consumed);
    });
    return runningVal;
  }, [currentGdReconciliations, importItemVal, unitImportRate]);

  const displayBalancedQty = latestClosingBalanceQty - totalConsumedQty;
  const displayBalancedValue = latestClosingBalanceVal - totalConsumedValue;

  const handleSaveReconciliation = async () => {
    if (!selectedPartyId) {
      alert('Please select a Trader / Client Party first.');
      return;
    }
    if (!selectedGdObject || !selectedImportItem) {
      alert('Error: Import GD and its specific item must be selected!');
      return;
    }
    if (!selectedExportGdObject || !selectedExportItem) {
      alert('Error: Export GD and its specific item must be selected!');
      return;
    }
    if (!selectedCertObject || !selectedCertItem) {
      alert('Error: Analysis Certificate and its specific item must be selected!');
      return;
    }

    try {
      setIsSaving(true);

      const payload = {
        partyId: selectedPartyId,
        importMaterialId: selectedImportItem.id,
        exportGdId: selectedExportItem.exportGdId || selectedExportItem.id,
        exportQtyKg: exportQty,
        exportValuePkr: exportVal,
        importGdNumber: currentGdNumber,
        importParticulars: importItemDesc,
        importHsCode: importItemHsCode,
        importQty: importItemQty,
        importValue: importItemVal,
        requirementQty: certReqQty,
        wastageQty: certWastQtyPerUnit,
        inputWithWastage: certInputWithWastage,
        totalConsumedQty: totalConsumedQty,
        actualWastageKg: totalWastageQty, 
        wastagePct: certWastagePct,
        exportGdNo: exportGdNumber,
        exportDescription: exportDesc,
        closingBalance: displayBalancedQty,
        valueAddition: valueAdditionPct,
        analysisCertNo: currentCertNumber,
      };

      const response = await fetch('/api/v1/reconciliations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to save reconciliation');
      }

      setPartyReconciliations(prev => [...prev, result.data]);
      setSuccessMessage(`Reconciliation saved successfully under Import GD: ${currentGdNumber} (${importItemDesc})!`);

    } catch (err: any) {
      console.error('Error saving reconciliation:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearAllReconciliations = async () => {
    if (!selectedPartyId) return;
    if (!confirm(`Are you sure you want to clear all saved reconciliations for M/s. ${selectedPartyName}?`)) {
      return;
    }

    try {
      setIsClearing(true);
      const response = await fetch(`/api/v1/reconciliations?partyId=${selectedPartyId}`, {
        method: 'DELETE',
      });

      const text = await response.text();
      let result = {};
      try {
        result = text ? JSON.parse(text) : {};
      } catch (e) {}

      if (!response.ok) {
        throw new Error((result as any)?.error || 'Failed to clear reconciliations');
      }

      setPartyReconciliations([]);
      setSuccessMessage('All reconciliations have been successfully cleared.');
    } catch (err: any) {
      console.error('Error clearing reconciliations:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearSingleGdStatement = async (groupKey: string, records: any[]) => {
    if (!confirm(`Are you sure you want to clear this item statement?`)) {
      return;
    }

    try {
      const deletePromises = records.map(rec => fetch(`/api/v1/reconciliations/${rec.id}`, { method: 'DELETE' }));
      await Promise.all(deletePromises);

      setPartyReconciliations(prev => prev.filter(r => {
        const gdNo = r.importGdNo || r.importGdNumber || 'GENERAL_GD';
        const materialId = r.inputMaterialId || r.importMaterialId || 'item';
        const impQty = Number(r.importQty || r.importQtyKg || 0);
        const currentKey = `${gdNo}___${materialId}___${impQty}`;
        return currentKey !== groupKey;
      }));
      setSuccessMessage(`Statement has been successfully cleared.`);
    } catch (err: any) {
      console.error('Error clearing statement:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteRow = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      const response = await fetch(`/api/v1/reconciliations/${itemId}`, {
        method: 'DELETE',
      });
      const text = await response.text();
      let result = {};
      try {
        result = text ? JSON.parse(text) : {};
      } catch (e) {}

      if (!response.ok) {
        throw new Error((result as any)?.error || 'Failed to delete reconciliation item');
      }

      setPartyReconciliations(prev => prev.filter(item => item.id !== itemId));
      setSuccessMessage('Reconciliation entry deleted successfully.');
    } catch (err: any) {
      console.error('Error deleting item:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleOpenEditModal = (item: any) => {
    setEditingItem(item);
    setEditExportQty(item.exportQtyKg || item.resolvedExportQty || '');
    setEditExportValue(item.exportValuePkr || '');
    setEditConsumptionIncWastage(item.consumptionIncWastage || item.resolvedTotalConsumed || '');
    setEditWastagesKg(item.actualWastageKg || item.resolvedWastageQty || '');
  };

  const handleUpdateRow = async () => {
    if (!editingItem) return;

    try {
      setIsUpdating(true);
      const payload = {
        exportQtyKg: Number(editExportQty),
        exportValuePkr: Number(editExportValue),
        consumptionIncWastage: Number(editConsumptionIncWastage),
        actualWastageKg: Number(editWastagesKg),
      };

      const response = await fetch(`/api/v1/reconciliations/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      let result = {};
      try {
        result = text ? JSON.parse(text) : {};
      } catch (e) {}

      if (!response.ok) {
        throw new Error((result as any)?.error || 'Failed to update reconciliation item');
      }

      setPartyReconciliations(prev => prev.map(r => r.id === editingItem.id ? (result as any).data || { ...r, ...payload } : r));
      setEditingItem(null);
      setSuccessMessage('Reconciliation entry updated successfully.');
    } catch (err: any) {
      console.error('Error updating item:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrintStatement = (groupKey: string) => {
    const printContent = document.getElementById(`statement-table-${groupKey}`);
    if (!printContent) return;

    const WindowPrt = window.open('', '', 'left=0,top=0,width=1200,height=900,toolbar=0,scrollbars=0,status=0');
    WindowPrt?.document.write(`
      <html>
        <head>
          <title>Reconciliation Statement</title>
          <style>
            body { font-family: Arial, sans-serif; color: #000; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
            th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            h2 { text-align: center; margin-bottom: 5px; }
            p { text-align: center; font-size: 12px; color: #555; }
            .no-print { display: none !important; }
          </style>
        </head>
        <body>
          <h2>Reconciliation Statement - M/s. ${selectedPartyName}</h2>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    WindowPrt?.document.close();
    WindowPrt?.focus();
    setTimeout(() => {
      WindowPrt?.print();
      WindowPrt?.close();
    }, 500);
  };

  const handleExportExcel = (groupKey: string, rows: any[], importGdNo: string, itemDesc: string) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    csvContent += `""\n`;
    csvContent += `,"Reconciliation Statement - M/s. ${selectedPartyName} (Imported Input Goods )"\n`;
    csvContent += `,"EFS Authorization Cert No.: ${partyEfsCertNo}"\n\n`;

    const headers = [
      "S. No.",
      "Import GD No.",
      "Input Description",
      "Import Qty (kg)",
      "Import Value",
      "Input PCT",
      "Analysis Certificate No.",
      "Consumption As per IOCO (Net IOR)",
      "Wastages",
      "Total Consumption (Gross IOR)",
      "%age of Wastage",
      "Export GD No.",
      "Export Description",
      "Export Qty (Kg)",
      "Export value (Rs.)",
      "Consumption including wastage",
      "Wastages (kg)",
      "Closing Balance (Kg)",
      "Value Addition"
    ];
    csvContent += headers.map(h => `"${h}"`).join(",") + "\n";

    rows.forEach((rec, idx) => {
      const rowData = [
        idx + 1,
        idx === 0 ? (rec.importGdNo || importGdNo) : "",
        idx === 0 ? (rec.importParticulars || rec.inputDescription || itemDesc) : "",
        idx === 0 ? formatNumber(rec.importQty || rec.importQtyKg || 0, 0) : "",
        idx === 0 ? formatNumber(rec.importValue || rec.importValuePkr || 0, 2) : "",
        idx === 0 ? (rec.importHsCode || rec.inputPct || "N/A") : "",
        rec.analysisCertNo || "N/A",
        formatNumber(rec.requirementQty || rec.netIocoConsumption || 0, 4),
        formatNumber(rec.wastageQty || rec.iocoWastageQty || 0, 4),
        formatNumber(rec.grossIocoConsumption || rec.inputWithWastage || 0, 4),
        formatNumber(rec.wastagePct || rec.wastagePercentage || 0, 2) + "%",
        rec.exportGdNo || "N/A",
        rec.exportDescription || "Export Item",
        formatNumber(rec.resolvedExportQty, 0),
        formatNumber(rec.exportValuePkr || 0, 2),
        formatNumber(rec.resolvedTotalConsumed, 4),
        formatNumber(rec.resolvedWastageQty, 4),
        formatNumber(rec.computedClosingBalance, 4),
        formatNumber(rec.valueAddition || 0, 2) + "%"
      ];
      
      csvContent += rowData.map(val => `"${String(val ?? "").replace(/"/g, '""')}"`).join(",") + "\n";
    });

    const totalConsumedSum = rows.reduce((sum, r) => sum + Number(r.resolvedTotalConsumed || 0), 0);
    const totalWastageSum = rows.reduce((sum, r) => sum + Number(r.resolvedWastageQty || 0), 0);
    
    let totalRow = Array(19).fill('""');
    totalRow[14] = `"TOTAL"`;
    totalRow[15] = `"${formatNumber(totalConsumedSum, 4)}"`;
    totalRow[16] = `"${formatNumber(totalWastageSum, 4)}"`;
    csvContent += totalRow.join(",") + "\n";

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reconciliation_Statement_${importGdNo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingParties(true);
        const partyRes = await fetch('/api/v1/parties');
        const partyJson = await partyRes.json();
        if (partyJson.success) setParties(partyJson.data);

        const exportRes = await fetch('/api/v1/exports');
        const exportJson = await exportRes.json();
        if (exportJson.success) setExportGds(exportJson.data || []);
      } catch (err) {
        console.error('Error fetching initial data:', err);
      } finally {
        setLoadingParties(false);
      }
    };
    fetchData();

    const handleClickOutside = (event: MouseEvent) => {
      if (partyDropdownRef.current && !partyDropdownRef.current.contains(event.target as Node)) {
        setIsPartyOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchPartyData = async (partyId: string) => {
      if (!partyId) {
        setPartyImports([]);
        setAnalysisCertificates([]);
        setPartyReconciliations([]);
        handleClearImportTable();
        handleClearExportTable();
        handleClearCertTable();
        return;
      }
      try {
        setLoadingReconciliations(true);
        const [importRes, certRes, reconRes] = await Promise.all([
          fetch(`/api/v1/imports?partyId=${partyId}`),
          fetch(`/api/v1/analysis?partyId=${partyId}`),
          fetch(`/api/v1/reconciliations?partyId=${partyId}`)
        ]);

        const importJson = await importRes.json();
        if (importJson.success) setPartyImports(importJson.data || []);

        const certJson = await certRes.json();
        if (certJson.success) setAnalysisCertificates(certJson.data || []);

        const reconJson = await reconRes.json();
        if (reconJson.success) {
          const recs = reconJson.data || [];
          setPartyReconciliations(recs);
        } else {
          setPartyReconciliations([]);
        }
      } catch (err) {
        console.error('Error fetching party dependent data:', err);
      } finally {
        setLoadingReconciliations(false);
      }
    };

    fetchPartyData(selectedPartyId);
    handleClearImportTable();
    handleClearExportTable();
    handleClearCertTable();
  }, [selectedPartyId]);

  const filteredParties = parties.filter((party) => {
    const query = partySearchQuery.toLowerCase();
    return party.companyName?.toLowerCase().includes(query) || party.ntn?.toLowerCase().includes(query) || party.partyCode?.toLowerCase().includes(query);
  });

  const filteredImports = partyImports.filter(imp => {
    const q = importSearchQuery.toLowerCase();
    const gdNo = (imp.gdNumber || imp.importGdNumber || '').toLowerCase();
    return gdNo.includes(q);
  });

  const filteredExports = exportGds.filter(exp => {
    if (selectedPartyId && exp.partyId !== selectedPartyId) return false;
    const q = exportSearchQuery.toLowerCase();
    const gdNo = (exp.exportGdNumber || exp.gdNumber || '').toLowerCase();
    return gdNo.includes(q);
  });

  const filteredCerts = analysisCertificates.filter(cert => {
    const q = certSearchQuery.toLowerCase();
    const certNo = (cert.certificateNumber || cert.certNumber || '').toLowerCase();
    return certNo.includes(q);
  });

  const handleSelectParty = (party: any) => {
    setSelectedPartyId(party.id);
    setSelectedPartyName(party.companyName);
    setPartySearchQuery(party.companyName);
    setIsPartyOpen(false);
  };

  const handleSelectImportItem = (item: any) => {
    setSelectedImportItem(item);
  };

  const handleSelectExportItem = (item: any) => {
    setSelectedExportItem(item);
  };

  const handleSelectCertItem = (item: any) => setSelectedCertItem(item);

  const handleClearImportTable = () => {
    setSelectedGdObject(null);
    setSelectedImportItem(null);
  };

  const handleClearExportTable = () => {
    setSelectedExportGdObject(null);
    setSelectedExportItem(null);
  };

  const handleClearCertTable = () => {
    setSelectedCertObject(null);
    setSelectedCertItem(null);
  };

  const groupedReconciliations = useMemo(() => {
    const map: { [key: string]: any[] } = {};
    partyReconciliations.forEach((rec: any) => {
      const gdNo = rec.importGdNo || rec.importGdNumber || 'GENERAL_GD';
      const materialId = rec.inputMaterialId || rec.importMaterialId || 'item';
      const itemDesc = rec.importParticulars || rec.inputDescription || 'Standard Item';
      const impQty = Number(rec.importQty || rec.importQtyKg || 0);
      
      const uniqueGroupKey = `${gdNo}___${materialId}___${impQty}`;
      
      const q = statementsSearchQuery.toLowerCase();
      if (q && !uniqueGroupKey.toLowerCase().includes(q)) {
        return;
      }

      if (!map[uniqueGroupKey]) map[uniqueGroupKey] = [];
      map[uniqueGroupKey].push(rec);
    });
    return map;
  }, [partyReconciliations, statementsSearchQuery]);

  return (
    <div className="space-y-8 max-w-[1700px] mx-auto font-sans p-6 text-slate-100">
      <style jsx global>{`
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #020617; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 9999px; }
        ::-webkit-scrollbar-thumb:hover { background: #64748b; }
      `}</style>

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
          <Layers className="w-3.5 h-3.5" /> EFS Advanced Compliance &bull; Input Output Ledger Matrix
        </div>
        <h1 className="text-2xl font-black text-white">Input Output Details &amp; Reconciliation Statement</h1>
        <p className="text-xs text-slate-400 mt-1">
          Select Name of Trader, Import GD, Export GD, and Analysis Certificate to calculate and save items.
        </p>
      </div>

      {successMessage && (
        <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-300 px-6 py-4 rounded-2xl shadow-xl flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="text-xs font-bold tracking-wide uppercase">{successMessage}</span>
          </div>
          <button 
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400 hover:text-white text-xs font-bold bg-emerald-900/50 px-3 py-1 rounded-lg border border-emerald-700/40 transition"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Trader Selection Block */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="space-y-2 relative max-w-xl" ref={partyDropdownRef}>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-blue-400" /> Name of Trader (Client Party) *
          </label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={loadingParties ? "Loading parties..." : "Search or select trader..."}
              value={partySearchQuery}
              onChange={(e) => {
                setPartySearchQuery(e.target.value);
                setIsPartyOpen(true);
                if (!e.target.value) {
                  setSelectedPartyId('');
                  setSelectedPartyName('');
                  setPartyReconciliations([]);
                }
              }}
              onFocus={() => setIsPartyOpen(true)}
              className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
            />
            <div 
              className="absolute right-3.5 top-3.5 cursor-pointer text-slate-400 hover:text-white"
              onClick={() => setIsPartyOpen(!isPartyOpen)}
            >
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>

          {isPartyOpen && (
            <div className="absolute left-0 right-0 mt-2 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-800">
              {filteredParties.length === 0 ? (
                <div className="p-3 text-xs text-slate-400 text-center">No matching trader found.</div>
              ) : (
                filteredParties.map((party) => (
                  <div
                    key={party.id}
                    onClick={() => handleSelectParty(party)}
                    className="p-3 text-xs text-slate-200 hover:bg-slate-800 cursor-pointer flex items-center justify-between transition"
                  >
                    <div>
                      <span className="font-bold text-white block">{party.companyName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Cert: {party.ntn || 'N/A'}</span>
                    </div>
                    <span className="text-[10px] font-mono text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40">
                      {party.partyCode}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {selectedPartyId && (
        <div className="space-y-6 max-w-full">
          
          {/* --- 1. Import GD Box --- */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wide text-emerald-400">Select Import GD *</h3>
              {selectedGdObject && (
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/50 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Selected GD
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-4 space-y-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search Import GD No..."
                    value={importSearchQuery}
                    onChange={(e) => setImportSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {filteredImports.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-2">No import GDs found.</p>
                  ) : (
                    filteredImports.map(imp => {
                      const isSelected = selectedGdObject?.id === imp.id;
                      const gdNumberStr = imp.gdNumber || imp.importGdNumber || 'N/A';
                      const itemsCount = imp.items?.length || 0;
                      return (
                        <div 
                          key={imp.id}
                          onClick={() => setSelectedGdObject(isSelected ? null : imp)}
                          className={`p-3 rounded-xl text-xs cursor-pointer border transition flex justify-between items-center ${isSelected ? 'bg-emerald-950/50 border-emerald-500 text-white font-bold shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'}`}
                        >
                          <div className="truncate pr-2">
                            <span className="block truncate font-mono text-emerald-400 font-bold">{gdNumberStr}</span>
                            <span className="text-[10px] text-slate-400 font-normal">{itemsCount} items</span>
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition flex-shrink-0 ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
                            {isSelected ? 'Selected' : 'Select'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="lg:col-span-8">
                {selectedGdObject ? (
                  <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-4 space-y-3 shadow-inner animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-xs font-black text-white uppercase tracking-wider block">Import GD Items Details</span>
                        <span className="text-[11px] text-emerald-400 font-mono font-bold">GD: {selectedGdObject.gdNumber || selectedGdObject.importGdNumber}</span>
                      </div>
                      <button onClick={handleClearImportTable} className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {!selectedGdObject.items || selectedGdObject.items.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6">No items found for this GD.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl">
                        <table className="min-w-full divide-y divide-slate-800 text-xs">
                          <thead>
                            <tr className="text-slate-400 font-semibold text-left">
                              <th className="px-3 py-2.5 w-10 text-center">Select</th>
                              <th className="px-3 py-2.5">Sr #</th>
                              <th className="px-3 py-2.5">Input Description</th>
                              <th className="px-3 py-2.5">Input PCT</th>
                              <th className="px-3 py-2.5 text-right">Import Qty</th>
                              <th className="px-3 py-2.5">UOM</th>
                              <th className="px-3 py-2.5 text-right">Import Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 text-slate-200 font-medium">
                            {selectedGdObject.items.map((item: any, idx: number) => {
                              const description = item.itemDescription || item.particulars || item.description || 'Standard Import Item';
                              const hsCode = item.hsCode || item.hs_code || 'N/A';
                              const qty = item.quantity ?? item.netWeight ?? 0;
                              const uom = item.unit || item.uom || 'KG';
                              const val = item.importValueVal ?? item.assessableValue ?? 0;
                              const isItemSel = selectedImportItem?.id === item.id;

                              return (
                                <tr 
                                  key={item.id || idx} 
                                  onClick={() => handleSelectImportItem(item)}
                                  className={`cursor-pointer transition ${isItemSel ? 'bg-emerald-950/40 border-l-2 border-emerald-400 font-bold' : 'hover:bg-slate-900/60'}`}
                                >
                                  <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                    <button type="button" onClick={() => handleSelectImportItem(item)} className="text-emerald-400 focus:outline-none">
                                      {isItemSel ? <CheckCircle className="w-4 h-4 text-emerald-400 fill-emerald-400/20" /> : <Circle className="w-4 h-4 text-slate-600" />}
                                    </button>
                                  </td>
                                  <td className="px-3 py-2.5 text-slate-400">{idx + 1}</td>
                                  <td className="px-3 py-2.5 text-white">{description}</td>
                                  <td className="px-3 py-2.5 font-mono text-slate-300">{hsCode}</td>
                                  <td className="px-3 py-2.5 text-right font-mono text-slate-100">{formatNumber(qty, 0)}</td>
                                  <td className="px-3 py-2.5 font-mono text-slate-400">{uom}</td>
                                  <td className="px-3 py-2.5 text-right font-mono text-slate-100">{formatNumber(val, 2)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full min-h-[160px] bg-slate-950/50 border border-slate-800 border-dashed rounded-2xl flex items-center justify-center p-6 text-center text-xs text-slate-500">
                    Please select any Import GD from the list to view its details here.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* --- 2. Export GD Box --- */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wide text-purple-400">Select Export GD *</h3>
              {selectedExportGdObject && (
                <span className="text-[10px] font-mono bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-700/50 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Selected Export GD
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-4 space-y-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search Export GD No..."
                    value={exportSearchQuery}
                    onChange={(e) => setExportSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {filteredExports.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-2">No export GDs found.</p>
                  ) : (
                    filteredExports.map(exp => {
                      const isSelected = selectedExportGdObject?.id === exp.id;
                      const expGdNumberStr = exp.exportGdNumber || exp.gdNumber || 'N/A';
                      const expItemsCount = exp.items?.length || 0;
                      return (
                        <div 
                          key={exp.id}
                          onClick={async () => {
                            if (isSelected) {
                              handleClearExportTable();
                              return;
                            }
                            if (exp.items && exp.items.length > 0) {
                              setSelectedExportGdObject(exp);
                            } else {
                              setLoadingExportDetails(true);
                              try {
                                const res = await fetch(`/api/v1/exports/${exp.id}`);
                                const json = await res.json();
                                setSelectedExportGdObject(json.success && json.data ? json.data : exp);
                              } catch {
                                setSelectedExportGdObject(exp);
                              } finally {
                                setLoadingExportDetails(false);
                              }
                            }
                          }}
                          className={`p-3 rounded-xl text-xs cursor-pointer border transition flex justify-between items-center ${isSelected ? 'bg-purple-950/50 border-purple-500 text-white font-bold shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'}`}
                        >
                          <div className="truncate pr-2">
                            <span className="block truncate font-mono text-purple-400 font-bold">{expGdNumberStr}</span>
                            <span className="text-[10px] text-slate-400 font-normal">{expItemsCount} items</span>
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition flex-shrink-0 ${isSelected ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
                            {isSelected ? 'Selected' : 'Select'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="lg:col-span-8">
                {selectedExportGdObject ? (
                  <div className="bg-slate-950 border border-purple-500/40 rounded-2xl p-4 space-y-3 shadow-inner animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-xs font-black text-white uppercase tracking-wider block">Export GD Items Details</span>
                        <span className="text-[11px] text-purple-400 font-mono font-bold">GD: {selectedExportGdObject.exportGdNumber || selectedExportGdObject.gdNumber}</span>
                      </div>
                      <button onClick={handleClearExportTable} className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {loadingExportDetails ? (
                      <p className="text-xs text-slate-500 text-center py-6">Loading export details...</p>
                    ) : !selectedExportGdObject.items || selectedExportGdObject.items.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6">No export items found.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl">
                        <table className="min-w-full divide-y divide-slate-800 text-xs">
                          <thead>
                            <tr className="text-slate-400 font-semibold text-left">
                              <th className="px-3 py-2.5 w-10 text-center">Select</th>
                              <th className="px-3 py-2.5">Sr #</th>
                              <th className="px-3 py-2.5">Particulars</th>
                              <th className="px-3 py-2.5">HS Code</th>
                              <th className="px-3 py-2.5 text-right">Quantity</th>
                              <th className="px-3 py-2.5">UOM</th>
                              <th className="px-3 py-2.5 text-right">Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 text-slate-200 font-medium">
                            {selectedExportGdObject.items.map((item: any, idx: number) => {
                              const description = item.exportParticulars || 'Export Item';
                              const hsCode = item.exportHsCode || 'N/A';
                              const qty = item.qtyOfExports ?? 0;
                              const val = item.valueOfeExports ?? 0;
                              const isItemSel = selectedExportItem?.id === item.id;

                              return (
                                <tr 
                                  key={item.id || idx} 
                                  onClick={() => handleSelectExportItem(item)}
                                  className={`cursor-pointer transition ${isItemSel ? 'bg-purple-950/40 border-l-2 border-purple-400 font-bold' : 'hover:bg-slate-900/60'}`}
                                >
                                  <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                    <button type="button" onClick={() => handleSelectExportItem(item)} className="focus:outline-none">
                                      {isItemSel ? <CheckCircle className="w-4 h-4 text-purple-400 fill-purple-400/20" /> : <Circle className="w-4 h-4 text-slate-600" />}
                                    </button>
                                  </td>
                                  <td className="px-3 py-2.5 text-slate-400">{idx + 1}</td>
                                  <td className="px-3 py-2.5 text-white">{description}</td>
                                  <td className="px-3 py-2.5 font-mono text-slate-300">{hsCode}</td>
                                  <td className="px-3 py-2.5 text-right font-mono text-slate-100">{formatNumber(qty, 0)}</td>
                                  <td className="px-3 py-2.5 font-mono text-slate-400">KG</td>
                                  <td className="px-3 py-2.5 text-right font-mono text-slate-100">{formatNumber(val, 2)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full min-h-[160px] bg-slate-950/50 border border-slate-800 border-dashed rounded-2xl flex items-center justify-center p-6 text-center text-xs text-slate-500">
                    Please select any Export GD from the list to view its details here.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* --- 3. Analysis Certificate Box --- */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wide text-amber-400">Select Analysis Certificate *</h3>
              {selectedCertObject && (
                <span className="text-[10px] font-mono bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-700/50 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Selected Certificate
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-4 space-y-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search Certificate No..."
                    value={certSearchQuery}
                    onChange={(e) => setCertSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {filteredCerts.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-2">No certificates found.</p>
                  ) : (
                    filteredCerts.map(cert => {
                      const isSelected = selectedCertObject?.id === cert.id;
                      const certNumberStr = cert.certificateNumber || cert.certNumber || 'N/A';
                      const certItemsCount = cert.items?.length || cert.certificateItems?.length || 0;
                      return (
                        <div 
                          key={cert.id}
                          onClick={async () => {
                            if (isSelected) {
                              handleClearCertTable();
                              return;
                            }
                            if (cert.items && cert.items.length > 0) {
                              setSelectedCertObject(cert);
                            } else {
                              try {
                                const res = await fetch(`/api/v1/analysis/${cert.id}`);
                                const json = await res.json();
                                setSelectedCertObject(json.success && json.data ? json.data : cert);
                              } catch {
                                setSelectedCertObject(cert);
                              }
                            }
                          }}
                          className={`p-3 rounded-xl text-xs cursor-pointer border transition flex justify-between items-center ${isSelected ? 'bg-amber-950/50 border-amber-500 text-white font-bold shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'}`}
                        >
                          <div className="truncate pr-2">
                            <span className="block truncate font-mono text-amber-400 font-bold">{certNumberStr}</span>
                            <span className="text-[10px] text-slate-400 font-normal">{certItemsCount} items</span>
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition flex-shrink-0 ${isSelected ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
                            {isSelected ? 'Selected' : 'Select'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="lg:col-span-8">
                {selectedCertObject ? (
                  <div className="bg-slate-950 border border-amber-500/40 rounded-2xl p-4 space-y-3 shadow-inner animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-xs font-black text-white uppercase tracking-wider block">Analysis Certificate Items Details</span>
                        <span className="text-[11px] text-amber-400 font-mono font-bold">Cert #: {selectedCertObject.certificateNumber || selectedCertObject.certNumber}</span>
                      </div>
                      <button onClick={handleClearCertTable} className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {(!selectedCertObject.items && !selectedCertObject.certificateItems) || 
                       ((selectedCertObject.items?.length || 0) === 0 && (selectedCertObject.certificateItems?.length || 0) === 0) ? (
                      <p className="text-xs text-slate-500 text-center py-6">No certificate items found.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl">
                        <table className="min-w-full divide-y divide-slate-800 text-xs">
                          <thead>
                            <tr className="text-slate-400 font-semibold text-left">
                              <th className="px-3 py-2.5 w-10 text-center">Select</th>
                              <th className="px-3 py-2.5">Sr #</th>
                              <th className="px-3 py-2.5">Particulars</th>
                              <th className="px-3 py-2.5">HS Code</th>
                              <th className="px-3 py-2.5 text-right">Consumption (Net IOR)</th>
                              <th className="px-3 py-2.5 text-right">Wastages</th>
                              <th className="px-3 py-2.5 text-right">Total (Gross IOR)</th>
                              <th className="px-3 py-2.5 text-right">%age</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 text-slate-200 font-medium">
                            {(selectedCertObject.items || selectedCertObject.certificateItems || []).map((item: any, idx: number) => {
                              const description = item.itemDescription || item.particulars || item.description || 'Certificate Item';
                              const hsCode = item.hsCode || item.hs_code || 'N/A';
                              const qty = item.requirementQty ?? item.quantity ?? 0;
                              const wastQty = item.wastageQty ?? 0;
                              const inputWast = item.inputWithWastage ?? (Number(qty) + Number(wastQty));
                              const wastage = item.wastagePct ?? 0;
                              const isItemSel = selectedCertItem?.id === item.id;

                              return (
                                <tr 
                                  key={item.id || idx} 
                                  onClick={() => handleSelectCertItem(item)}
                                  className={`cursor-pointer transition ${isItemSel ? 'bg-amber-950/40 border-l-2 border-amber-400 font-bold' : 'hover:bg-slate-900/60'}`}
                                >
                                  <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                    <button type="button" onClick={() => handleSelectCertItem(item)} className="text-amber-400 focus:outline-none">
                                      {isItemSel ? <CheckCircle className="w-4 h-4 text-amber-400 fill-amber-400/20" /> : <Circle className="w-4 h-4 text-slate-600" />}
                                    </button>
                                  </td>
                                  <td className="px-3 py-2.5 text-slate-400">{idx + 1}</td>
                                  <td className="px-3 py-2.5 text-white">{description}</td>
                                  <td className="px-3 py-2.5 font-mono text-slate-300">{hsCode}</td>
                                  <td className="px-3 py-2.5 text-right font-mono font-bold text-cyan-400">{formatNumber(qty, 4)}</td>
                                  <td className="px-3 py-2.5 text-right font-mono text-amber-400">{formatNumber(wastQty, 4)}</td>
                                  <td className="px-3 py-2.5 text-right font-mono font-bold text-blue-400">{formatNumber(inputWast, 4)}</td>
                                  <td className="px-3 py-2.5 text-right font-mono text-emerald-400">{formatNumber(wastage, 2)}%</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full min-h-[160px] bg-slate-950/50 border border-slate-800 border-dashed rounded-2xl flex items-center justify-center p-6 text-center text-xs text-slate-500">
                    Please select any Analysis Certificate from the list to view its details here.
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* --- AUTOMATED CONSUMPTION & RECONCILIATION SUMMARY CARD --- */}
      {selectedExportItem && selectedCertItem && (
        <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border-2 border-cyan-500/50 rounded-2xl p-6 shadow-2xl space-y-6 mt-8 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-cyan-500/30 pb-4 gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest bg-cyan-900/60 text-cyan-300 px-2.5 py-1 rounded-full border border-cyan-700/50">
                  Automated Reconciliation Engine
                </span>
                <h3 className="text-lg font-black text-white mt-1.5">Consumption &amp; Wastage Calculation Summary</h3>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-700/50 inline-block">
                COMPLIANCE VERIFIED
              </span>
              <button
                type="button"
                onClick={handleSaveReconciliation}
                disabled={isSaving}
                className={`flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg border border-cyan-400/40 transition transform active:scale-95 ${isSaving ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
                {isSaving ? 'Saving...' : 'Save Reconciliation'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-center sm:text-left">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Export Quantity (GD)</span>
              <span className="font-mono font-bold text-purple-400 text-base block mt-1">{formatNumber(exportQty, 0)} KG</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-center sm:text-left">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Consumption as per IOCO (Net IOR)</span>
              <span className="font-mono font-bold text-cyan-400 text-base block mt-1">{formatNumber(certReqQty, 4)}</span>
            </div>

            <div className="bg-cyan-950/30 border border-cyan-500/40 p-4 rounded-xl space-y-1.5 text-center sm:text-left">
              <span className="text-[10px] text-cyan-300 uppercase tracking-wider font-bold block">Total Consumed Qty</span>
              <span className="font-mono font-black text-cyan-400 text-base block mt-1">{formatNumber(totalConsumedQty, 4)} KG</span>
            </div>

            <div className="bg-blue-950/30 border border-blue-500/40 p-4 rounded-xl space-y-1.5 text-center sm:text-left">
              <span className="text-[10px] text-blue-300 uppercase tracking-wider block font-bold">Total Consumed Value</span>
              <span className="font-mono font-black text-blue-400 text-base block mt-1">{formatNumber(totalConsumedValue, 2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 justify-center max-w-5xl mx-auto">
            <div className="bg-amber-950/30 border border-amber-500/40 p-4 rounded-xl space-y-1.5 text-center">
              <span className="text-[10px] text-amber-300 uppercase tracking-wider block font-bold text-center">Total Wastage Qty</span>
              <span className="font-mono font-black text-amber-400 text-base block mt-1 text-center">{formatNumber(totalWastageQty, 4)} KG</span>
            </div>

            <div className="bg-teal-950/30 border border-teal-500/40 p-4 rounded-xl space-y-1.5 text-center">
              <span className="text-[10px] text-teal-300 uppercase tracking-wider block text-center">Balanced Quantity</span>
              <span className="font-mono font-black text-teal-400 text-base block mt-1 text-center">{formatNumber(displayBalancedQty, 4)} KG</span>
            </div>

            <div className="bg-indigo-950/30 border border-indigo-500/40 p-4 rounded-xl space-y-1.5 text-center">
              <span className="text-[10px] text-indigo-300 uppercase tracking-wider block text-center">Balanced Value</span>
              <span className="font-mono font-black text-indigo-400 text-base block mt-1 text-center">{formatNumber(displayBalancedValue, 2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* --- SEPARATE RECONCILIATION STATEMENTS MATRIX TABLES FOR EACH ITEM WITH CLEAR & PRINT BUTTONS --- */}
      {selectedPartyId && (
        <div className="space-y-10 mt-10">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white">Party Reconciliation Statements (By Item &amp; GD)</h2>
                <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mt-0.5">
                  Trader: {selectedPartyName} &bull; Separate statement generated for each unique import item.
                </p>
              </div>
              
              {partyReconciliations.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllReconciliations}
                  disabled={isClearing}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-950/60 hover:bg-red-900 text-red-300 font-bold text-xs rounded-xl border border-red-700/50 transition cursor-pointer shadow-lg"
                >
                  {isClearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {isClearing ? 'Clearing All...' : 'Clear All Statements'}
                </button>
              )}
            </div>

            {/* Search Filter Bar for Import Statements */}
            <div className="relative max-w-md pt-2">
              <Search className="w-4 h-4 absolute left-3.5 top-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search statements by GD No or Item..."
                value={statementsSearchQuery}
                onChange={(e) => setStatementsSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>
          </div>

          {loadingReconciliations ? (
            <div className="text-center py-12 text-slate-400 text-xs bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
              Loading saved reconciliations from database...
            </div>
          ) : Object.keys(groupedReconciliations).length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
              No matching reconciliation statements found.
            </div>
          ) : (
            Object.entries(groupedReconciliations).map(([groupKey, records]: [string, any[]]) => {
              const [importGdNo, materialId, impQtyStr] = groupKey.split('___');
              
              let runningBalance = 0;

              const rows = records.map((rec: any, idx: number) => {
                const impQty = Number(rec.importQty || rec.importQtyKg || impQtyStr || 0);

                const recExportQty = Number(rec.exportQtyKg || rec.exportQty || 0);
                const recTotalConsumedQty = Number(rec.consumptionIncWastage || rec.totalConsumedQty || (recExportQty * Number(rec.grossIocoConsumption || rec.netIocoConsumption || 0)) || 0);
                
                let recWastageQty = Number(rec.actualWastageKg || rec.totalWastageQty || 0);
                if (recWastageQty === 0 || recWastageQty < 1) {
                  const unitWast = Number(rec.wastageQty || rec.iocoWastageQty || 0);
                  recWastageQty = recExportQty * unitWast;
                }

                // Har naye GD/Group ki pehli entry par fresh Import Qty se calculation start hogi
                if (idx === 0) {
                  runningBalance = impQty - recTotalConsumedQty;
                } else {
                  runningBalance = runningBalance - recTotalConsumedQty;
                }

                return {
                  ...rec,
                  resolvedExportQty: recExportQty,
                  resolvedTotalConsumed: recTotalConsumedQty,
                  resolvedWastageQty: recWastageQty,
                  computedClosingBalance: runningBalance,
                };
              });

              const itemDesc = rows[0]?.importParticulars || rows[0]?.inputDescription || 'Standard Item';

              return (
                <div key={groupKey} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-black text-white uppercase tracking-wide">
                        EFS Authorization Cert No.: <span className="text-emerald-400 font-mono">{partyEfsCertNo}</span> &bull; GD: <span className="text-emerald-400 font-mono">{importGdNo}</span> &bull; Item: <span className="text-cyan-400">{itemDesc}</span> &bull; Qty: <span className="text-amber-400 font-mono">{formatNumber(impQtyStr, 0)}</span>
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-start sm:justify-end">
                      <span className="text-xs font-mono bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 text-slate-300">
                        Total Entries: {rows.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleExportExcel(groupKey, rows, importGdNo, itemDesc)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                        title="Export to Excel"
                      >
                        <Download className="w-3.5 h-3.5" /> Export to Excel
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePrintStatement(groupKey)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                        title="Print Statement"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print Statement
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClearSingleGdStatement(groupKey, records)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 font-bold text-xs rounded-xl border border-red-700/50 shadow transition cursor-pointer"
                        title="Clear Statement"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Clear Statement
                      </button>
                    </div>
                  </div>

                  <div id={`statement-table-${groupKey}`} className="overflow-x-auto rounded-xl bg-slate-950 border border-slate-800">
                    <table className="min-w-full divide-y divide-slate-800 text-xs">
                      <thead>
                        <tr className="bg-slate-950 border-b border-slate-800">
                          <th colSpan={20} className="py-5 px-4 text-center text-white font-black text-base tracking-wider uppercase">
                            (EFS Authorization Cert No.: {partyEfsCertNo})
                          </th>
                        </tr>

                        <tr className="bg-slate-950 text-slate-300 font-bold uppercase tracking-wider border-b border-slate-800 text-center">
                          <th></th>
                          <th colSpan={5} className="bg-emerald-950/40 text-emerald-400 px-3 py-2">Input</th>
                          <th colSpan={4} className="bg-cyan-950/40 text-cyan-400 px-3 py-2">IOR</th>
                          <th colSpan={6} className="bg-purple-950/40 text-purple-400 px-3 py-2">Output</th>
                          <th colSpan={2} className="bg-teal-950/40 text-teal-400 px-3 py-2">Balance &amp; Value</th>
                          <th className="bg-slate-900 text-slate-300 px-3 py-2 no-print">Actions</th>
                        </tr>

                        <tr className="text-slate-400 font-semibold text-left bg-slate-900/60">
                          <th className="px-3 py-3.5 text-center w-12">S. No.</th>
                          <th className="px-3 py-3.5">Import GD No.</th>
                          <th className="px-3 py-3.5">Input Description</th>
                          <th className="px-3 py-3.5 text-right">Import Qty (kg)</th>
                          <th className="px-3 py-3.5 text-right">Import Value</th>
                          <th className="px-3 py-3.5">Input PCT</th>
                          <th className="px-3 py-3.5">Analysis Certificate No.</th>
                          <th className="px-3 py-3.5 text-right">Consumption As per IOCO (Net IOR)</th>
                          <th className="px-3 py-3.5 text-right">Wastages</th>
                          <th className="px-3 py-3.5 text-right">Total Consumption (Gross IOR)</th>
                          <th className="px-3 py-3.5 text-right">%age of Wastage</th>
                          <th className="px-3 py-3.5">Export GD No.</th>
                          <th className="px-3 py-3.5">Export Description</th>
                          <th className="px-3 py-3.5 text-right">Export Qty (Kg)</th>
                          <th className="px-3 py-3.5 text-right">Export value (Rs.)</th>
                          <th className="px-3 py-3.5 text-right">Consumption including wastage</th>
                          <th className="px-3 py-3.5 text-right">Wastages (kg)</th>
                          <th className="px-3 py-3.5 text-right">Closing Balance (Kg)</th>
                          <th className="px-3 py-3.5 text-right">Value Addition</th>
                          <th className="px-3 py-3.5 text-center no-print">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-200 font-medium">
                        {rows.map((rec: any, idx: number) => (
                          <tr key={rec.id || idx} className="hover:bg-slate-900/40 transition">
                            <td className="px-3 py-3.5 text-center font-mono text-slate-400">{idx + 1}</td>
                            <td className="px-3 py-3.5 font-mono font-bold text-emerald-400">
                              {idx === 0 ? (rec.importGdNo || importGdNo) : ''}
                            </td>
                            <td className="px-3 py-3.5 font-bold text-white">
                              {idx === 0 ? (rec.importParticulars || rec.inputDescription || itemDesc) : ''}
                            </td>
                            <td className="px-3 py-3.5 text-right font-mono text-slate-100">
                              {idx === 0 ? formatNumber(rec.importQty || rec.importQtyKg || 0, 0) : ''}
                            </td>
                            <td className="px-3 py-3.5 text-right font-mono text-slate-100">
                              {idx === 0 ? formatNumber(rec.importValue || rec.importValuePkr || 0, 2) : ''}
                            </td>
                            <td className="px-3 py-3.5 font-mono text-slate-300">
                              {idx === 0 ? (rec.importHsCode || rec.inputPct || 'N/A') : ''}
                            </td>
                            <td className="px-3 py-3.5 font-mono text-amber-300">
                              {rec.analysisCertNo || 'N/A'}
                            </td>
                            <td className="px-3 py-3.5 text-right font-mono text-cyan-400">{formatNumber(rec.requirementQty || rec.netIocoConsumption || 0, 4)}</td>
                            <td className="px-3 py-3.5 text-right font-mono text-amber-400">{formatNumber(rec.wastageQty || rec.iocoWastageQty || 0, 4)}</td>
                            <td className="px-3 py-3.5 text-right font-mono font-bold text-blue-400">{formatNumber(rec.grossIocoConsumption || rec.inputWithWastage || 0, 4)}</td>
                            <td className="px-3 py-3.5 text-right font-mono text-emerald-400">{formatNumber(rec.wastagePct || rec.wastagePercentage || 0, 2)}%</td>
                            <td className="px-3 py-3.5 text-mono font-bold text-purple-400">{rec.exportGdNo || 'N/A'}</td>
                            <td className="px-3 py-3.5 font-bold text-white">{rec.exportDescription || 'Export Item'}</td>
                            <td className="px-3 py-3.5 text-right font-mono text-purple-300">{formatNumber(rec.resolvedExportQty, 0)}</td>
                            <td className="px-3 py-3.5 text-right font-mono text-purple-200">{formatNumber(rec.exportValuePkr || 0, 2)}</td>
                            <td className="px-3 py-3.5 text-right font-mono font-bold text-blue-400">{formatNumber(rec.resolvedTotalConsumed, 4)}</td>
                            <td className="px-3 py-3.5 text-right font-mono font-bold text-amber-400">{formatNumber(rec.resolvedWastageQty, 4)}</td>
                            <td className="px-3 py-3.5 text-right font-mono font-bold text-teal-400">{formatNumber(rec.computedClosingBalance, 4)}</td>
                            <td className="px-3 py-3.5 text-right font-mono font-bold text-indigo-400">{formatNumber(rec.valueAddition || 0, 2)}%</td>
                            <td className="px-3 py-3.5 text-center no-print">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(rec)}
                                  className="p-1.5 bg-blue-950/60 hover:bg-blue-900 text-blue-300 rounded-lg border border-blue-700/40 transition cursor-pointer"
                                  title="Edit Entry"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRow(rec.id)}
                                  className="p-1.5 bg-red-950/60 hover:bg-red-900 text-red-300 rounded-lg border border-red-700/40 transition cursor-pointer"
                                  title="Delete Entry"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}

                        {/* TOTAL ROW FOR CONSUMPTION & WASTAGES */}
                        <tr className="bg-slate-900/90 font-black text-white border-t-2 border-slate-700">
                          <td colSpan={15} className="px-3 py-3.5 text-right uppercase tracking-wider text-emerald-400">
                            TOTAL:
                          </td>
                          <td className="px-3 py-3.5 text-right font-mono text-blue-400">
                            {formatNumber(rows.reduce((sum, r) => sum + Number(r.resolvedTotalConsumed || 0), 0), 4)}
                          </td>
                          <td className="px-3 py-3.5 text-right font-mono text-amber-400">
                            {formatNumber(rows.reduce((sum, r) => sum + Number(r.resolvedWastageQty || 0), 0), 4)}
                          </td>
                          <td colSpan={2} className="px-3 py-3.5"></td>
                          <td className="px-3 py-3.5 text-center no-print"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* EDIT MODAL FOR MANUAL VALUES */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-white">Edit Reconciliation Item (Manual Values)</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Export Qty (KG)</label>
                <input 
                  type="number" 
                  value={editExportQty} 
                  onChange={e => setEditExportQty(e.target.value)} 
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-mono" 
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Export Value (Rs.)</label>
                <input 
                  type="number" 
                  value={editExportValue} 
                  onChange={e => setEditExportValue(e.target.value)} 
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-mono" 
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Consumption including Wastage</label>
                <input 
                  type="number" 
                  value={editConsumptionIncWastage} 
                  onChange={e => setEditConsumptionIncWastage(e.target.value)} 
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-mono" 
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Wastages (KG)</label>
                <input 
                  type="number" 
                  value={editWastagesKg} 
                  onChange={e => setEditWastagesKg(e.target.value)} 
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-mono" 
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4 pt-2 border-t border-slate-800">
              <button 
                type="button"
                onClick={() => setEditingItem(null)} 
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleUpdateRow} 
                disabled={isUpdating} 
                className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition"
              >
                {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}