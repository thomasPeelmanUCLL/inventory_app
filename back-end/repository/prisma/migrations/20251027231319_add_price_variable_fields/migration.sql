/*
  Warnings:

  - Added the required column `type` to the `price_variables` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `price_variables` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "price_variables" ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "value" DOUBLE PRECISION NOT NULL;
