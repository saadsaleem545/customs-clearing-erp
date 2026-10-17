import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// GET /api/v1/reconciliations - Fetch all reconciliations
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const partyId = searchParams.get('partyId');

    const where: any = {};
    if (partyId && partyId !== 'ALL') {
      where.reconciliation = { partyId };
    }

    const items = await prisma.reconciliationItem.findMany({
      where,
      include: {
        reconciliation: {
          include: { party: true }
        },
        inputMaterial: true,
        exportGd: true,
      },
      orderBy: { id: 'desc' },
    });

    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    console.error('Error fetching reconciliations:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/v1/reconciliations - Save Reconciliation Item
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      partyId,
      importMaterialId, // Yeh frontend se aa rahi ID hai (jo ImportGdItem ki ID bhi ho sakti hai)
      exportGdId,
      exportQtyKg,
      exportValuePkr,
      importGdNumber,
      importParticulars,
      importHsCode,
      importQty,
      importValue,
      requirementQty,
      wastageQty,
      inputWithWastage,
      totalConsumedQty,
      actualWastageKg,
      wastagePct,
      exportGdNo,
      exportDescription,
      closingBalance,
      valueAddition,
      analysisCertNo,
      uom,
    } = body;

    if (!partyId || !importMaterialId) {
      return NextResponse.json({ success: false, error: 'Party ID and Import Material ID are required.' }, { status: 400 });
    }

    const finalImportGdNo = (!importGdNumber || importGdNumber === 'GENERAL_GD' || importGdNumber === 'N/A') 
      ? 'GD-REF-VALID' 
      : importGdNumber;

    const finalCertNo = (!analysisCertNo || analysisCertNo === 'N/A') 
      ? 'CERT-REF-VALID' 
      : analysisCertNo;

    const finalDescription = (!importParticulars || importParticulars === 'Standard Item') 
      ? 'Import Material Item' 
      : importParticulars;

    // --- FIX: Ensure a valid InputMaterial record exists ---
    // Pehle check karein ke aaya yeh ID seedhe 'input_materials' mein mojood hai ya nahi
    let validInputMaterialId = importMaterialId;
    let existingInputMaterial = await prisma.inputMaterial.findUnique({
      where: { id: importMaterialId }
    });

    if (!existingInputMaterial) {
      // Agar yeh ID 'input_materials' mein nahi mili, toh ho sakta hai yeh 'ImportGdItem' ki ID ho.
      // Hum check karte hain ke kya is ImportGdItem ke against koi InputMaterial pehle se hai?
      existingInputMaterial = await prisma.inputMaterial.findFirst({
        where: { importGdItemId: importMaterialId }
      });

      if (existingInputMaterial) {
        validInputMaterialId = existingInputMaterial.id;
      } else {
        // Agar bilkul bhi nahi mili, toh hum aik naya InputMaterial record automatically create kar dete hain
        // Taa ke foreign key constraint violate na ho!
        const newCreatedInputMat = await prisma.inputMaterial.create({
          data: {
            partyId: partyId,
            importGdItemId: importMaterialId, // Agar importMaterialId ek valid ImportGdItem id hai
            pctCode: importHsCode || 'N/A',
            description: finalDescription,
            importedQty: new Decimal(importQty || 0),
            importValuePkr: new Decimal(importValue || 0),
            unit: uom || 'Kg',
            iocoRatio: new Decimal(1),
            standardWastagePct: new Decimal(wastagePct || 0),
          }
        });
        validInputMaterialId = newCreatedInputMat.id;
      }
    }
    // -----------------------------------------------------

    let parentRecon = await prisma.reconciliation.findFirst({
      where: { partyId, overallStatus: 'PENDING' }
    });

    if (!parentRecon) {
      parentRecon = await prisma.reconciliation.create({
        data: {
          reconciliationNo: `REC-${Date.now()}`,
          partyId,
          periodStart: new Date(),
          periodEnd: new Date(),
          totalImportQty: new Decimal(importQty || 0),
          totalExportQty: new Decimal(exportQtyKg || 0),
          totalWastageQty: new Decimal(actualWastageKg || 0),
          totalClosingQty: new Decimal(closingBalance || 0),
          overallStatus: 'PENDING',
        }
      });
    }

    const newItem = await prisma.reconciliationItem.create({
      data: {
        reconciliationId: parentRecon.id,
        inputMaterialId: validInputMaterialId, // Ab yahan 100% valid InputMaterial ID jayegi
        exportGdId: exportGdId || null,
        importGdNo: finalImportGdNo,
        inputDescription: finalDescription,
        importQtyKg: new Decimal(importQty || 0),
        importValuePkr: new Decimal(importValue || 0),
        inputPct: importHsCode || 'N/A',
        analysisCertNo: finalCertNo,
        netIocoConsumption: new Decimal(requirementQty || 0),
        iocoWastageQty: new Decimal(wastageQty || 0),
        grossIocoConsumption: new Decimal(inputWithWastage || 0),
        wastagePercentage: new Decimal(wastagePct || 0),
        exportGdNo: exportGdNo || 'N/A',
        exportDescription: exportDescription || 'Export Item',
        exportQtyKg: new Decimal(exportQtyKg || 0),
        exportValuePkr: new Decimal(exportValuePkr || 0),
        consumptionIncWastage: new Decimal(totalConsumedQty || 0),
        actualWastageKg: new Decimal(actualWastageKg || 0),
        closingBalanceKg: new Decimal(closingBalance || 0),
        valueAddition: new Decimal(valueAddition || 0),
        unitClaim: new Decimal(0),
        calculatedDifference: new Decimal(0),
      },
    });

    return NextResponse.json({ success: true, data: newItem }, { status: 201 });
  } catch (error: any) {
    console.error('Error saving reconciliation item:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/v1/reconciliations - Clear all reconciliations for a party
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const partyId = searchParams.get('partyId');

    if (!partyId) {
      return NextResponse.json({ success: false, error: 'Party ID is required.' }, { status: 400 });
    }

    const reconciliations = await prisma.reconciliation.findMany({
      where: { partyId },
      select: { id: true }
    });

    const reconIds = reconciliations.map(r => r.id);

    await prisma.reconciliationItem.deleteMany({
      where: { reconciliationId: { in: reconIds } }
    });

    await prisma.reconciliation.deleteMany({
      where: { partyId }
    });

    return NextResponse.json({ success: true, message: 'All reconciliations cleared successfully.' });
  } catch (error: any) {
    console.error('Error clearing reconciliations:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}