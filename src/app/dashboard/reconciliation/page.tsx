'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Layers, Building2, Search, ChevronDown, X, CheckCircle, Circle, Calculator, Save, Loader2, Trash2, Edit3, FileText, Printer, Check, Download, ArrowUpRight, RotateCcw } from 'lucide-react';

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

  // Advanced Filtering States for Reconciliation Section
  const [filterPartyId, setFilterPartyId] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [partyImports, setPartyImports] = useState<any[]>([]);
  const [selectedGdObject, setSelectedGdObject] = useState<any>(null);
  const [selectedImportItem, setSelectedImportItem] = useState<any>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Quick Edit State for Export GD Item Quantity & Value (Two-Step: Update then Save)
  const [editingExportQtyItem, setEditingExportQtyItem] = useState<any>(null);
  const [tempExportQtyVal, setTempExportQtyVal] = useState('');
  const [isUpdatedInModal, setIsUpdatedInModal] = useState(false);
  const [calculatedBalancedQty, setCalculatedBalancedQty] = useState<number>(0);
  const [calculatedBalancedVal, setCalculatedBalancedVal] = useState<number>(0);

  // Matrix table records state (global reconciliations if admin or party-specific)
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

  // Find current party object to retrieve EFS Certificate Number using valid Prisma schema fields (ntn / companyRegistrationNo)
  const currentPartyObj = parties.find(p => p.id === selectedPartyId);
  const partyEfsCertNo = currentPartyObj?.ntn || currentPartyObj?.companyRegistrationNo || currentPartyObj?.partyCode || 'N/A';
  const currentPartyNameText = currentPartyObj?.companyName || selectedPartyName || 'VALUED CLIENT';

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
      setSuccessMessage(`Reconciliation saved successfully!`);

    } catch (err: any) {
      console.error('Error saving reconciliation:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearAllReconciliations = async () => {
    if (!selectedPartyId && filterPartyId === 'ALL') {
      alert('Please select a party or filter first.');
      return;
    }
    const targetParty = filterPartyId !== 'ALL' ? filterPartyId : selectedPartyId;
    if (!confirm(`Are you sure you want to clear all saved reconciliations for this selection?`)) {
      return;
    }

    try {
      setIsClearing(true);
      const response = await fetch(`/api/v1/reconciliations?partyId=${targetParty}`, {
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

      setPartyReconciliations(prev => prev.filter(r => r.partyId !== targetParty));
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

  // STEP 1: Modal Update Button Click (Calculates balanced quantities & values)
  const handleModalUpdateClick = () => {
    if (!editingExportQtyItem) return;
    const manualQty = Number(tempExportQtyVal);
    if (isNaN(manualQty)) {
      alert('Please enter a valid quantity.');
      return;
    }

    const origQty = Number(editingExportQtyItem.qtyOfExports ?? 0);
    const origVal = Number(editingExportQtyItem.valueOfeExports ?? 0);
    const manualVal = origQty > 0 ? (origVal / origQty) * manualQty : origVal;

    const balancedQty = origQty - manualQty;
    const balancedVal = origVal - manualVal;

    setCalculatedBalancedQty(balancedQty > 0 ? balancedQty : 0);
    setCalculatedBalancedVal(balancedVal > 0 ? balancedVal : 0);
    setIsUpdatedInModal(true);
  };

  // STEP 2: Modal Save Button Click (Permanently applies balanced values to export item)
  const handleModalSaveClick = () => {
    if (!editingExportQtyItem || !selectedExportGdObject) return;

    const updatedItems = selectedExportGdObject.items.map((it: any) => {
      if (it.id === editingExportQtyItem.id) {
        return { 
          ...it, 
          qtyOfExports: calculatedBalancedQty,
          valueOfeExports: calculatedBalancedVal 
        };
      }
      return it;
    });

    const updatedExportGd = {
      ...selectedExportGdObject,
      items: updatedItems
    };

    setSelectedExportGdObject(updatedExportGd);
    setExportGds(prev => prev.map(exp => exp.id === updatedExportGd.id ? updatedExportGd : exp));

    if (selectedExportItem?.id === editingExportQtyItem.id) {
      setSelectedExportItem({
        ...selectedExportItem,
        qtyOfExports: calculatedBalancedQty,
        valueOfeExports: calculatedBalancedVal
      });
    }

    setEditingExportQtyItem(null);
    setTempExportQtyVal('');
    setIsUpdatedInModal(false);
    setSuccessMessage('Export item permanently updated with Balanced Quantity and Balanced Value!');
  };

  const handlePrintStatement = (groupKey: string) => {
    const printContent = document.getElementById(`statement-table-${groupKey}`);
    if (!printContent) return;

    const WindowPrt = window.open('', '', 'left=0,top=0,width=1200,height=900,toolbar=0,scrollbars=0,status=0');
    WindowPrt?.document.write(`
      <html>
        <head>
          <style>
            @media print {
              @page { size: landscape; margin: 10mm; }
              .no-print { display: none !important; }
            }
            body { font-family: Arial, sans-serif; color: #000; padding: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
            th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; text-align: center; font-size: 12px; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            h2 { text-align: center; margin-bottom: 5px; font-size: 18px; }
            p { text-align: center; font-size: 13px; color: #555; }
          </style>
        </head>
        <body>
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

  const handlePrintAllFilteredStatements = () => {
    const WindowPrt = window.open('', '', 'left=0,top=0,width=1200,height=900,toolbar=0,scrollbars=0,status=0');
    const allTablesHtml = Object.keys(groupedReconciliations).map(key => {
      const el = document.getElementById(`statement-table-${key}`);
      return el ? el.innerHTML : '';
    }).join('<hr style="margin: 40px 0; border: 2px dashed #333;" />');

    WindowPrt?.document.write(`
      <html>
        <head>
          <title>All Filtered EFS Statements</title>
          <style>
            @media print {
              @page { size: landscape; margin: 10mm; }
              .no-print { display: none !important; }
            }
            body { font-family: Arial, sans-serif; color: #000; padding: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
            th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; text-align: center; font-size: 12px; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            h2 { text-align: center; margin-bottom: 5px; font-size: 18px; }
            p { text-align: center; font-size: 13px; color: #555; }
          </style>
        </head>
        <body>
          <h2>EFS Authorization Certificate Statements Report</h2>
          <p>From: ${fromDate || 'N/A'} To: ${toDate || 'N/A'}</p>
          ${allTablesHtml}
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
    csvContent += `,"RECONCILIATION STATEMENT M/s - ${currentPartyNameText}"\n`;
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
    link.setAttribute("download", `EFS_Statement_${importGdNo}.csv`);
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

        setLoadingReconciliations(true);
        const reconRes = await fetch('/api/v1/reconciliations');
        const reconJson = await reconRes.json();
        if (reconJson.success) {
          setPartyReconciliations(reconJson.data || []);
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
      } finally {
        setLoadingParties(false);
        setLoadingReconciliations(false);
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
        handleClearImportTable();
        handleClearExportTable();
        handleClearCertTable();
        return;
      }
      try {
        const [importRes, certRes] = await Promise.all([
          fetch(`/api/v1/imports?partyId=${partyId}`),
          fetch(`/api/v1/analysis?partyId=${partyId}`)
        ]);

        const importJson = await importRes.json();
        if (importJson.success) setPartyImports(importJson.data || []);

        const certJson = await certRes.json();
        if (certJson.success) setAnalysisCertificates(certJson.data || []);
      } catch (err) {
        console.error('Error fetching party dependent data:', err);
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
      if (filterPartyId !== 'ALL' && rec.partyId !== filterPartyId) {
        return;
      }

      const recDateStr = rec.createdAt || rec.date || rec.updatedAt;
      if (fromDate || toDate) {
        if (!recDateStr) return;
        const itemDate = new Date(recDateStr).toISOString().split('T')[0];
        if (fromDate && itemDate < fromDate) return;
        if (toDate && itemDate > toDate) return;
      }

      const gdNo = rec.importGdNo || rec.importGdNumber || 'GENERAL_GD';
      const materialId = rec.inputMaterialId || rec.importMaterialId || 'item';
      const impQty = Number(rec.importQty || rec.importQtyKg || 0);
      
      const uniqueGroupKey = `${gdNo}___${materialId}___${impQty}`;
      
      const q = statementsSearchQuery.toLowerCase();
      if (q && !uniqueGroupKey.toLowerCase().includes(q) && !(rec.importParticulars || '').toLowerCase().includes(q)) {
        return;
      }

      if (!map[uniqueGroupKey]) map[uniqueGroupKey] = [];
      map[uniqueGroupKey].push(rec);
    });
    return map;
  }, [partyReconciliations, filterPartyId, fromDate, toDate, statementsSearchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between p-3 sm:p-6 space-y-6 sm:space-y-8 max-w-[1700px] mx-auto overflow-x-hidden">
      <style jsx global>{`
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 9999px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Top Banner Header */}
      <div className="bg-white border-2 sm:border-4 border-slate-900 rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-700 via-blue-900 to-slate-950 p-5 sm:p-8 text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-blue-100 text-xs sm:text-sm font-black uppercase tracking-wider">
              <ArrowUpRight className="w-4 h-4 text-cyan-400" /> EFS Advanced Compliance &bull; Input Output Ledger Matrix
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">Input Output Details &amp; Reconciliation Statement</h1>
            <p className="text-sm sm:text-base text-blue-200 font-small max-w-3xl">
              Select Name of Trader, Import GD, Export GD, and Analysis Certificate to calculate and save items.
            </p>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border-2 border-emerald-600 text-emerald-900 px-4 sm:px-6 py-3.5 sm:py-4 rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-black tracking-wide uppercase">{successMessage}</span>
          </div>
          <button 
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-black bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300 transition cursor-pointer self-end sm:self-auto"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Trader Selection Block */}
      <div className="bg-white border-2 sm:border-4 border-slate-900 rounded-2xl p-4 sm:p-8 shadow-xl space-y-4">
        <div className="space-y-3 relative max-w-2xl" ref={partyDropdownRef}>
          <label className="block text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" /> Name of Trader (Client Party) *
          </label>
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-4 text-slate-400" />
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
                }
              }}
              onFocus={() => setIsPartyOpen(true)}
              className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs sm:text-base font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 cursor-pointer shadow-sm"
            />
            <div 
              className="absolute right-4 top-4 cursor-pointer text-slate-500 hover:text-slate-900"
              onClick={() => setIsPartyOpen(!isPartyOpen)}
            >
              <ChevronDown className="w-5 h-5" />
            </div>
          </div>

          {isPartyOpen && (
            <div className="absolute left-0 right-0 mt-2 bg-white border-2 border-slate-900 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto divide-y divide-slate-100">
              {filteredParties.length === 0 ? (
                <div className="p-4 text-xs sm:text-sm text-slate-500 text-center font-bold">No matching trader found.</div>
              ) : (
                filteredParties.map((party) => (
                  <div
                    key={party.id}
                    onClick={() => handleSelectParty(party)}
                    className="p-3.5 text-xs sm:text-sm text-slate-900 hover:bg-blue-50 cursor-pointer flex items-center justify-between transition font-bold"
                  >
                    <div>
                      <span className="font-black text-slate-900 text-sm sm:text-base block">{party.companyName}</span>
                      <span className="text-[11px] sm:text-xs text-slate-500 font-mono">Cert: {party.ntn || 'N/A'}</span>
                    </div>
                    <span className="text-[11px] sm:text-xs font-mono text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200 font-black">
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
        <div className="space-y-6 sm:space-y-8 max-w-full">
          
          {/* --- 1. Import GD Box --- */}
          <div className="bg-white border-2 sm:border-4 border-slate-900 rounded-2xl p-4 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded-full bg-blue-600"></span> Select Import GD *
              </h3>
              {selectedGdObject && (
                <span className="text-xs sm:text-sm font-mono bg-blue-50 text-blue-700 px-3.5 py-1.5 rounded-xl border border-blue-300 font-black inline-flex items-center gap-2">
                  <Check className="w-4 h-4" /> Selected GD: {selectedGdObject.gdNumber || selectedGdObject.importGdNumber}
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-4 space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Import GD No..."
                    value={importSearchQuery}
                    onChange={(e) => setImportSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div className="max-h-72 overflow-y-auto space-y-2.5">
                  {filteredImports.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4 font-bold bg-slate-50 rounded-xl border border-slate-200">No import GDs found.</p>
                  ) : (
                    filteredImports.map(imp => {
                      const isSelected = selectedGdObject?.id === imp.id;
                      const gdNumberStr = imp.gdNumber || imp.importGdNumber || 'N/A';
                      const itemsCount = imp.items?.length || 0;
                      return (
                        <div 
                          key={imp.id}
                          onClick={() => setSelectedGdObject(isSelected ? null : imp)}
                          className={`p-3.5 sm:p-4 rounded-xl text-xs sm:text-sm cursor-pointer border-2 transition flex justify-between items-center ${isSelected ? 'bg-blue-600 border-blue-900 text-white font-black shadow-lg' : 'bg-slate-50 border-slate-300 text-slate-900 hover:bg-slate-100 font-bold'}`}
                        >
                          <div className="truncate pr-2">
                            <span className={`block truncate font-mono text-sm sm:text-base font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>{gdNumberStr}</span>
                            <span className={`text-[11px] sm:text-xs mt-0.5 block ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>{itemsCount} items</span>
                          </div>
                          <span className={`px-3 py-1 rounded-lg font-black text-xs transition flex-shrink-0 ${isSelected ? 'bg-white text-blue-700 shadow' : 'bg-slate-200 text-slate-800'}`}>
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
                  <div className={`bg-slate-50 rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm transition-all duration-300 ${selectedImportItem ? 'border-4 border-blue-600 ring-4 ring-blue-100' : 'border-2 border-slate-300'}`}>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div>
                        <span className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider block">Import GD Items Details</span>
                        <span className="text-xs sm:text-sm text-blue-700 font-mono font-black">GD: {selectedGdObject.gdNumber || selectedGdObject.importGdNumber}</span>
                      </div>
                      <button onClick={handleClearImportTable} className="p-2 rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 transition cursor-pointer">
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>

                    {!selectedGdObject.items || selectedGdObject.items.length === 0 ? (
                      <p className="text-xs sm:text-sm text-slate-500 text-center py-6 font-bold">No items found for this GD.</p>
                    ) : (
                      <div className="overflow-x-auto border-2 border-slate-300 rounded-2xl shadow-sm bg-white">
                        <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
                          <thead className="bg-slate-900 text-white font-black uppercase text-[11px] sm:text-xs tracking-wider">
                            <tr>
                              <th className="px-3 sm:px-5 py-3.5 w-12 text-center">Select</th>
                              <th className="px-3 sm:px-5 py-3.5 text-left">Sr #</th>
                              <th className="px-3 sm:px-5 py-3.5 text-left">Input Description</th>
                              <th className="px-3 sm:px-5 py-3.5 text-left">Input PCT</th>
                              <th className="px-3 sm:px-5 py-3.5 text-right">Import Qty</th>
                              <th className="px-3 sm:px-5 py-3.5 text-left">UOM</th>
                              <th className="px-3 sm:px-5 py-3.5 text-right">Import Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 text-slate-900 font-medium">
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
                                  className={`cursor-pointer transition ${isItemSel ? 'bg-blue-50 font-black' : 'hover:bg-slate-50'}`}
                                >
                                  <td className="px-3 sm:px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                                    <button type="button" onClick={() => handleSelectImportItem(item)} className="text-blue-600 focus:outline-none cursor-pointer">
                                      {isItemSel ? <CheckCircle className="w-5 h-5 text-blue-600 fill-blue-100" /> : <Circle className="w-5 h-5 text-slate-400" />}
                                    </button>
                                  </td>
                                  <td className="px-3 sm:px-5 py-3.5 font-bold text-slate-700">{idx + 1}</td>
                                  <td className="px-3 sm:px-5 py-3.5 font-black text-slate-900">{description}</td>
                                  <td className="px-3 sm:px-5 py-3.5 font-mono font-black text-slate-900">{hsCode}</td>
                                  <td className="px-3 sm:px-5 py-3.5 text-right font-mono font-black text-slate-900">{formatNumber(qty, 0)}</td>
                                  <td className="px-3 sm:px-5 py-3.5 font-mono font-black text-slate-700">{uom}</td>
                                  <td className="px-3 sm:px-5 py-3.5 text-right font-mono font-black text-slate-900">{formatNumber(val, 2)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full min-h-[200px] bg-slate-50 border-2 border-slate-300 border-dashed rounded-2xl flex items-center justify-center p-6 text-center text-xs sm:text-sm font-bold text-slate-500">
                    Please select any Import GD from the list to view its details here.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* --- 2. Export GD Box --- */}
          <div className="bg-white border-2 sm:border-4 border-slate-900 rounded-2xl p-4 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded-full bg-blue-600"></span> Select Export GD *
              </h3>
              {selectedExportGdObject && (
                <span className="text-xs sm:text-sm font-mono bg-blue-50 text-blue-700 px-3.5 py-1.5 rounded-xl border border-blue-300 font-black inline-flex items-center gap-2">
                  <Check className="w-4 h-4" /> Selected Export GD: {selectedExportGdObject.exportGdNumber || selectedExportGdObject.gdNumber}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-4 space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Export GD No..."
                    value={exportSearchQuery}
                    onChange={(e) => setExportSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div className="max-h-72 overflow-y-auto space-y-2.5">
                  {filteredExports.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4 font-bold bg-slate-50 rounded-xl border border-slate-200">No export GDs found.</p>
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
                          className={`p-3.5 sm:p-4 rounded-xl text-xs sm:text-sm cursor-pointer border-2 transition flex justify-between items-center ${isSelected ? 'bg-blue-600 border-blue-900 text-white font-black shadow-lg' : 'bg-slate-50 border-slate-300 text-slate-900 hover:bg-slate-100 font-bold'}`}
                        >
                          <div className="truncate pr-2">
                            <span className={`block truncate font-mono text-sm sm:text-base font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>{expGdNumberStr}</span>
                            <span className={`text-[11px] sm:text-xs mt-0.5 block ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>{expItemsCount} items</span>
                          </div>
                          <span className={`px-3 py-1 rounded-lg font-black text-xs transition flex-shrink-0 ${isSelected ? 'bg-white text-blue-700 shadow' : 'bg-slate-200 text-slate-800'}`}>
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
                  <div className={`bg-slate-50 rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm transition-all duration-300 ${selectedExportItem ? 'border-4 border-blue-600 ring-4 ring-blue-100' : 'border-2 border-slate-300'}`}>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div>
                        <span className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider block">Export GD Items Details</span>
                        <span className="text-xs sm:text-sm text-blue-700 font-mono font-black">GD: {selectedExportGdObject.exportGdNumber || selectedExportGdObject.gdNumber}</span>
                      </div>
                      <button onClick={handleClearExportTable} className="p-2 rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 transition cursor-pointer">
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>

                    {loadingExportDetails ? (
                      <p className="text-xs sm:text-sm text-slate-500 text-center py-6 font-bold">Loading export details...</p>
                    ) : !selectedExportGdObject.items || selectedExportGdObject.items.length === 0 ? (
                      <p className="text-xs sm:text-sm text-slate-500 text-center py-6 font-bold">No export items found.</p>
                    ) : (
                      <div className="overflow-x-auto border-2 border-slate-300 rounded-2xl shadow-sm bg-white">
                        <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
                          <thead className="bg-slate-900 text-white font-black uppercase text-[11px] sm:text-xs tracking-wider">
                            <tr>
                              <th className="px-3 sm:px-5 py-3.5 w-12 text-center">Select</th>
                              <th className="px-3 sm:px-5 py-3.5 text-left">Sr #</th>
                              <th className="px-3 sm:px-5 py-3.5 text-left">Particulars</th>
                              <th className="px-3 sm:px-5 py-3.5 text-left">HS Code</th>
                              <th className="px-3 sm:px-5 py-3.5 text-right">Quantity</th>
                              <th className="px-3 sm:px-5 py-3.5 text-left">UOM</th>
                              <th className="px-3 sm:px-5 py-3.5 text-right">Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 text-slate-900 font-medium">
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
                                  className={`cursor-pointer transition ${isItemSel ? 'bg-blue-50 font-black' : 'hover:bg-slate-50'}`}
                                >
                                  <td className="px-3 sm:px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                                    <button type="button" onClick={() => handleSelectExportItem(item)} className="focus:outline-none cursor-pointer">
                                      {isItemSel ? <CheckCircle className="w-5 h-5 text-blue-600 fill-blue-100" /> : <Circle className="w-5 h-5 text-slate-400" />}
                                    </button>
                                  </td>
                                  <td className="px-3 sm:px-5 py-3.5 font-bold text-slate-700">{idx + 1}</td>
                                  <td className="px-3 sm:px-5 py-3.5 font-black text-slate-900">{description}</td>
                                  <td className="px-3 sm:px-5 py-3.5 font-mono font-black text-slate-900">{hsCode}</td>
                                  <td className="px-3 sm:px-5 py-3.5 text-right font-mono font-black text-slate-900" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-2">
                                      <span>{formatNumber(qty, 0)}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingExportQtyItem(item);
                                          setTempExportQtyVal(qty.toString());
                                          setIsUpdatedInModal(false);
                                          setCalculatedBalancedQty(0);
                                          setCalculatedBalancedVal(0);
                                        }}
                                        className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-300 transition cursor-pointer"
                                        title="Edit Quantity"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                  <td className="px-3 sm:px-5 py-3.5 font-mono font-black text-slate-700">KG</td>
                                  <td className="px-3 sm:px-5 py-3.5 text-right font-mono font-black text-slate-900">{formatNumber(val, 2)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full min-h-[200px] bg-slate-50 border-2 border-slate-300 border-dashed rounded-2xl flex items-center justify-center p-6 text-center text-xs sm:text-sm font-bold text-slate-500">
                    Please select any Export GD from the list to view its details here.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* --- 3. Analysis Certificate Box --- */}
          <div className="bg-white border-2 sm:border-4 border-slate-900 rounded-2xl p-4 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded-full bg-blue-600"></span> Select Analysis Certificate *
              </h3>
              {selectedCertObject && (
                <span className="text-xs sm:text-sm font-mono bg-blue-50 text-blue-700 px-3.5 py-1.5 rounded-xl border border-blue-300 font-black inline-flex items-center gap-2">
                  <Check className="w-4 h-4" /> Selected Certificate: {selectedCertObject.certificateNumber || selectedCertObject.certNumber}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-4 space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Certificate No..."
                    value={certSearchQuery}
                    onChange={(e) => setCertSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div className="max-h-72 overflow-y-auto space-y-2.5">
                  {filteredCerts.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4 font-bold bg-slate-50 rounded-xl border border-slate-200">No certificates found.</p>
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
                          className={`p-3.5 sm:p-4 rounded-xl text-xs sm:text-sm cursor-pointer border-2 transition flex justify-between items-center ${isSelected ? 'bg-blue-600 border-blue-900 text-white font-black shadow-lg' : 'bg-slate-50 border-slate-300 text-slate-900 hover:bg-slate-100 font-bold'}`}
                        >
                          <div className="truncate pr-2">
                            <span className={`block truncate font-mono text-sm sm:text-base font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>{certNumberStr}</span>
                            <span className={`text-[11px] sm:text-xs mt-0.5 block ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>{certItemsCount} items</span>
                          </div>
                          <span className={`px-3 py-1 rounded-lg font-black text-xs transition flex-shrink-0 ${isSelected ? 'bg-white text-blue-700 shadow' : 'bg-slate-200 text-slate-800'}`}>
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
                  <div className={`bg-slate-50 rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm transition-all duration-300 ${selectedCertItem ? 'border-4 border-blue-600 ring-4 ring-blue-100' : 'border-2 border-slate-300'}`}>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div>
                        <span className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider block">Analysis Certificate Items Details</span>
                        <span className="text-xs sm:text-sm text-blue-700 font-mono font-black">Cert #: {selectedCertObject.certificateNumber || selectedCertObject.certNumber}</span>
                      </div>
                      <button onClick={handleClearCertTable} className="p-2 rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 transition cursor-pointer">
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>

                    {(!selectedCertObject.items && !selectedCertObject.certificateItems) || 
                       ((selectedCertObject.items?.length || 0) === 0 && (selectedCertObject.certificateItems?.length || 0) === 0) ? (
                      <p className="text-xs sm:text-sm text-slate-500 text-center py-6 font-bold">No certificate items found.</p>
                    ) : (
                      <div className="overflow-x-auto border-2 border-slate-300 rounded-2xl shadow-sm bg-white">
                        <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
                          <thead className="bg-slate-900 text-white font-black uppercase text-[11px] sm:text-xs tracking-wider">
                            <tr>
                              <th className="px-3 sm:px-5 py-3.5 w-12 text-center">Select</th>
                              <th className="px-3 sm:px-5 py-3.5 text-left">Sr #</th>
                              <th className="px-3 sm:px-5 py-3.5 text-left">Particulars</th>
                              <th className="px-3 sm:px-5 py-3.5 text-left">HS Code</th>
                              <th className="px-3 sm:px-5 py-3.5 text-right">Consumption (Net IOR)</th>
                              <th className="px-3 sm:px-5 py-3.5 text-right">Wastages</th>
                              <th className="px-3 sm:px-5 py-3.5 text-right">Total (Gross IOR)</th>
                              <th className="px-3 sm:px-5 py-3.5 text-right">%age</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 text-slate-900 font-medium">
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
                                  className={`cursor-pointer transition ${isItemSel ? 'bg-blue-50 font-black' : 'hover:bg-slate-50'}`}
                                >
                                  <td className="px-3 sm:px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                                    <button type="button" onClick={() => handleSelectCertItem(item)} className="text-blue-600 focus:outline-none cursor-pointer">
                                      {isItemSel ? <CheckCircle className="w-5 h-5 text-blue-600 fill-blue-100" /> : <Circle className="w-5 h-5 text-slate-400" />}
                                    </button>
                                  </td>
                                  <td className="px-3 sm:px-5 py-3.5 font-bold text-slate-700">{idx + 1}</td>
                                  <td className="px-3 sm:px-5 py-3.5 font-black text-slate-900">{description}</td>
                                  <td className="px-3 sm:px-5 py-3.5 font-mono font-black text-slate-900">{hsCode}</td>
                                  <td className="px-3 sm:px-5 py-3.5 text-right font-mono font-black text-blue-700">{formatNumber(qty, 4)}</td>
                                  <td className="px-3 sm:px-5 py-3.5 text-right font-mono font-black text-slate-700">{formatNumber(wastQty, 4)}</td>
                                  <td className="px-3 sm:px-5 py-3.5 text-right font-mono font-black text-slate-900">{formatNumber(inputWast, 4)}</td>
                                  <td className="px-3 sm:px-5 py-3.5 text-right font-mono font-black text-emerald-700">{formatNumber(wastage, 2)}%</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full min-h-[200px] bg-slate-50 border-2 border-slate-300 border-dashed rounded-2xl flex items-center justify-center p-6 text-center text-xs sm:text-sm font-bold text-slate-500">
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
        <div className="bg-white border-2 sm:border-4 border-slate-900 rounded-2xl p-4 sm:p-8 shadow-2xl space-y-6 mt-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-200">
                <Calculator className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div>
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest bg-blue-100 text-blue-800 px-3 py-1 rounded-full border border-blue-300">
                  Automated Reconciliation Engine
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">Consumption &amp; Wastage Calculation Summary</h3>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <span className="text-xs sm:text-sm font-mono font-black text-emerald-800 bg-emerald-100 px-4 py-2.5 rounded-xl border border-emerald-300 text-center">
                COMPLIANCE VERIFIED
              </span>
              <button
                type="button"
                onClick={handleSaveReconciliation}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl shadow-xl transition cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
                {isSaving ? 'Saving...' : 'Save Reconciliation'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl border-2 border-slate-300 hover:border-blue-500 transition space-y-2">
              <span className="text-xs sm:text-sm text-slate-700 uppercase tracking-wider block font-black">Export Quantity (GD)</span>
              <span className="font-mono font-black text-slate-900 text-lg sm:text-xl block">{formatNumber(exportQty, 0)} KG</span>
            </div>

            <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl border-2 border-blue-300 hover:border-blue-600 transition space-y-2">
              <span className="text-xs sm:text-sm text-slate-700 uppercase tracking-wider block font-black">Consumption as per IOCO (Net IOR)</span>
              <span className="font-mono font-black text-blue-700 text-lg sm:text-xl block">{formatNumber(certReqQty, 4)}</span>
            </div>

            <div className="bg-blue-50 border-2 border-blue-500 ring-2 ring-blue-100 p-4 sm:p-6 rounded-2xl space-y-2">
              <span className="text-xs sm:text-sm text-blue-800 uppercase tracking-wider font-black block">Total Consumed Qty</span>
              <span className="font-mono font-black text-blue-700 text-lg sm:text-xl block">{formatNumber(totalConsumedQty, 4)} KG</span>
            </div>

            <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl border-2 border-slate-300 hover:border-blue-500 transition space-y-2">
              <span className="text-xs sm:text-sm text-slate-700 uppercase tracking-wider block font-black">Total Consumed Value</span>
              <span className="font-mono font-black text-slate-900 text-lg sm:text-xl block">{formatNumber(totalConsumedValue, 2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto pt-2">
            <div className="bg-slate-50 border-2 border-slate-300 hover:border-amber-500 transition p-4 sm:p-6 rounded-2xl space-y-2 text-center">
              <span className="text-xs sm:text-sm text-slate-700 uppercase tracking-wider block font-black">Total Wastage Qty</span>
              <span className="font-mono font-black text-slate-900 text-lg sm:text-xl block">{formatNumber(totalWastageQty, 4)} KG</span>
            </div>

            <div className="bg-slate-50 border-2 border-emerald-400 hover:border-emerald-600 transition p-4 sm:p-6 rounded-2xl space-y-2 text-center">
              <span className="text-xs sm:text-sm text-slate-700 uppercase tracking-wider block font-black">Balanced Quantity</span>
              <span className="font-mono font-black text-emerald-700 text-lg sm:text-xl block">{formatNumber(displayBalancedQty, 4)} KG</span>
            </div>

            <div className="bg-slate-50 border-2 border-slate-300 hover:border-blue-500 transition p-4 sm:p-6 rounded-2xl space-y-2 text-center">
              <span className="text-xs sm:text-sm text-slate-700 uppercase tracking-wider block font-black">Balanced Value</span>
              <span className="font-mono font-black text-slate-900 text-lg sm:text-xl block">{formatNumber(displayBalancedValue, 2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* --- RECONCILIATION STATEMENTS MATRIX TABLES WITH PARTY & DATE FILTERS --- */}
      <div className="space-y-6 sm:space-y-10 mt-10">
        <div className="bg-white border-2 sm:border-4 border-slate-900 rounded-2xl p-4 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Reconciliation Statements</h2>
              <p className="text-xs sm:text-sm text-blue-700 font-black uppercase tracking-wider mt-1">
                Filter statements by Party and Date Range below.
              </p>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={handlePrintAllFilteredStatements}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl transition cursor-pointer shadow-lg"
              >
                <Printer className="w-4 h-4 sm:w-5 sm:h-5" /> Print All Filtered
              </button>

              {partyReconciliations.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllReconciliations}
                  disabled={isClearing}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl transition cursor-pointer shadow-lg"
                >
                  {isClearing ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />}
                  {isClearing ? 'Clearing...' : 'Clear Statements'}
                </button>
              )}
            </div>
          </div>

          {/* FILTER BAR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end bg-slate-50 p-4 sm:p-6 rounded-2xl border-2 border-slate-200">
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">Filter By Party</label>
              <select
                value={filterPartyId}
                onChange={(e) => setFilterPartyId(e.target.value)}
                className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer shadow-sm"
              >
                <option value="ALL">-- All Parties --</option>
                {parties.map(p => (
                  <option key={p.id} value={p.id}>{p.companyName}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 shadow-sm font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 shadow-sm font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  setFilterPartyId('ALL');
                  setFromDate('');
                  setToDate('');
                  setStatementsSearchQuery('');
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer border border-slate-300 shadow-sm"
              >
                <RotateCcw className="w-4 h-4" /> Reset Filters
              </button>
            </div>
          </div>

          <div className="relative max-w-full">
            <Search className="w-5 h-5 absolute left-4 top-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search statements by GD No or Item..."
              value={statementsSearchQuery}
              onChange={(e) => setStatementsSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {loadingReconciliations ? (
          <div className="text-center py-12 text-slate-500 text-sm font-bold bg-white border-2 sm:border-4 border-slate-900 rounded-2xl shadow-xl">
            Loading saved reconciliations from database...
          </div>
        ) : Object.keys(groupedReconciliations).length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm font-bold bg-white border-2 sm:border-4 border-slate-900 rounded-2xl shadow-xl">
            No matching reconciliation statements found for the selected filter.
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
              <div key={groupKey} className="bg-white border-2 sm:border-4 border-slate-900 rounded-2xl p-4 sm:p-8 shadow-xl space-y-6">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between border-b border-slate-200 pb-5 gap-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-blue-600 flex-shrink-0" />
                    <h3 className="text-xs sm:text-base font-black text-slate-900 uppercase tracking-wide">
                      GD: <span className="text-blue-700 font-mono">{importGdNo}</span> &bull; Item: <span className="text-slate-800">{itemDesc}</span> &bull; Qty: <span className="text-blue-700 font-mono">{formatNumber(impQtyStr, 0)}</span>
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full xl:w-auto justify-start xl:justify-end">
                    <span className="text-xs sm:text-sm font-mono bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-300 font-black text-slate-800">
                      Entries: {rows.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleExportExcel(groupKey, rows, importGdNo, itemDesc)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow transition cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> Excel
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePrintStatement(groupKey)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow transition cursor-pointer"
                    >
                      <Printer className="w-4 h-4" /> Print
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClearSingleGdStatement(groupKey, records)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" /> Clear
                    </button>
                  </div>
                </div>

                <div id={`statement-table-${groupKey}`} className="overflow-x-auto border-2 border-slate-300 rounded-2xl shadow-sm bg-white">
                  <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200">
                        <th colSpan={20} className="py-4 px-4 text-center text-slate-900 font-black text-base sm:text-xl tracking-wider uppercase">
                          RECONCILIATION STATEMENT M/s - {currentPartyNameText}
                        </th>
                      </tr>
                      <tr className="bg-slate-100 border-b border-slate-200">
                        <th colSpan={20} className="py-3 px-4 text-center text-slate-800 font-black text-sm sm:text-base tracking-wider uppercase">
                          EFS Authorization Cert No.: {partyEfsCertNo}
                        </th>
                      </tr>

                      <tr className="bg-slate-900 text-white font-black uppercase tracking-wider border-b border-slate-200 text-center text-[11px] sm:text-xs">
                        <th></th>
                        <th colSpan={5} className="bg-blue-900 text-blue-100 px-3 py-2.5 border-r border-slate-700">Input</th>
                        <th colSpan={5} className="bg-slate-800 text-slate-200 px-3 py-2.5 border-r border-slate-700">IOR</th>
                        <th colSpan={6} className="bg-blue-950 text-blue-100 px-3 py-2.5 border-r border-slate-700">Output</th>
                        <th colSpan={2} className="bg-slate-800 text-slate-200 px-3 py-2.5 border-r border-slate-700">Balance &amp; Value</th>
                        <th className="bg-slate-900 text-white px-3 py-2.5 no-print">ACTIONS</th>
                      </tr>

                      <tr className="bg-slate-100 text-slate-800 font-black uppercase text-[11px] sm:text-xs tracking-wider text-left border-b border-slate-200">
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
                        <th className="px-3 py-3.5 text-center no-print">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-900 font-medium">
                      {rows.map((rec: any, idx: number) => (
                        <tr key={rec.id || idx} className="hover:bg-slate-50 transition">
                          <td className="px-3 py-3.5 text-center font-bold text-slate-700">{idx + 1}</td>
                          <td className="px-3 py-3.5 font-mono font-black text-blue-700">
                            {idx === 0 ? (rec.importGdNo || importGdNo) : ''}
                          </td>
                          <td className="px-3 py-3.5 font-black text-slate-900">
                            {idx === 0 ? (rec.importParticulars || rec.inputDescription || itemDesc) : ''}
                          </td>
                          <td className="px-3 py-3.5 text-right font-mono font-black text-slate-900">
                            {idx === 0 ? formatNumber(rec.importQty || rec.importQtyKg || 0, 0) : ''}
                          </td>
                          <td className="px-3 py-3.5 text-right font-mono font-black text-slate-900">
                            {idx === 0 ? formatNumber(rec.importValue || rec.importValuePkr || 0, 2) : ''}
                          </td>
                          <td className="px-3 py-3.5 font-mono font-black text-slate-800">
                            {idx === 0 ? (rec.importHsCode || rec.inputPct || 'N/A') : ''}
                          </td>
                          <td className="px-3 py-3.5 font-mono font-black text-slate-800">
                            {rec.analysisCertNo || 'N/A'}
                          </td>
                          <td className="px-3 py-3.5 text-right font-mono font-black text-blue-700">{formatNumber(rec.requirementQty || rec.netIocoConsumption || 0, 4)}</td>
                          <td className="px-3 py-3.5 text-right font-mono font-black text-slate-700">{formatNumber(rec.wastageQty || rec.iocoWastageQty || 0, 4)}</td>
                          <td className="px-3 py-3.5 text-right font-mono font-black text-slate-900">{formatNumber(rec.grossIocoConsumption || rec.inputWithWastage || 0, 4)}</td>
                          <td className="px-3 py-3.5 text-right font-mono font-black text-emerald-700">{formatNumber(rec.wastagePct || rec.wastagePercentage || 0, 2)}%</td>
                          <td className="px-3 py-3.5 font-mono font-black text-blue-700">{rec.exportGdNo || 'N/A'}</td>
                          <td className="px-3 py-3.5 font-black text-slate-900">{rec.exportDescription || 'Export Item'}</td>
                          <td className="px-3 py-3.5 text-right font-mono font-black text-slate-900">{formatNumber(rec.resolvedExportQty, 0)}</td>
                          <td className="px-3 py-3.5 text-right font-mono font-black text-slate-900">{formatNumber(rec.exportValuePkr || 0, 2)}</td>
                          <td className="px-3 py-3.5 text-right font-mono font-black text-blue-700">{formatNumber(rec.resolvedTotalConsumed, 4)}</td>
                          <td className="px-3 py-3.5 text-right font-mono font-black text-slate-700">{formatNumber(rec.resolvedWastageQty, 4)}</td>
                          <td className="px-3 py-3.5 text-right font-mono font-black text-emerald-700">{formatNumber(rec.computedClosingBalance, 4)}</td>
                          <td className="px-3 py-3.5 text-right font-mono font-black text-slate-900">{formatNumber(rec.valueAddition || 0, 2)}%</td>
                          <td className="px-3 py-3.5 text-center no-print">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(rec.id)}
                                className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-300 transition cursor-pointer shadow-sm"
                                title="Delete Entry"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {/* TOTAL ROW FOR CONSUMPTION & WASTAGES */}
                      <tr className="bg-slate-900 font-black text-white border-t-4 border-slate-900">
                        <td colSpan={15} className="px-4 py-4 text-right uppercase tracking-wider text-white text-xs sm:text-sm">
                          TOTAL:
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-cyan-400 text-xs sm:text-sm">
                          {formatNumber(rows.reduce((sum, r) => sum + Number(r.resolvedTotalConsumed || 0), 4), 4)}
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-amber-400 text-xs sm:text-sm">
                          {formatNumber(rows.reduce((sum, r) => sum + Number(r.resolvedWastageQty || 0), 4), 4)}
                        </td>
                        <td colSpan={2} className="px-4 py-4"></td>
                        <td className="px-4 py-4 text-center no-print"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* QUICK EDIT MODAL FOR EXPORT GD ITEM QUANTITY, VALUE, & BALANCES (TWO-STEP: UPDATE -> SAVE) */}
      {editingExportQtyItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white border-2 sm:border-4 border-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg sm:text-xl font-black text-slate-900">Edit Export Quantity &amp; Balanced Values</h3>
            
            <div className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-800 font-black uppercase tracking-wider mb-2">Quantity (KG)</label>
                <input 
                  type="number" 
                  value={tempExportQtyVal} 
                  onChange={e => {
                    setTempExportQtyVal(e.target.value);
                    setIsUpdatedInModal(false);
                  }} 
                  className="w-full p-3.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 font-mono font-bold text-base" 
                />
              </div>

              {/* CALCULATED EXPORT VALUE DISPLAY */}
              <div className="bg-blue-50 p-4 rounded-2xl border-2 border-blue-300 space-y-1">
                <span className="text-[11px] font-black text-blue-800 uppercase tracking-wider block">Calculated Export Value</span>
                <span className="font-mono font-black text-blue-700 text-base block">
                  {formatNumber(
                    (Number(editingExportQtyItem.qtyOfExports ?? 1) > 0 
                      ? (Number(editingExportQtyItem.valueOfeExports ?? 0) / Number(editingExportQtyItem.qtyOfExports ?? 1)) * Number(tempExportQtyVal || 0)
                      : Number(editingExportQtyItem.valueOfeExports ?? 0)), 
                    2
                  )} Rs.
                </span>
              </div>

              {/* BALANCED QUANTITY & BALANCED VALUE DISPLAY (Shown after clicking Update) */}
              {isUpdatedInModal && (
                <div className="grid grid-cols-2 gap-3 animate-fadeIn">
                  <div className="bg-emerald-50 p-3.5 rounded-2xl border-2 border-emerald-300 space-y-1">
                    <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">Balanced Export Qty</span>
                    <span className="font-mono font-black text-emerald-700 text-sm block">
                      {formatNumber(calculatedBalancedQty, 4)} KG
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border-2 border-slate-300 space-y-1">
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">Balanced Export Value</span>
                    <span className="font-mono font-black text-slate-900 text-sm block">
                      {formatNumber(calculatedBalancedVal, 2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button 
                type="button"
                onClick={() => setEditingExportQtyItem(null)} 
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer border border-slate-300"
              >
                Cancel
              </button>

              {!isUpdatedInModal ? (
                <button 
                  type="button"
                  onClick={handleModalUpdateClick} 
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow transition cursor-pointer"
                >
                  Update
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={handleModalSaveClick} 
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow transition cursor-pointer"
                >
                  Save
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gradient-to-r from-blue-700 via-blue-900 to-slate-950 text-blue-200 text-center py-4 sm:py-5 text-xs sm:text-sm font-bold border-t border-blue-900 w-full shadow-inner rounded-2xl mt-12">
        &copy; 2026 Customs Clearing ERP &bull; Powered by EFS Advanced Compliance Engine. All rights reserved.
      </footer>
    </div>
  );
}