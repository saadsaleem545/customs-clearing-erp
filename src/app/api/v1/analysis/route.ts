import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// GET /api/v1/analysis - Fetch Analysis Certificates
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const partyId = searchParams.get('partyId');
    const certNumber = searchParams.get('certNumber') || searchParams.get('certificateNumber');

    const where: any = {};
    if (partyId) where.partyId = partyId;
    if (certNumber) {
      where.certificateNumber = { equals: certNumber.trim(), mode: 'insensitive' };
    }

    const certificates = await prisma.analysisCertificate.findMany({
      where,
      include: {
        party: { select: { id: true, companyName: true, ntn: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: certificates });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/v1/analysis - Save Analysis Certificate & Matrix items
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { certificateNumber, partyId, items } = body;

    if (!certificateNumber || !partyId || !items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Certificate Number, Party, and Items are required.' }, { status: 400 });
    }

    const existing = await prisma.analysisCertificate.findUnique({
      where: { certificateNumber: certificateNumber.trim() },
    });

    if (existing) {
      return NextResponse.json({ success: false, error: `Analysis Certificate Number ${certificateNumber} already exists.` }, { status: 400 });
    }

    const newCert = await prisma.$transaction(async (tx) => {
      return await tx.analysisCertificate.create({
        data: {
          certificateNumber: certificateNumber.trim(),
          partyId,
          items: {
            create: items.map((item: any, idx: number) => {
              // Exact string conversion taake user ki di hui saari decimal values preserve rahein
              const reqQtyStr = String(item.requirementQty ?? '0');
              const wastQtyStr = String(item.wastageQty ?? '0');
              
              const reqQtyNum = Number(reqQtyStr) || 0;
              const wastQtyNum = Number(wastQtyStr) || 0;
              
              const inputWastNum = item.inputWithWastage !== undefined ? Number(item.inputWithWastage) : (reqQtyNum + wastQtyNum);
              const wastPctNum = item.wastagePct !== undefined ? Number(item.wastagePct) : (inputWastNum > 0 ? (wastQtyNum / inputWastNum) * 100 : 0);

              return {
                serialNo: idx + 1,
                hsCode: item.hsCode,
                itemDescription: item.itemDescription,
                uom: item.uom || 'KG',
                requirementQty: new Decimal(reqQtyStr),
                wastageQty: new Decimal(wastQtyStr),
                inputWithWastage: new Decimal(inputWastNum.toString()),
                wastagePct: new Decimal(wastPctNum.toString()),
              };
            }),
          },
        },
        include: { items: true, party: true },
      });
    });

    return NextResponse.json({ success: true, data: newCert }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/v1/analysis - Update/Edit Analysis Certificate & Matrix items
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, certificateNumber, partyId, items } = body;

    if (!id || !certificateNumber || !items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Certificate ID, Number, and Items are required for update.' }, { status: 400 });
    }

    const updatedCert = await prisma.$transaction(async (tx) => {
      // 1. Delete old items
      await tx.analysisCertItem.deleteMany({
        where: { analysisCertificateId: id },
      });

      // 2. Update certificate details and create new items matrix with full decimal precision
      const cert = await tx.analysisCertificate.update({
        where: { id },
        data: {
          certificateNumber: certificateNumber.trim(),
          partyId,
          items: {
            create: items.map((item: any, idx: number) => {
              // Exact string conversion taake decimals truncate na hon
              const reqQtyStr = String(item.requirementQty ?? '0');
              const wastQtyStr = String(item.wastageQty ?? '0');
              
              const reqQtyNum = Number(reqQtyStr) || 0;
              const wastQtyNum = Number(wastQtyStr) || 0;
              
              const inputWastNum = item.inputWithWastage !== undefined ? Number(item.inputWithWastage) : (reqQtyNum + wastQtyNum);
              const wastPctNum = item.wastagePct !== undefined ? Number(item.wastagePct) : (inputWastNum > 0 ? (wastQtyNum / inputWastNum) * 100 : 0);

              return {
                serialNo: idx + 1,
                hsCode: item.hsCode,
                itemDescription: item.itemDescription,
                uom: item.uom || 'KG',
                requirementQty: new Decimal(reqQtyStr),
                wastageQty: new Decimal(wastQtyStr),
                inputWithWastage: new Decimal(inputWastNum.toString()),
                wastagePct: new Decimal(wastPctNum.toString()),
              };
            }),
          },
        },
        include: { items: true, party: true },
      });

      // 3. Automatic Synchronization for Saved Reconciliations
      for (const newItem of cert.items) {
        await tx.reconciliationItem.updateMany({
          where: {
            OR: [
              { analysisCertNo: cert.certificateNumber },
              { analysisCertNo: certificateNumber.trim() }
            ],
            inputDescription: {
              contains: newItem.itemDescription,
              mode: 'insensitive',
            },
          },
          data: {
            netIocoConsumption: newItem.requirementQty,
            iocoWastageQty: newItem.wastageQty,
            grossIocoConsumption: newItem.inputWithWastage,
            wastagePercentage: newItem.wastagePct,
          },
        });
      }

      return cert;
    });

    return NextResponse.json({ success: true, data: updatedCert });
  } catch (error: any) {
    console.error('PUT Analysis Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/v1/analysis - Delete Analysis Certificate
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Certificate ID is required for deletion.' }, { status: 400 });
    }

    await prisma.analysisCertificate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Analysis certificate deleted successfully.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}