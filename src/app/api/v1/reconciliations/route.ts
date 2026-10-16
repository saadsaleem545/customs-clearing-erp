import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// GET /api/v1/reconciliations - List Party Reconciliation Statements
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const partyId = searchParams.get('partyId');
    const search = searchParams.get('search') || '';

    const whereCondition: any = {};

    if (partyId) {
      whereCondition.partyId = partyId;
    }

    if (search) {
      whereCondition.OR = [
        { reconciliationNo: { contains: search, mode: 'insensitive' } },
        { party: { companyName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const reconciliations = await prisma.reconciliation.findMany({
      where: whereCondition,
      orderBy: { statementDate: 'desc' },
      include: {
        party: {
          select: { id: true, companyName: true, partyCode: true, ntn: true },
        },
        items: {
          include: {
            inputMaterial: true,
            exportGd: true,
          },
        },
      },
    });

    const allItems: any[] = [];
    reconciliations.forEach(recon => {
      if (recon.items && recon.items.length > 0) {
        recon.items.forEach(item => {
          allItems.push({
            ...item,
            partyId: recon.partyId,
            reconciliationNo: recon.reconciliationNo,
            statementDate: recon.statementDate,
          });
        });
      }
    });

    return NextResponse.json({ success: true, data: allItems });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/v1/reconciliations - Auto-Sync & Refresh Saved Reconciliations for a Party
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { partyId } = body;

    if (!partyId) {
      return NextResponse.json({ success: false, error: 'Party ID is required for syncing' }, { status: 400 });
    }

    const reconHeaders = await prisma.reconciliation.findMany({
      where: { partyId },
      include: { items: { include: { inputMaterial: true, exportGd: { include: { items: true } } } } },
    });

    if (!reconHeaders || reconHeaders.length === 0) {
      return NextResponse.json({ success: true, message: 'No reconciliations found to sync' });
    }

    await prisma.$transaction(async (tx) => {
      for (const recon of reconHeaders) {
        for (const item of recon.items) {
          const inputMat = item.inputMaterial;
          const exportGd = item.exportGd;

          if (inputMat && exportGd && exportGd.items && exportGd.items.length > 0) {
            const expItem: any = exportGd.items[0];
            const expQty = new Decimal(item.exportQtyKg?.toString() || expItem.qtyOfExports?.toString() || '0');
            const importQty = new Decimal(item.importQtyKg?.toString() || inputMat.importedQty?.toString() || '0');
            const importVal = new Decimal(item.importValuePkr?.toString() || inputMat.importValuePkr?.toString() || '0');
            
            const netIoco = new Decimal(item.netIocoConsumption?.toString() || '0');
            const iocoWastage = new Decimal(item.iocoWastageQty?.toString() || '0');
            const grossConsumption = netIoco.plus(iocoWastage);

            const totalConsumption = expQty.times(grossConsumption);
            const totalWastage = iocoWastage.times(expQty);
            const closingBalance = importQty.minus(totalConsumption);

            const costPerKg = importQty.greaterThan(0) ? importVal.dividedBy(importQty) : new Decimal(0);
            const consumedVal = totalConsumption.times(costPerKg);
            const expVal = new Decimal(item.exportValuePkr?.toString() || expItem.valueOfeExports?.toString() || '0');

            let valueAddition = new Decimal(0);
            if (consumedVal.greaterThan(0) && expVal.greaterThan(0)) {
              valueAddition = expVal.minus(consumedVal).dividedBy(consumedVal).times(100);
            }

            let itemStatus: any = 'RECONCILED';
            if (closingBalance.lessThan(0)) itemStatus = 'EXCESS';
            else if (closingBalance.greaterThan(0)) itemStatus = 'PARTIALLY_RECONCILED';

            await tx.reconciliationItem.update({
              where: { id: item.id },
              data: {
                consumptionIncWastage: totalConsumption,
                actualWastageKg: totalWastage,
                closingBalanceKg: closingBalance,
                valueAddition: valueAddition,
                itemStatus: itemStatus,
              },
            });
          }
        }
      }
    });

    return NextResponse.json({ success: true, message: 'Reconciliations synced and updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/v1/reconciliations - Run IOR Calculation & Link Import to Export Batch
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      partyId,
      importMaterialId,
      exportGdId,
      exportQtyKg,
      exportValuePkr,
      importGdNumber,
      importParticulars,
      importHsCode,
      importQty: payloadImportQty,
      importValue: payloadImportValue,
      requirementQty,
      wastageQty,
      inputWithWastage,
      wastagePct: payloadWastagePct,
      wastagePctOverride,
      analysisCertNo,
    } = body;

    if (!partyId || !importMaterialId) {
      return NextResponse.json(
        { success: false, error: 'Missing mandatory fields: Party and Input Material ID' },
        { status: 400 }
      );
    }

    let inputMaterial = await prisma.inputMaterial.findUnique({
      where: { id: importMaterialId },
      include: {
        importGdItem: {
          include: { importGd: true },
        },
      },
    });

    if (!inputMaterial) {
      const importGdItem: any = await prisma.importGdItem.findUnique({
        where: { id: importMaterialId },
        include: { importGd: true },
      });

      if (importGdItem) {
        inputMaterial = await prisma.inputMaterial.findFirst({
          where: { importGdItemId: importGdItem.id },
          include: { importGdItem: { include: { importGd: true } } },
        });

        if (!inputMaterial) {
          const qty = Number(payloadImportQty ?? importGdItem.quantity ?? 0);
          const val = Number(payloadImportValue ?? importGdItem.importValueVal ?? importGdItem.assessableValue ?? 0);
          inputMaterial = await prisma.inputMaterial.create({
            data: {
              partyId,
              importGdItemId: importGdItem.id,
              description: importParticulars || importGdItem.itemDescription || 'Import Material',
              pctCode: importHsCode || importGdItem.hsCode || 'N/A',
              importedQty: qty,
              importValuePkr: val,
              iocoRatio: new Decimal(1),
              standardWastagePct: new Decimal(payloadWastagePct ?? 0),
              closingQty: qty,
            },
            include: { importGdItem: { include: { importGd: true } } },
          });
        }
      }
    }

    if (!inputMaterial) {
      return NextResponse.json(
        { success: false, error: 'Input Material record not found or could not be mapped' },
        { status: 404 }
      );
    }

    let exportGdNo = 'STOCK-IN-HAND';
    let exportDesc = 'Active Production Inventory';
    let actualExpVal = new Decimal(exportValuePkr || 0);
    const expQty = new Decimal(exportQtyKg || 0);

    if (exportGdId) {
      const exportGd = await prisma.exportGd.findUnique({
        where: { id: exportGdId },
        include: { items: true },
      });
      if (exportGd) {
        exportGdNo = exportGd.exportGdNumber || (exportGd as any).gdNumber || 'EXP-GD';
        if (exportGd.items && exportGd.items.length > 0) {
          const expItem: any = exportGd.items[0];
          exportDesc = expItem.exportParticulars || expItem.itemDescription || expItem.description || 'Export Item';
          if (!exportValuePkr) {
            actualExpVal = new Decimal((expItem.valueOfeExports ?? expItem.exportValuePkr ?? 0).toString());
          }
        }
      }
    }

    const importQty = new Decimal(payloadImportQty ?? inputMaterial.importedQty.toString());
    const importValuePkr = new Decimal(payloadImportValue ?? inputMaterial.importValuePkr.toString());
    
    const netIocoConsumption = requirementQty !== undefined ? new Decimal(requirementQty) : new Decimal(0);
    const totalWastageKg = wastageQty !== undefined ? new Decimal(wastageQty) : new Decimal(0);
    const consumptionIncWastagePerUnit = inputWithWastage !== undefined ? new Decimal(inputWithWastage) : netIocoConsumption.plus(totalWastageKg);

    const totalConsumptionIncWastage = expQty.times(consumptionIncWastagePerUnit);
    const totalActualWastageKg = totalWastageKg.times(expQty);

    const wastagePct = wastagePctOverride 
      ? new Decimal(wastagePctOverride) 
      : payloadWastagePct !== undefined 
        ? new Decimal(payloadWastagePct) 
        : new Decimal(0);

    const closingBalanceKg = importQty.minus(totalConsumptionIncWastage);
    const unitClaim = expQty.greaterThan(0) ? consumptionIncWastagePerUnit : new Decimal(0);
    const costPerKgImport = importQty.greaterThan(0) ? importValuePkr.dividedBy(importQty) : new Decimal(0);
    const consumedImportValPkr = totalConsumptionIncWastage.times(costPerKgImport);
    
    let valueAdditionPct = new Decimal(0);
    if (consumedImportValPkr.greaterThan(0) && actualExpVal.greaterThan(0)) {
      valueAdditionPct = actualExpVal.minus(consumedImportValPkr).dividedBy(consumedImportValPkr).times(100);
    }

    const differenceKg = importQty.minus(totalConsumptionIncWastage.plus(Decimal.max(0, closingBalanceKg)));
    
    let itemStatus: 'RECONCILED' | 'PARTIALLY_RECONCILED' | 'EXCESS' | 'ATTENTION_REQUIRED' = 'RECONCILED';
    if (closingBalanceKg.lessThan(0)) {
      itemStatus = 'EXCESS';
    } else if (closingBalanceKg.greaterThan(0)) {
      itemStatus = 'PARTIALLY_RECONCILED';
    }

    const result = await prisma.$transaction(async (tx) => {
      let reconHeader = await tx.reconciliation.findFirst({
        where: { partyId },
        orderBy: { statementDate: 'desc' },
      });

      if (!reconHeader) {
        const count = await tx.reconciliation.count();
        reconHeader = await tx.reconciliation.create({
          data: {
            reconciliationNo: `RECON-IOR-2026-${(count + 1).toString().padStart(3, '0')}`,
            partyId,
            periodStart: new Date('2026-01-01'),
            periodEnd: new Date('2026-12-31'),
            status: 'PENDING',
            totalImportQty: importQty,
            totalExportQty: expQty,
            totalWastageQty: totalActualWastageKg,
            totalClosingQty: closingBalanceKg,
            overallStatus: 'Active Dynamic Statement',
          },
        });
      }

      const resolvedImportGdNo = importGdNumber || inputMaterial?.importGdItem?.importGd?.gdNumber || 'GD-IMPORT';
      const resolvedParticulars = importParticulars || inputMaterial.description || 'Import Material';
      const resolvedHsCode = importHsCode || inputMaterial.pctCode || 'N/A';

      const reconItem = await tx.reconciliationItem.create({
        data: {
          reconciliationId: reconHeader.id,
          inputMaterialId: inputMaterial.id,
          exportGdId: exportGdId || null,
          importGdNo: resolvedImportGdNo,
          inputDescription: resolvedParticulars,
          importQtyKg: importQty,
          importValuePkr: importValuePkr,
          inputPct: resolvedHsCode,
          analysisCertNo: analysisCertNo || 'N/A',
          netIocoConsumption,
          iocoWastageQty: totalWastageKg,
          grossIocoConsumption: consumptionIncWastagePerUnit,
          wastagePercentage: wastagePct,
          exportGdNo,
          exportDescription: exportDesc,
          exportQtyKg: expQty,
          exportValuePkr: actualExpVal,
          consumptionIncWastage: totalConsumptionIncWastage,
          actualWastageKg: totalActualWastageKg,
          closingBalanceKg,
          valueAddition: valueAdditionPct,
          unitClaim,
          calculatedDifference: differenceKg,
          itemStatus,
        },
      });

      await tx.inputMaterial.update({
        where: { id: inputMaterial.id },
        data: {
          consumedQty: new Decimal(inputMaterial.consumedQty.toString()).plus(expQty.times(netIocoConsumption)),
          wastageQty: new Decimal(inputMaterial.wastageQty.toString()).plus(totalActualWastageKg),
          closingQty: closingBalanceKg,
        },
      });

      return {
        ...reconItem,
        partyId: reconHeader.partyId,
      };
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/v1/reconciliations - Clear All Saved Reconciliations for a Party
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const partyId = searchParams.get('partyId');

    if (!partyId) {
      return NextResponse.json(
        { success: false, error: 'Party ID is required query parameter' },
        { status: 400 }
      );
    }

    const recons = await prisma.reconciliation.findMany({
      where: { partyId },
      select: { id: true },
    });

    const reconIds = recons.map(r => r.id);

    if (reconIds.length > 0) {
      await prisma.$transaction(async (tx) => {
        await tx.reconciliationItem.deleteMany({
          where: { reconciliationId: { in: reconIds } },
        });

        await tx.reconciliation.deleteMany({
          where: { id: { in: reconIds } },
        });
      });
    }

    return NextResponse.json({ success: true, message: 'All reconciliations cleared successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}