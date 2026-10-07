import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// GET /api/v1/imports - List Import GDs with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const partyId = searchParams.get('partyId');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');

    const whereCondition: any = {};

    if (partyId) {
      whereCondition.partyId = partyId;
    }

    if (status) {
      whereCondition.status = status;
    }

    if (search) {
      whereCondition.OR = [
        { gdNumber: { contains: search, mode: 'insensitive' } },
        { blNumber: { contains: search, mode: 'insensitive' } },
        { party: { companyName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const importGds = await prisma.importGd.findMany({
      where: whereCondition,
      orderBy: { gdDate: 'desc' },
      include: {
        party: {
          select: { id: true, companyName: true, partyCode: true, ntn: true },
        },
        items: true,
        _count: {
          select: { documents: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: importGds });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/v1/imports - Register New Import GD & Auto-Post Stock Ledger
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      gdNumber,
      gdDate,
      partyId,
      countryOfOrigin,
      portOfDischarge,
      blNumber,
      remarks,
      items,
    } = body;

    if (!gdNumber || !partyId || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing mandatory fields: GD Number, Party, and Items' },
        { status: 400 }
      );
    }

    const existing = await prisma.importGd.findUnique({ where: { gdNumber } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Import GD Number ${gdNumber} already exists in database.` },
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

    const result = await prisma.$transaction(async (tx) => {
      const createdGd = await tx.importGd.create({
        data: {
          gdNumber,
          gdDate: new Date(gdDate),
          partyId,
          supplierName: 'EFS Authorized Supplier',
          countryOfOrigin: countryOfOrigin || 'China',
          portOfDischarge: portOfDischarge || 'KICT Karachi',
          blNumber,
          totalAssessableValue: totalAssessableVal,
          totalDutyTaxes: totalDutyTaxVal,
          remarks,
          items: {
            create: processedItems.map(({ iocoRatio, standardWastagePct, ...rest }: any) => rest),
          },
        },
        include: { items: true },
      });

      // Post all line items to Input Material Stock Ledger
      for (let i = 0; i < createdGd.items.length; i++) {
        const itemRecord = createdGd.items[i];
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

      return createdGd;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/v1/imports - Delete Import GD by ID query parameter
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Import GD ID is required for deletion' },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.inputMaterial.deleteMany({
        where: { importGdItem: { importGdId: id } },
      });
      await tx.importGdItem.deleteMany({
        where: { importGdId: id },
      });
      await tx.importGd.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true, message: 'Import GD deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}