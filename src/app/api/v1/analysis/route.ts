import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// GET /api/v1/analysis - Fetch Analysis Certificates (Fixed certificateNumber query handling)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const partyId = searchParams.get('partyId');
    const certNumber = searchParams.get('certNumber') || searchParams.get('certificateNumber');

    const where: any = {};
    if (partyId) where.partyId = partyId;
    if (certNumber) {
      where.certificateNumber = { 
        equals: certNumber.trim(), 
        mode: 'insensitive' 
      };
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
      return NextResponse.json(
        { success: false, error: 'Certificate Number, Party, and Items matrix are required.' },
        { status: 400 }
      );
    }

    const existing = await prisma.analysisCertificate.findUnique({
      where: { certificateNumber: certificateNumber.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Analysis Certificate Number ${certificateNumber} already exists.` },
        { status: 400 }
      );
    }

    const newCert = await prisma.$transaction(async (tx) => {
      return await tx.analysisCertificate.create({
        data: {
          certificateNumber: certificateNumber.trim(),
          partyId,
          items: {
            create: items.map((item: any, idx: number) => {
              const reqQty = Number(item.requirementQty || 0);
              const wastQty = Number(item.wastageQty || 0);
              const inputWast = Number(item.inputWithWastage || (reqQty + wastQty));
              const wastPct = Number(item.wastagePct || (reqQty > 0 ? (wastQty / reqQty) * 100 : 0));

              return {
                serialNo: idx + 1,
                hsCode: item.hsCode,
                itemDescription: item.itemDescription,
                uom: item.uom || 'KG',
                requirementQty: new Decimal(reqQty),
                wastageQty: new Decimal(wastQty),
                inputWithWastage: new Decimal(inputWast),
                wastagePct: new Decimal(wastPct),
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

// DELETE /api/v1/analysis?id=XYZ - Delete Analysis Certificate
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