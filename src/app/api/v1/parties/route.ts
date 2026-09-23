import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/v1/parties - List & Search Parties
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const city = searchParams.get('city') || '';
    const status = searchParams.get('status') || '';

    const whereCondition: any = {};

    if (search) {
      whereCondition.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { ntn: { contains: search, mode: 'insensitive' } },
        { partyCode: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (city) {
      whereCondition.city = { equals: city, mode: 'insensitive' };
    }

    if (status) {
      whereCondition.isActive = status === 'active';
    }

    const parties = await prisma.party.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            importGds: true,
            exportGds: true,
            invoices: true,
            reconciliations: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: parties });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/v1/parties - Register New Party
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      companyName,
      ntn,
      strn,
      companyRegistrationNo,
      contactPerson,
      phone,
      email,
      address,
      city,
      businessType,
      notes,
    } = body;

    // Validation: Only Company Name, EFS Cert Number (NTN), and Address are mandatory
    if (!companyName || !ntn || !address) {
      return NextResponse.json(
        { success: false, error: 'Required fields missing: Company Name, EFS Certificate Number, Address' },
        { status: 400 }
      );
    }

    // Check Unique NTN / EFS Certificate Number
    const existingNtn = await prisma.party.findUnique({
      where: { ntn },
    });

    if (existingNtn) {
      return NextResponse.json(
        { success: false, error: `Party with EFS Certificate Number ${ntn} already exists.` },
        { status: 400 }
      );
    }

    // Generate Party Code (PAR-XXX-Count)
    const partyCount = await prisma.party.count();
    const codeNumber = (partyCount + 1).toString().padStart(3, '0');
    const prefix = companyName.substring(0, 3).toUpperCase();
    const partyCode = `PAR-${prefix}-${codeNumber}`;

    const newParty = await prisma.party.create({
      data: {
        partyCode,
        companyName,
        ntn,
        strn: strn || 'N/A',
        companyRegistrationNo: companyRegistrationNo || 'N/A',
        contactPerson: contactPerson || 'Authorized Representative',
        phone: phone || '+92-21-0000000',
        email: email || `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}@efs.pk`,
        address,
        city: city || 'Karachi',
        businessType: businessType || 'EFS Holder',
        notes: notes || '',
      },
    });

    return NextResponse.json({ success: true, data: newParty }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}