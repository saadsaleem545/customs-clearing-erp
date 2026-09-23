import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// GET /api/v1/exports
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const partyId = searchParams.get('partyId');

    const where: any = {};
    if (partyId) where.partyId = partyId;

    const exportsList = await prisma.exportGd.findMany({
      where,
      include: {
        party: { select: { id: true, companyName: true, ntn: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Frontend compatibility ke liye items ki keys ko map kar rahe hain
    const formattedData = exportsList.map(rec => ({
      ...rec,
      gdNumber: rec.exportGdNumber,
      items: (rec.items || []).map((it: any) => ({
        ...it,
        gdNumber: rec.exportGdNumber,
        itemDescription: it.exportParticulars || '',
        hsCode: it.exportHsCode || '',
        quantity: Number(it.qtyOfExports || 0),
        uom: 'KG',
        fobValueVal: Number(it.valueOfeExports || 0),
      }))
    }));

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/v1/exports
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { partyId, partyName, gdNumber, gdDate, items } = body;

    let targetPartyId = partyId;

    // Agar partyId nahi di lekin partyName ya Excel se naam aaya hai
    if (!targetPartyId && partyName) {
      let party = await prisma.party.findFirst({
        where: {
          companyName: {
            equals: partyName.trim(),
            mode: 'insensitive',
          },
        },
      });

      if (!party) {
        const randomCode = 'P-' + Math.floor(1000 + Math.random() * 9000);
        party = await prisma.party.create({
          data: {
            partyCode: randomCode,
            companyName: partyName.trim(),
            ntn: 'EFS-' + Math.floor(1000 + Math.random() * 9000),
            contactPerson: 'Auto Generated',
            phone: 'N/A',
            address: 'Auto-registered via System',
          } as any,
        });
      }
      targetPartyId = party.id;
    }

    if (!targetPartyId || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Party and items are required.' },
        { status: 400 }
      );
    }

    // Default Analysis Certificate ensure karna
    let defaultCert = await prisma.analysisCertificate.findFirst();
    if (!defaultCert) {
      defaultCert = await prisma.analysisCertificate.create({
        data: {
          certificateNumber: 'CERT-AUTO-001',
          partyId: targetPartyId,
          approvalDate: new Date(),
        } as any,
      });
    }

    // Group items by GD Number (chahe manual form ho ya excel import)
    const groupedByGd: { [key: string]: any[] } = {};
    for (const item of items) {
      const gdNum = item.gdNumber || gdNumber || 'GD-EXP-UNKNOWN';
      if (!groupedByGd[gdNum]) {
        groupedByGd[gdNum] = [];
      }
      groupedByGd[gdNum].push(item);
    }

    const createdRecords = [];

    for (const [currentGdNum, gdItems] of Object.entries(groupedByGd)) {
      // Check agar ye GD pehle se mojood hai
      let existingGd = await prisma.exportGd.findUnique({
        where: { exportGdNumber: currentGdNum },
      });

      let extractedDate = gdDate ? new Date(gdDate) : new Date();
      if (isNaN(extractedDate.getTime())) {
        extractedDate = new Date();
      }

      if (existingGd) {
        // Agar GD pehle se hai toh purane items delete karke naye daal do ya skip karo (Yahan update/recreate approach)
        await prisma.exportGdItem.deleteMany({ where: { exportGdId: existingGd.id } });
        await prisma.exportGd.update({
          where: { id: existingGd.id },
          data: {
            items: {
              create: gdItems.map((item: any, idx: number) => ({
                serialNo: idx + 1,
                exportHsCode: item.hsCode || item.exportHsCode || '',
                exportParticulars: item.itemDescription || item.exportParticulars || '',
                qtyOfExports: new Decimal(item.quantity || item.qtyOfExports || 0),
                valueOfeExports: new Decimal(item.fobValueVal || item.valueOfeExports || 0),
                importHsCode: '',
                inputValue: new Decimal(0),
                wastageValue: new Decimal(0),
                consumedQty: new Decimal(0),
                wastageQty: new Decimal(0),
              })),
            }
          }
        });
        createdRecords.push(existingGd);
      } else {
        const newExport = await prisma.exportGd.create({
          data: {
            exportGdNumber: currentGdNum,
            date: extractedDate,
            partyId: targetPartyId,
            importGdNumber: 'N/A',
            analysisCertificateId: defaultCert.id,
            items: {
              create: gdItems.map((item: any, idx: number) => ({
                serialNo: idx + 1,
                exportHsCode: item.hsCode || item.exportHsCode || '',
                exportParticulars: item.itemDescription || item.exportParticulars || '',
                qtyOfExports: new Decimal(item.quantity || item.qtyOfExports || 0),
                valueOfeExports: new Decimal(item.fobValueVal || item.valueOfeExports || 0),
                importHsCode: '',
                inputValue: new Decimal(0),
                wastageValue: new Decimal(0),
                consumedQty: new Decimal(0),
                wastageQty: new Decimal(0),
              })),
            },
          },
          include: { items: true, party: true },
        });

        createdRecords.push(newExport);
      }
    }

    return NextResponse.json({ success: true, data: createdRecords }, { status: 201 });
  } catch (error: any) {
    console.error('API Export Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/v1/exports?id=... OR ?exportGdNumber=...
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const exportGdNumber = searchParams.get('exportGdNumber');

    if (!id && !exportGdNumber) {
      return NextResponse.json({ success: false, error: 'Export Record ID or GD Number is required for deletion.' }, { status: 400 });
    }

    const whereClause = id ? { id } : { exportGdNumber: exportGdNumber! };

    const targetGd = await prisma.exportGd.findFirst({
      where: whereClause,
    });

    if (!targetGd) {
      return NextResponse.json({ success: false, error: 'Export GD not found.' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.exportGdItem.deleteMany({
        where: { exportGdId: targetGd.id },
      });
      await tx.exportGd.delete({
        where: { id: targetGd.id },
      });
    });

    return NextResponse.json({ success: true, message: 'Export GD deleted successfully.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}