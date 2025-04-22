/*
  Warnings:

  - You are about to drop the `_HardwareComponentToSetup` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_HardwareComponentToSetup" DROP CONSTRAINT "_HardwareComponentToSetup_A_fkey";

-- DropForeignKey
ALTER TABLE "_HardwareComponentToSetup" DROP CONSTRAINT "_HardwareComponentToSetup_B_fkey";

-- DropIndex
DROP INDEX "hardware_components_name_key";

-- DropTable
DROP TABLE "_HardwareComponentToSetup";

-- CreateTable
CREATE TABLE "hardware_component_to_setup" (
    "hardwareComponentId" INTEGER NOT NULL,
    "setupId" INTEGER NOT NULL,

    CONSTRAINT "hardware_component_to_setup_pkey" PRIMARY KEY ("hardwareComponentId","setupId")
);

-- AddForeignKey
ALTER TABLE "hardware_component_to_setup" ADD CONSTRAINT "hardware_component_to_setup_hardwareComponentId_fkey" FOREIGN KEY ("hardwareComponentId") REFERENCES "hardware_components"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hardware_component_to_setup" ADD CONSTRAINT "hardware_component_to_setup_setupId_fkey" FOREIGN KEY ("setupId") REFERENCES "setups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
