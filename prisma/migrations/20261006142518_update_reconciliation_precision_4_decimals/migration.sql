/*
  Warnings:

  - You are about to alter the column `netIocoConsumption` on the `reconciliation_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,3)` to `Decimal(12,4)`.
  - You are about to alter the column `iocoWastageQty` on the `reconciliation_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,3)` to `Decimal(12,4)`.
  - You are about to alter the column `grossIocoConsumption` on the `reconciliation_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,3)` to `Decimal(12,4)`.
  - You are about to alter the column `exportQtyKg` on the `reconciliation_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,3)` to `Decimal(12,4)`.
  - You are about to alter the column `consumptionIncWastage` on the `reconciliation_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,3)` to `Decimal(12,4)`.
  - You are about to alter the column `actualWastageKg` on the `reconciliation_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,3)` to `Decimal(12,4)`.
  - You are about to alter the column `closingBalanceKg` on the `reconciliation_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,3)` to `Decimal(12,4)`.
  - You are about to alter the column `calculatedDifference` on the `reconciliation_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,3)` to `Decimal(12,4)`.

*/
-- AlterTable
ALTER TABLE "export_gd_items" ADD COLUMN     "analysisCertNo" TEXT;

-- AlterTable
ALTER TABLE "reconciliation_items" ADD COLUMN     "analysisCertNo" TEXT,
ALTER COLUMN "netIocoConsumption" SET DATA TYPE DECIMAL(12,4),
ALTER COLUMN "iocoWastageQty" SET DATA TYPE DECIMAL(12,4),
ALTER COLUMN "grossIocoConsumption" SET DATA TYPE DECIMAL(12,4),
ALTER COLUMN "exportQtyKg" SET DATA TYPE DECIMAL(12,4),
ALTER COLUMN "consumptionIncWastage" SET DATA TYPE DECIMAL(12,4),
ALTER COLUMN "actualWastageKg" SET DATA TYPE DECIMAL(12,4),
ALTER COLUMN "closingBalanceKg" SET DATA TYPE DECIMAL(12,4),
ALTER COLUMN "unitClaim" DROP NOT NULL,
ALTER COLUMN "calculatedDifference" DROP NOT NULL,
ALTER COLUMN "calculatedDifference" SET DATA TYPE DECIMAL(12,4),
ALTER COLUMN "itemStatus" SET DEFAULT 'PENDING';
