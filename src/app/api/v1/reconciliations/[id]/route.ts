import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    await prisma.reconciliationItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { 
      exportQtyKg, 
      exportValuePkr, 
      consumptionIncWastage, 
      actualWastageKg,
      importGdNo,
      inputDescription,
      analysisCertNo,
      importQtyKg,
      importValuePkr
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const existingItem = await prisma.reconciliationItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    const expQty = Number(exportQtyKg ?? existingItem.exportQtyKg?.toString() ?? 0);
    const expVal = Number(exportValuePkr ?? existingItem.exportValuePkr?.toString() ?? 0);
    const totalConsumed = Number(consumptionIncWastage ?? existingItem.consumptionIncWastage?.toString() ?? 0);
    const wastageKg = Number(actualWastageKg ?? existingItem.actualWastageKg?.toString() ?? 0);

    const importQty = Number(importQtyKg ?? existingItem.importQtyKg?.toString() ?? 0);
    const importVal = Number(importValuePkr ?? existingItem.importValuePkr?.toString() ?? 0);

    const closingBalanceKg = importQty - totalConsumed;
    const unitRate = importQty > 0 ? importVal / importQty : 0;
    const consumedVal = unitRate * totalConsumed;
    const valueAddition = expVal > 0 ? (consumedVal / expVal) * 100 : 0;

    const updatedItem = await prisma.reconciliationItem.update({
      where: { id },
      data: {
        exportQtyKg: new Decimal(expQty),
        exportValuePkr: new Decimal(expVal),
        consumptionIncWastage: new Decimal(totalConsumed),
        actualWastageKg: new Decimal(wastageKg),
        closingBalanceKg: new Decimal(closingBalanceKg),
        valueAddition: new Decimal(valueAddition),
        // Naye fields jo ab easily update ho sakein ge
        ...(importGdNo !== undefined && { importGdNo }),
        ...(inputDescription !== undefined && { inputDescription }),
        ...(analysisCertNo !== undefined && { analysisCertNo }),
        ...(importQtyKg !== undefined && { importQtyKg: new Decimal(importQty) }),
        ...(importValuePkr !== undefined && { importValuePkr: new Decimal(importVal) }),
      },
    });

    return NextResponse.json({ success: true, data: updatedItem, message: 'Updated successfully' });
  } catch (error: any) {
    console.error('Update reconciliation error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}