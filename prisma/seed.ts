import { PrismaClient, Role, ClearingStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Production Customs ERP Data...');

  // 1. Create Default Users
  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@clearing.com.pk' },
    update: {},
    create: {
      email: 'admin@clearing.com.pk',
      name: 'Tariq Mahmood (Super Admin)',
      passwordHash: hashedPassword,
      role: Role.SUPER_ADMIN,
    },
  });

  // 2. Create Master HS Codes
  await prisma.hsCode.upsert({
    where: { code: '5402.3300' },
    update: {},
    create: {
      code: '5402.3300',
      description: 'Synthetic Filament Yarn (Polyester DTY)',
      cdRate: 11.00,
      stRate: 18.00,
      acdRate: 2.00,
      rdRate: 0.00,
      itRate: 5.50,
      unit: 'Kg',
    },
  });

  // 3. Create Sample Parties / Clients
  const humera = await prisma.party.upsert({
    where: { partyCode: 'PAR-HUM-001' },
    update: {},
    create: {
      partyCode: 'PAR-HUM-001',
      companyName: 'M/s. HUMERA INDUSTRIES',
      ntn: '2847192-7',
      strn: '17-00-2847-192-11',
      companyRegistrationNo: 'CUIN-0098234',
      contactPerson: 'Sheikh Zubair Humera',
      phone: '+92-21-35061122',
      email: 'info@humeraindustries.com.pk',
      address: 'Plot 45, Sector 15, Korangi Industrial Area',
      city: 'Karachi',
      businessType: 'Textile Manufacturer & Exporter',
    },
  });

  await prisma.party.upsert({
    where: { partyCode: 'PAR-CRE-002' },
    update: {},
    create: {
      partyCode: 'PAR-CRE-002',
      companyName: 'M/s. CRESCENT TEXTILE MILLS LTD',
      ntn: '0712495-3',
      strn: '06-01-9999-432-17',
      companyRegistrationNo: 'CUIN-0012891',
      contactPerson: 'Mian Imran',
      phone: '+92-41-8754200',
      email: 'customs@crescent.com.pk',
      address: 'Sargodha Road',
      city: 'Faisalabad',
      businessType: 'Vertical Textile Unit',
    },
  });

  await prisma.party.upsert({
    where: { partyCode: 'PAR-ALM-003' },
    update: {},
    create: {
      partyCode: 'PAR-ALM-003',
      companyName: 'M/s. AL-KARIM ENTERPRISES',
      ntn: '3192084-5',
      strn: '11-02-9812-331-00',
      companyRegistrationNo: 'CUIN-0044120',
      contactPerson: 'Tariq Al-Karim',
      phone: '+92-21-32418899',
      email: 'import@alkarimenterprises.com',
      address: 'S.I.T.E. Industrial Area',
      city: 'Karachi',
      businessType: 'Commercial Importer',
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });