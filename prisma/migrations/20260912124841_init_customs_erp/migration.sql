-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'CLEARING_STAFF', 'ACCOUNTS', 'VIEWER');

-- CreateEnum
CREATE TYPE "ClearingStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_PROCESSING', 'ASSESSED', 'CLEARED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('GOODS_DECLARATION', 'INVOICE', 'PACKING_LIST', 'BILL_OF_LADING', 'FORM_E', 'CERTIFICATE_OF_ORIGIN', 'AUTHORIZATION_LETTER', 'NTN_STRN_CERTIFICATE', 'IOCO_ANALYSIS_CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CHEQUE', 'BANK_TRANSFER', 'PAY_ORDER', 'ONLINE');

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('RECONCILED', 'PARTIALLY_RECONCILED', 'PENDING', 'SHORT', 'EXCESS', 'ATTENTION_REQUIRED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CLEARING_STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parties" (
    "id" TEXT NOT NULL,
    "partyCode" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "ntn" TEXT NOT NULL,
    "strn" TEXT,
    "companyRegistrationNo" TEXT,
    "contactPerson" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "ntn" TEXT,
    "strn" TEXT,
    "services" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hs_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cdRate" DECIMAL(5,2) NOT NULL,
    "stRate" DECIMAL(5,2) NOT NULL,
    "acdRate" DECIMAL(5,2) NOT NULL,
    "rdRate" DECIMAL(5,2) NOT NULL,
    "itRate" DECIMAL(5,2) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'Kg',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hs_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_gds" (
    "id" TEXT NOT NULL,
    "gdNumber" TEXT NOT NULL,
    "gdDate" TIMESTAMP(3) NOT NULL,
    "partyId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "countryOfOrigin" TEXT NOT NULL,
    "portOfDischarge" TEXT NOT NULL,
    "blNumber" TEXT,
    "status" "ClearingStatus" NOT NULL DEFAULT 'DRAFT',
    "totalAssessableValue" DECIMAL(15,2) NOT NULL,
    "totalDutyTaxes" DECIMAL(15,2) NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_gds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_gd_items" (
    "id" TEXT NOT NULL,
    "importGdId" TEXT NOT NULL,
    "itemDescription" TEXT NOT NULL,
    "hsCode" TEXT NOT NULL,
    "inputPct" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'Kg',
    "importValueVal" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "exchangeRate" DECIMAL(10,4) NOT NULL,
    "assessableValue" DECIMAL(15,2) NOT NULL,
    "customsDuty" DECIMAL(15,2) NOT NULL,
    "salesTax" DECIMAL(15,2) NOT NULL,
    "additionalCd" DECIMAL(15,2) NOT NULL,
    "regulatoryDuty" DECIMAL(15,2) NOT NULL,
    "incomeTax" DECIMAL(15,2) NOT NULL,
    "otherTaxes" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "totalDutyTaxes" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_gd_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_gds" (
    "id" TEXT NOT NULL,
    "gdNumber" TEXT NOT NULL,
    "gdDate" TIMESTAMP(3) NOT NULL,
    "partyId" TEXT NOT NULL,
    "buyerName" TEXT NOT NULL,
    "destinationCountry" TEXT NOT NULL,
    "portOfLoading" TEXT NOT NULL,
    "formENumber" TEXT,
    "status" "ClearingStatus" NOT NULL DEFAULT 'DRAFT',
    "totalExportValuePkr" DECIMAL(15,2) NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "export_gds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_gd_items" (
    "id" TEXT NOT NULL,
    "exportGdId" TEXT NOT NULL,
    "itemDescription" TEXT NOT NULL,
    "hsCode" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'Kg',
    "exportValuePkr" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "exchangeRate" DECIMAL(10,4) NOT NULL DEFAULT 1.0000,
    "valueAdditionPct" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "export_gd_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "input_materials" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "importGdItemId" TEXT NOT NULL,
    "pctCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "openingQty" DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    "importedQty" DECIMAL(12,3) NOT NULL,
    "consumedQty" DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    "wastageQty" DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    "closingQty" DECIMAL(12,3) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'Kg',
    "importValuePkr" DECIMAL(15,2) NOT NULL,
    "iocoRatio" DECIMAL(10,6) NOT NULL,
    "standardWastagePct" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "input_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_transactions" (
    "id" TEXT NOT NULL,
    "inputMaterialId" TEXT NOT NULL,
    "exportGdNumber" TEXT,
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transactionType" TEXT NOT NULL,
    "quantityOut" DECIMAL(12,3) NOT NULL,
    "balanceAfter" DECIMAL(12,3) NOT NULL,
    "referenceNo" TEXT NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "material_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconciliations" (
    "id" TEXT NOT NULL,
    "reconciliationNo" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "statementDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "ReconciliationStatus" NOT NULL DEFAULT 'PENDING',
    "totalImportQty" DECIMAL(12,3) NOT NULL,
    "totalExportQty" DECIMAL(12,3) NOT NULL,
    "totalWastageQty" DECIMAL(12,3) NOT NULL,
    "totalClosingQty" DECIMAL(12,3) NOT NULL,
    "overallStatus" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconciliation_items" (
    "id" TEXT NOT NULL,
    "reconciliationId" TEXT NOT NULL,
    "inputMaterialId" TEXT NOT NULL,
    "exportGdId" TEXT,
    "importGdNo" TEXT NOT NULL,
    "inputDescription" TEXT NOT NULL,
    "importQtyKg" DECIMAL(12,3) NOT NULL,
    "importValuePkr" DECIMAL(15,2) NOT NULL,
    "inputPct" TEXT NOT NULL,
    "netIocoConsumption" DECIMAL(12,3) NOT NULL,
    "iocoWastageQty" DECIMAL(12,3) NOT NULL,
    "grossIocoConsumption" DECIMAL(12,3) NOT NULL,
    "wastagePercentage" DECIMAL(5,2) NOT NULL,
    "exportGdNo" TEXT,
    "exportDescription" TEXT,
    "exportQtyKg" DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    "exportValuePkr" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "consumptionIncWastage" DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    "actualWastageKg" DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    "closingBalanceKg" DECIMAL(12,3) NOT NULL,
    "valueAddition" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "unitClaim" DECIMAL(12,4) NOT NULL,
    "calculatedDifference" DECIMAL(12,3) NOT NULL,
    "itemStatus" "ReconciliationStatus" NOT NULL,

    CONSTRAINT "reconciliation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "clearingCharges" DECIMAL(15,2) NOT NULL,
    "agencyFee" DECIMAL(15,2) NOT NULL,
    "reimbursableExp" DECIMAL(15,2) NOT NULL,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "paidAmount" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "balanceDue" DECIMAL(15,2) NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "expenseNumber" TEXT NOT NULL,
    "partyId" TEXT,
    "importGdId" TEXT,
    "vendorId" TEXT,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "expenseType" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
    "isPaid" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "receiptUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "paymentNo" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(15,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "referenceNo" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_ledgers" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voucherNo" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "debit" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "credit" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "balance" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "party_ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "category" "DocumentCategory" NOT NULL,
    "partyId" TEXT,
    "importGdId" TEXT,
    "exportGdId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "parties_partyCode_key" ON "parties"("partyCode");

-- CreateIndex
CREATE UNIQUE INDEX "parties_ntn_key" ON "parties"("ntn");

-- CreateIndex
CREATE INDEX "parties_companyName_idx" ON "parties"("companyName");

-- CreateIndex
CREATE INDEX "parties_ntn_idx" ON "parties"("ntn");

-- CreateIndex
CREATE UNIQUE INDEX "hs_codes_code_key" ON "hs_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "import_gds_gdNumber_key" ON "import_gds"("gdNumber");

-- CreateIndex
CREATE INDEX "import_gds_gdNumber_idx" ON "import_gds"("gdNumber");

-- CreateIndex
CREATE INDEX "import_gds_partyId_idx" ON "import_gds"("partyId");

-- CreateIndex
CREATE INDEX "import_gds_gdDate_idx" ON "import_gds"("gdDate");

-- CreateIndex
CREATE UNIQUE INDEX "export_gds_gdNumber_key" ON "export_gds"("gdNumber");

-- CreateIndex
CREATE INDEX "export_gds_gdNumber_idx" ON "export_gds"("gdNumber");

-- CreateIndex
CREATE INDEX "export_gds_partyId_idx" ON "export_gds"("partyId");

-- CreateIndex
CREATE INDEX "input_materials_partyId_idx" ON "input_materials"("partyId");

-- CreateIndex
CREATE INDEX "input_materials_pctCode_idx" ON "input_materials"("pctCode");

-- CreateIndex
CREATE UNIQUE INDEX "reconciliations_reconciliationNo_key" ON "reconciliations"("reconciliationNo");

-- CreateIndex
CREATE INDEX "reconciliations_partyId_idx" ON "reconciliations"("partyId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_expenseNumber_key" ON "expenses"("expenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "payments_paymentNo_key" ON "payments"("paymentNo");

-- AddForeignKey
ALTER TABLE "import_gds" ADD CONSTRAINT "import_gds_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_gd_items" ADD CONSTRAINT "import_gd_items_importGdId_fkey" FOREIGN KEY ("importGdId") REFERENCES "import_gds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_gds" ADD CONSTRAINT "export_gds_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_gd_items" ADD CONSTRAINT "export_gd_items_exportGdId_fkey" FOREIGN KEY ("exportGdId") REFERENCES "export_gds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "input_materials" ADD CONSTRAINT "input_materials_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "input_materials" ADD CONSTRAINT "input_materials_importGdItemId_fkey" FOREIGN KEY ("importGdItemId") REFERENCES "import_gd_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_transactions" ADD CONSTRAINT "material_transactions_inputMaterialId_fkey" FOREIGN KEY ("inputMaterialId") REFERENCES "input_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_items" ADD CONSTRAINT "reconciliation_items_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "reconciliations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_items" ADD CONSTRAINT "reconciliation_items_inputMaterialId_fkey" FOREIGN KEY ("inputMaterialId") REFERENCES "input_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_items" ADD CONSTRAINT "reconciliation_items_exportGdId_fkey" FOREIGN KEY ("exportGdId") REFERENCES "export_gds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_importGdId_fkey" FOREIGN KEY ("importGdId") REFERENCES "import_gds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_ledgers" ADD CONSTRAINT "party_ledgers_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_importGdId_fkey" FOREIGN KEY ("importGdId") REFERENCES "import_gds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_exportGdId_fkey" FOREIGN KEY ("exportGdId") REFERENCES "export_gds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
