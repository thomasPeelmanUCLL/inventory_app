/*
  Warnings:

  - You are about to drop the `Comment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HardwareComponent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HardwareComponentToSetup` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Image` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Setup` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_setup_id_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_user_id_fkey";

-- DropForeignKey
ALTER TABLE "HardwareComponentToSetup" DROP CONSTRAINT "HardwareComponentToSetup_hardwareComponentId_fkey";

-- DropForeignKey
ALTER TABLE "HardwareComponentToSetup" DROP CONSTRAINT "HardwareComponentToSetup_setupId_fkey";

-- DropForeignKey
ALTER TABLE "Setup" DROP CONSTRAINT "Setup_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "_ImageToSetup" DROP CONSTRAINT "_ImageToSetup_A_fkey";

-- DropForeignKey
ALTER TABLE "_ImageToSetup" DROP CONSTRAINT "_ImageToSetup_B_fkey";

-- DropTable
DROP TABLE "Comment";

-- DropTable
DROP TABLE "HardwareComponent";

-- DropTable
DROP TABLE "HardwareComponentToSetup";

-- DropTable
DROP TABLE "Image";

-- DropTable
DROP TABLE "Setup";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "age" INTEGER NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "setups" (
    "id" SERIAL NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "details" TEXT NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "setups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hardware_components" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "hardware_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "images" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "details" TEXT NOT NULL,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "setupId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hardware_components_setups" (
    "hardwareComponentId" TEXT NOT NULL,
    "setupId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hardware_components_setups_pkey" PRIMARY KEY ("hardwareComponentId","setupId")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "hardware_components_name_key" ON "hardware_components"("name");

-- CreateIndex
CREATE UNIQUE INDEX "images_url_key" ON "images"("url");

-- AddForeignKey
ALTER TABLE "setups" ADD CONSTRAINT "setups_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_setupId_fkey" FOREIGN KEY ("setupId") REFERENCES "setups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hardware_components_setups" ADD CONSTRAINT "hardware_components_setups_hardwareComponentId_fkey" FOREIGN KEY ("hardwareComponentId") REFERENCES "hardware_components"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hardware_components_setups" ADD CONSTRAINT "hardware_components_setups_setupId_fkey" FOREIGN KEY ("setupId") REFERENCES "setups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ImageToSetup" ADD CONSTRAINT "_ImageToSetup_A_fkey" FOREIGN KEY ("A") REFERENCES "images"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ImageToSetup" ADD CONSTRAINT "_ImageToSetup_B_fkey" FOREIGN KEY ("B") REFERENCES "setups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
