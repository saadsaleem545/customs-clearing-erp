import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// Helper function to format export records uniformly
const formatExportRecord = (rec: any) => ({
  ...rec,
  gdNumber: rec.exportGdNumber || rec.gdNumber || '',
  gdDate: rec.date || rec.createdAt || rec.gdDate || '',
  items: (rec.items || []).map((it: any) => ({
    ...it,
    gdNumber: rec.exportGdNumber || it.gdNumber || '',
    gdDate: rec.date || rec.createdAt || it.gdDate || '',
    itemDescription: it.exportParticulars || it.itemDescription || '',
    hsCode: it.exportHsCode || it.hsCode || '',
    quantity: Number(it.qtyOfExports || it.quantity || 0),
    uom: it.unit || it.uom || 'KG',
    fobValueVal: Number(it.valueOfeExports || it.fobValueVal || 0),
    analysisCertNo: rec.analysisCertificate?.certificateNumber || it.analysisCertNo || '',
  }))
});

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
        analysisCertificate: true,
      },
      orderBy: { createdAt: 'desc' },
      // take: 150 limit removed so all records can grow dynamically
    });

    const formattedData = exportsList.map(formatExportRecord);

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error: any) {
    console.error('API Export GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/v1/exports
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { partyId, partyName, gdNumber, gdDate, items } = body;

    let targetPartyId = partyId;

    if (!targetPartyId && !partyName) {
      return NextResponse.json(
        { success: false, error: 'Party and items are required.' },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Export items are required.' },
        { status: 400 }
      );
    }

    let extractedDate = gdDate ? new Date(gdDate) : new Date();
    if (isNaN(extractedDate.getTime())) {
      extractedDate = new Date();
    }

    // Saari database operations transaction ke andar hain aur timeout 30 seconds set hai
    const createdRecords = await prisma.$transaction(async (tx) => {
      // 1. Party resolution inside transaction
      if (!targetPartyId && partyName) {
        let party = await tx.party.findFirst({
          where: {
            companyName: {
              equals: partyName.trim(),
              mode: 'insensitive',
            },
          },
        });

        if (!party) {
          const randomCode = 'P-' + Math.floor(1000 + Math.random() * 9000);
          party = await tx.party.create({
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

      // 2. Analysis Certificate resolution inside transaction
      const incomingCertNo = items[0]?.analysisCertNo?.trim();
      let analysisCert = null;

      if (incomingCertNo) {
        analysisCert = await tx.analysisCertificate.findUnique({
          where: { certificateNumber: incomingCertNo },
        });

        if (!analysisCert) {
          analysisCert = await tx.analysisCertificate.create({
            data: {
              certificateNumber: incomingCertNo,
              partyId: targetPartyId,
            } as any,
          });
        }
      } else {
        analysisCert = await tx.analysisCertificate.findFirst({
          where: { partyId: targetPartyId },
          orderBy: { createdAt: 'desc' }
        });

        if (!analysisCert) {
          analysisCert = await tx.analysisCertificate.create({
            data: {
              certificateNumber: `CERT-${Math.floor(1000 + Math.random() * 9000)}`,
              partyId: targetPartyId,
            } as any,
          });
        }
      }

      // 3. Group items by GD Number
      const groupedByGd: { [key: string]: any[] } = {};
      for (const item of items) {
        const gdNum = item.gdNumber || gdNumber || 'GD-EXP-UNKNOWN';
        if (!groupedByGd[gdNum]) {
          groupedByGd[gdNum] = [];
        }
        groupedByGd[gdNum].push(item);
      }

      const results = [];

      for (const [currentGdNum, gdItems] of Object.entries(groupedByGd)) {
        let existingGd = await tx.exportGd.findFirst({
          where: { 
            exportGdNumber: currentGdNum,
            partyId: targetPartyId 
          },
        });

        const formattedItemsData = gdItems.map((item: any, idx: number) => ({
          serialNo: idx + 1,
          exportHsCode: item.hsCode || item.exportHsCode || '',
          exportParticulars: item.itemDescription || item.exportParticulars || '',
          qtyOfExports: new Decimal(item.quantity || item.qtyOfExports || 0),
          valueOfeExports: new Decimal(item.fobValueVal || item.valueOfeExports || 0),
          unit: item.uom || item.unit || 'KG',
          importHsCode: '',
          inputValue: new Decimal(0),
          wastageValue: new Decimal(0),
          consumedQty: new Decimal(0),
          wastageQty: new Decimal(0),
        }));

        if (existingGd) {
          await tx.exportGdItem.deleteMany({ where: { exportGdId: existingGd.id } });
          const updatedGd = await tx.exportGd.update({
            where: { id: existingGd.id },
            data: {
              analysisCertificateId: analysisCert.id,
              items: {
                create: formattedItemsData,
              }
            },
            include: { items: true, party: true, analysisCertificate: true },
          });
          results.push(updatedGd);
        } else {
          const newExport = await tx.exportGd.create({
            data: {
              exportGdNumber: currentGdNum,
              date: extractedDate,
              partyId: targetPartyId,
              importGdNumber: 'N/A',
              analysisCertificateId: analysisCert.id,
              items: {
                create: formattedItemsData,
              },
            },
            include: { items: true, party: true, analysisCertificate: true },
          });
          results.push(newExport);
        }
      }

      return results;
    }, {
      maxWait: 15000, // 15 seconds max wait time
      timeout: 30000, // 30 seconds transaction timeout
    });

    const formattedResponseData = createdRecords.map(formatExportRecord);

    return NextResponse.json({ success: true, data: formattedResponseData }, { status: 201 });
  } catch (error: any) {
    console.error('API Export POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/v1/exports
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const exportGdNumber = searchParams.get('exportGdNumber');
    const partyId = searchParams.get('partyId');

    if (!id && !exportGdNumber && !partyId) {
      return NextResponse.json({ success: false, error: 'Export Record ID, GD Number, or Party ID is required for deletion.' }, { status: 400 });
    }

    if (partyId) {
      const targetGds = await prisma.exportGd.findMany({ where: { partyId }, select: { id: true } });
      if (targetGds.length === 0) {
        return NextResponse.json({ success: false, error: 'No Export GDs found for this party.' }, { status: 404 });
      }

      await prisma.$transaction(async (tx) => {
        const gdIds = targetGds.map(g => g.id);
        await tx.exportGdItem.deleteMany({
          where: { exportGdId: { in: gdIds } },
        });
        await tx.exportGd.deleteMany({
          where: { partyId },
        });
      });

      return NextResponse.json({ success: true, message: 'All Export GDs for this party deleted successfully.' });
    }

    const whereClause = id ? { id } : { exportGdNumber: exportGdNumber! };
    const targetGd = await prisma.exportGd.findFirst({ where: whereClause, select: { id: true } });

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
    console.error('API Export DELETE Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}