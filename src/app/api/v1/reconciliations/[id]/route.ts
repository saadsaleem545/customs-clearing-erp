import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    const { exportQtyKg, exportValuePkr, consumptionIncWastage, actualWastageKg } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const existingItem = await prisma.reconciliationItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    const expQty = Number(exportQtyKg ?? existingItem.exportQtyKg ?? 0);
    const expVal = Number(exportValuePkr ?? existingItem.exportValuePkr ?? 0);
    const totalConsumed = Number(consumptionIncWastage ?? existingItem.consumptionIncWastage ?? 0);
    const wastageKg = Number(actualWastageKg ?? (existingItem as any).actualWastageKg ?? 0);

    const importQty = Number(existingItem.importQtyKg ?? 0);
    const importVal = Number(existingItem.importValuePkr ?? 0);

    const closingBalanceKg = importQty - totalConsumed;
    const unitRate = importQty > 0 ? importVal / importQty : 0;
    const consumedVal = unitRate * totalConsumed;
    const valueAddition = expVal > 0 ? (consumedVal / expVal) * 100 : 0;

    // Strict payload matching exact prisma schema fields only
    const updatedItem = await prisma.reconciliationItem.update({
      where: { id },
      data: {
        exportQtyKg: expQty,
        exportValuePkr: expVal,
        consumptionIncWastage: totalConsumed,
        actualWastageKg: wastageKg,
        closingBalanceKg: closingBalanceKg,
        valueAddition: valueAddition,
      },
    });

    return NextResponse.json({ success: true, data: updatedItem, message: 'Updated successfully' });
  } catch (error: any) {
    console.error('Update reconciliation error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}