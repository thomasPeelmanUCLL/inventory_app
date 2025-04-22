/*
  Warnings:

  - You are about to drop the `hardware_component_to_setup` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "hardware_component_to_setup" DROP CONSTRAINT "hardware_component_to_setup_hardwareComponentId_fkey";

-- DropForeignKey
ALTER TABLE "hardware_component_to_setup" DROP CONSTRAINT "hardware_component_to_setup_setupId_fkey";

-- DropTable
DROP TABLE "hardware_component_to_setup";

-- CreateTable
CREATE TABLE "_HardwareComponentToSetup" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_HardwareComponentToSetup_AB_unique" ON "_HardwareComponentToSetup"("A", "B");

-- CreateIndex
CREATE INDEX "_HardwareComponentToSetup_B_index" ON "_HardwareComponentToSetup"("B");

-- AddForeignKey
ALTER TABLE "_HardwareComponentToSetup" ADD CONSTRAINT "_HardwareComponentToSetup_A_fkey" FOREIGN KEY ("A") REFERENCES "hardware_components"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HardwareComponentToSetup" ADD CONSTRAINT "_HardwareComponentToSetup_B_fkey" FOREIGN KEY ("B") REFERENCES "setups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
