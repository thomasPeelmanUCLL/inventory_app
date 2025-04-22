/*
  Warnings:

  - The primary key for the `hardware_components` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `hardware_components` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `hardware_components_setups` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `images` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `images` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `A` on the `_ImageToSetup` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `hardwareComponentId` on the `hardware_components_setups` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `role` on the `users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "_ImageToSetup" DROP CONSTRAINT "_ImageToSetup_A_fkey";

-- DropForeignKey
ALTER TABLE "hardware_components_setups" DROP CONSTRAINT "hardware_components_setups_hardwareComponentId_fkey";

-- AlterTable
ALTER TABLE "_ImageToSetup" DROP COLUMN "A",
ADD COLUMN     "A" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "hardware_components" DROP CONSTRAINT "hardware_components_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "hardware_components_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "hardware_components_setups" DROP CONSTRAINT "hardware_components_setups_pkey",
DROP COLUMN "hardwareComponentId",
ADD COLUMN     "hardwareComponentId" INTEGER NOT NULL,
ADD CONSTRAINT "hardware_components_setups_pkey" PRIMARY KEY ("hardwareComponentId", "setupId");

-- AlterTable
ALTER TABLE "images" DROP CONSTRAINT "images_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "images_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "users" DROP COLUMN "role",
ADD COLUMN     "role" TEXT NOT NULL;

-- DropEnum
DROP TYPE "Role";

-- CreateIndex
CREATE UNIQUE INDEX "_ImageToSetup_AB_unique" ON "_ImageToSetup"("A", "B");

-- AddForeignKey
ALTER TABLE "hardware_components_setups" ADD CONSTRAINT "hardware_components_setups_hardwareComponentId_fkey" FOREIGN KEY ("hardwareComponentId") REFERENCES "hardware_components"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ImageToSetup" ADD CONSTRAINT "_ImageToSetup_A_fkey" FOREIGN KEY ("A") REFERENCES "images"("id") ON DELETE CASCADE ON UPDATE CASCADE;
