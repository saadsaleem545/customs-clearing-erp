import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// PUT /api/v1/imports/[id] - Update Import GD & Line Items Matrix
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await req.json();
    const {
      gdNumber,
      gdDate,
      partyId,
      countryOfOrigin,
      portOfDischarge,
      blNumber,
      status,
      remarks,
      items,
    } = body;

    if (!gdNumber || !partyId || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Required fields missing: GD Number, Party, and Items' },
        { status: 400 }
      );
    }

    let totalAssessableVal = new Decimal(0);
    let totalDutyTaxVal = new Decimal(0);

    const processedItems = items.map((item: any) => {
      const qty = new Decimal(item.quantity || 0);
      const valVal = new Decimal(item.importValueVal || 0);
      const rate = new Decimal(item.exchangeRate || 1);
      const assessable = valVal.times(rate);

      const calculatedUnitPrice = qty.greaterThan(0) ? assessable.dividedBy(qty) : new Decimal(0);

      const cd = new Decimal(item.customsDuty || 0);
      const st = new Decimal(item.salesTax || 0);
      const acd = new Decimal(item.additionalCd || 0);
      const rd = new Decimal(item.regulatoryDuty || 0);
      const it = new Decimal(item.incomeTax || 0);
      const other = new Decimal(item.otherTaxes || 0);

      const totalTaxes = cd.plus(st).plus(acd).plus(rd).plus(it).plus(other);

      totalAssessableVal = totalAssessableVal.plus(assessable);
      totalDutyTaxVal = totalDutyTaxVal.plus(totalTaxes);

      return {
        itemDescription: item.itemDescription,
        hsCode: item.hsCode,
        inputPct: item.hsCode ? item.hsCode.substring(0, 7) : '5402.33',
        quantity: qty,
        unit: item.unit || 'Kg',
        importValueVal: valVal,
        currency: item.currency || 'PKR',
        exchangeRate: rate,
        assessableValue: assessable,
        unitPrice: calculatedUnitPrice,
        customsDuty: cd,
        salesTax: st,
        additionalCd: acd,
        regulatoryDuty: rd,
        incomeTax: it,
        otherTaxes: other,
        totalDutyTaxes: totalTaxes,
        iocoRatio: item.iocoRatio || 1.0,
        standardWastagePct: item.standardWastagePct || 4.5,
      };
    });

    const updatedGd = await prisma.$transaction(async (tx) => {
      // 1. Delete old linked input materials first
      await tx.inputMaterial.deleteMany({
        where: { importGdItem: { importGdId: id } },
      });

      // 2. Delete old line items
      await tx.importGdItem.deleteMany({
        where: { importGdId: id },
      });

      // 3. Update main GD and recreate new line items matrix
      const gd = await tx.importGd.update({
        where: { id },
        data: {
          gdNumber,
          gdDate: new Date(gdDate),
          partyId,
          countryOfOrigin: countryOfOrigin || 'China',
          portOfDischarge: portOfDischarge || 'KICT Karachi',
          blNumber,
          status: status || 'CLEARED',
          totalAssessableValue: totalAssessableVal,
          totalDutyTaxes: totalDutyTaxVal,
          remarks,
          items: {
            create: processedItems.map(({ iocoRatio, standardWastagePct, ...rest }: any) => rest),
          },
        },
        include: { items: true },
      });

      // 4. Re-create Input Material stock ledger entries for all items
      for (let i = 0; i < gd.items.length; i++) {
        const itemRecord = gd.items[i];
        const rawItemInput = processedItems[i];

        await tx.inputMaterial.create({
          data: {
            partyId,
            importGdItemId: itemRecord.id,
            pctCode: itemRecord.inputPct,
            description: itemRecord.itemDescription,
            openingQty: itemRecord.quantity,
            importedQty: itemRecord.quantity,
            consumedQty: new Decimal(0),
            wastageQty: new Decimal(0),
            closingQty: itemRecord.quantity,
            unit: itemRecord.unit,
            importValuePkr: itemRecord.assessableValue,
            iocoRatio: rawItemInput.iocoRatio,
            standardWastagePct: rawItemInput.standardWastagePct,
          },
        });
      }

      return gd;
    });

    return NextResponse.json({ success: true, data: updatedGd });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/v1/imports/[id] - Delete Import GD & Stock Entries
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    await prisma.$transaction(async (tx) => {
      // 1. Delete linked input materials
      await tx.inputMaterial.deleteMany({
        where: { importGdItem: { importGdId: id } },
      });
      // 2. Delete line items
      await tx.importGdItem.deleteMany({
        where: { importGdId: id },
      });
      // 3. Delete Import GD record
      await tx.importGd.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true, message: 'Import GD deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
} 