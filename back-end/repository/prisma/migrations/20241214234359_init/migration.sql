/*
  Warnings:

  - You are about to drop the column `addedAt` on the `hardware_components_setups` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `hardware_components_setups` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "hardware_components_setups" DROP COLUMN "addedAt",
DROP COLUMN "quantity";
