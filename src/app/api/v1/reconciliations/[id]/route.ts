import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE /api/v1/reconciliations/[id] - Delete single reconciliation item
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Reconciliation Item ID is required' },
        { status: 400 }
      );
    }

    // Check if item exists
    const item = await prisma.reconciliationItem.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Reconciliation item not found' },
        { status: 404 }
      );
    }

    // Delete the specific item from database
    await prisma.reconciliationItem.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Reconciliation item deleted successfully' 
    });
  } catch (error: any) {
    console.error('DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}

// PUT /api/v1/reconciliations/[id] - Update single reconciliation item manually
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { exportQtyKg, exportValuePkr, consumptionIncWastage, actualWastageKg } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Reconciliation Item ID is required' },
        { status: 400 }
      );
    }

    const existingItem = await prisma.reconciliationItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json(
        { success: false, error: 'Reconciliation item not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (exportQtyKg !== undefined && exportQtyKg !== '') updateData.exportQtyKg = Number(exportQtyKg);
    if (exportValuePkr !== undefined && exportValuePkr !== '') updateData.exportValuePkr = Number(exportValuePkr);
    if (consumptionIncWastage !== undefined && consumptionIncWastage !== '') updateData.consumptionIncWastage = Number(consumptionIncWastage);
    if (actualWastageKg !== undefined && actualWastageKg !== '') updateData.actualWastageKg = Number(actualWastageKg);

    const updatedItem = await prisma.reconciliationItem.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ 
      success: true, 
      data: updatedItem, 
      message: 'Reconciliation item updated successfully' 
    });
  } catch (error: any) {
    console.error('PUT Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}