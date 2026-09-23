import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/v1/parties/[id] - Update Party
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await req.json();
    const { companyName, ntn, address } = body;

    if (!companyName || !ntn || !address) {
      return NextResponse.json(
        { success: false, error: 'Required fields missing: Company Name, EFS Certificate Number, Address' },
        { status: 400 }
      );
    }

    const updatedParty = await prisma.party.update({
      where: { id },
      data: {
        companyName,
        ntn,
        address,
      },
    });

    return NextResponse.json({ success: true, data: updatedParty });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/parties/[id] - Delete Party
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    await prisma.party.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Party deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}