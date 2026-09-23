/*
  Warnings:

  - You are about to drop the column `currency` on the `export_gd_items` table. All the data in the column will be lost.
  - You are about to drop the column `exchangeRate` on the `export_gd_items` table. All the data in the column will be lost.
  - You are about to drop the column `exportValuePkr` on the `export_gd_items` table. All the data in the column will be lost.
  - You are about to drop the column `hsCode` on the `export_gd_items` table. All the data in the column will be lost.
  - You are about to drop the column `itemDescription` on the `export_gd_items` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `export_gd_items` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `export_gd_items` table. All the data in the column will be lost.
  - You are about to drop the column `valueAdditionPct` on the `export_gd_items` table. All the data in the column will be lost.
  - You are about to drop the column `buyerName` on the `export_gds` table. All the data in the column will be lost.
  - You are about to drop the column `destinationCountry` on the `export_gds` table. All the data in the column will be lost.
  - You are about to drop the column `formENumber` on the `export_gds` table. All the data in the column will be lost.
  - You are about to drop the column `gdDate` on the `export_gds` table. All the data in the column will be lost.
  - You are about to drop the column `gdNumber` on the `export_gds` table. All the data in the column will be lost.
  - You are about to drop the column `portOfLoading` on the `export_gds` table. All the data in the column will be lost.
  - You are about to drop the column `remarks` on the `export_gds` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `export_gds` table. All the data in the column will be lost.
  - You are about to drop the column `totalExportValuePkr` on the `export_gds` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[exportGdNumber]` on the table `export_gds` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `consumedQty` to the `export_gd_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `exportHsCode` to the `export_gd_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `exportParticulars` to the `export_gd_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `importHsCode` to the `export_gd_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inputValue` to the `export_gd_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `qtyOfExports` to the `export_gd_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `valueOfeExports` to the `export_gd_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wastageQty` to the `export_gd_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wastageValue` to the `export_gd_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `analysisCertificateId` to the `export_gds` table without a default value. This is not possible if the table is not empty.
  - Added the required column `exportGdNumber` to the `export_gds` table without a default value. This is not possible if the table is not empty.
  - Added the required column `importGdNumber` to the `export_gds` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "export_gds" DROP CONSTRAINT "export_gds_partyId_fkey";

-- DropForeignKey
ALTER TABLE "import_gds" DROP CONSTRAINT "import_gds_partyId_fkey";

-- DropForeignKey
ALTER TABLE "input_materials" DROP CONSTRAINT "input_materials_importGdItemId_fkey";

-- DropForeignKey
ALTER TABLE "input_materials" DROP CONSTRAINT "input_materials_partyId_fkey";

-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_partyId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_partyId_fkey";

-- DropForeignKey
ALTER TABLE "reconciliation_items" DROP CONSTRAINT "reconciliation_items_inputMaterialId_fkey";

-- DropForeignKey
ALTER TABLE "reconciliations" DROP CONSTRAINT "reconciliations_partyId_fkey";

-- DropIndex
DROP INDEX "export_gds_gdNumber_idx";

-- DropIndex
DROP INDEX "export_gds_gdNumber_key";

-- AlterTable
ALTER TABLE "export_gd_items" DROP COLUMN "currency",
DROP COLUMN "exchangeRate",
DROP COLUMN "exportValuePkr",
DROP COLUMN "hsCode",
DROP COLUMN "itemDescription",
DROP COLUMN "quantity",
DROP COLUMN "unit",
DROP COLUMN "valueAdditionPct",
ADD COLUMN     "consumedQty" DECIMAL(12,4) NOT NULL,
ADD COLUMN     "exportHsCode" TEXT NOT NULL,
ADD COLUMN     "exportParticulars" TEXT NOT NULL,
ADD COLUMN     "importHsCode" TEXT NOT NULL,
ADD COLUMN     "inputValue" DECIMAL(12,4) NOT NULL,
ADD COLUMN     "qtyOfExports" DECIMAL(12,4) NOT NULL,
ADD COLUMN     "serialNo" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "valueOfeExports" DECIMAL(12,4) NOT NULL,
ADD COLUMN     "wastageQty" DECIMAL(12,4) NOT NULL,
ADD COLUMN     "wastageValue" DECIMAL(12,4) NOT NULL;

-- AlterTable
ALTER TABLE "export_gds" DROP COLUMN "buyerName",
DROP COLUMN "destinationCountry",
DROP COLUMN "formENumber",
DROP COLUMN "gdDate",
DROP COLUMN "gdNumber",
DROP COLUMN "portOfLoading",
DROP COLUMN "remarks",
DROP COLUMN "status",
DROP COLUMN "totalExportValuePkr",
ADD COLUMN     "analysisCertificateId" TEXT NOT NULL,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "exportGdNumber" TEXT NOT NULL,
ADD COLUMN     "importGdId" TEXT,
ADD COLUMN     "importGdNumber" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "import_gd_items" ADD COLUMN     "unitPrice" DECIMAL(15,2);

-- AlterTable
ALTER TABLE "reconciliation_items" ALTER COLUMN "closingBalanceKg" SET DEFAULT 0.000;

-- CreateTable
CREATE TABLE "analysis_certificates" (
    "id" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analysis_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_cert_items" (
    "id" TEXT NOT NULL,
    "analysisCertificateId" TEXT NOT NULL,
    "serialNo" INTEGER NOT NULL DEFAULT 1,
    "hsCode" TEXT NOT NULL,
    "itemDescription" TEXT NOT NULL,
    "uom" TEXT NOT NULL DEFAULT 'KG',
    "requirementQty" DECIMAL(12,4) NOT NULL,
    "wastageQty" DECIMAL(12,4) NOT NULL,
    "inputWithWastage" DECIMAL(12,4) NOT NULL,
    "wastagePct" DECIMAL(8,4) NOT NULL,

    CONSTRAINT "analysis_cert_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "analysis_certificates_certificateNumber_key" ON "analysis_certificates"("certificateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "export_gds_exportGdNumber_key" ON "export_gds"("exportGdNumber");

-- CreateIndex
CREATE INDEX "export_gds_exportGdNumber_idx" ON "export_gds"("exportGdNumber");

-- AddForeignKey
ALTER TABLE "import_gds" ADD CONSTRAINT "import_gds_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_gds" ADD CONSTRAINT "export_gds_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_gds" ADD CONSTRAINT "export_gds_importGdId_fkey" FOREIGN KEY ("importGdId") REFERENCES "import_gds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_gds" ADD CONSTRAINT "export_gds_analysisCertificateId_fkey" FOREIGN KEY ("analysisCertificateId") REFERENCES "analysis_certificates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "input_materials" ADD CONSTRAINT "input_materials_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "input_materials" ADD CONSTRAINT "input_materials_importGdItemId_fkey" FOREIGN KEY ("importGdItemId") REFERENCES "import_gd_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_items" ADD CONSTRAINT "reconciliation_items_inputMaterialId_fkey" FOREIGN KEY ("inputMaterialId") REFERENCES "input_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_certificates" ADD CONSTRAINT "analysis_certificates_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_cert_items" ADD CONSTRAINT "analysis_cert_items_analysisCertificateId_fkey" FOREIGN KEY ("analysisCertificateId") REFERENCES "analysis_certificates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
