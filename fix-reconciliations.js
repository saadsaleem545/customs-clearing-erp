const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkValues() {
  const items = await prisma.reconciliationItem.findMany({ take: 5 });
  items.forEach((item, index) => {
    console.log(`Record ${index + 1}:`, {
      importGdNo: item.importGdNo,
      inputDescription: item.inputDescription,
      analysisCertNo: item.analysisCertNo
    });
  });
  await prisma.$disconnect();
}

checkValues();