-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "age" INTEGER NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setup" (
    "id" SERIAL NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "details" TEXT NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HardwareComponent" (
    "name" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "HardwareComponent_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "Image" (
    "url" TEXT NOT NULL,
    "details" TEXT NOT NULL,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("url")
);

-- CreateTable
CREATE TABLE "Comment" (
    "comment_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "setup_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("comment_id")
);

-- CreateTable
CREATE TABLE "HardwareComponentToSetup" (
    "hardwareComponentId" TEXT NOT NULL,
    "setupId" INTEGER NOT NULL,

    CONSTRAINT "HardwareComponentToSetup_pkey" PRIMARY KEY ("hardwareComponentId","setupId")
);

-- CreateTable
CREATE TABLE "_ImageToSetup" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "HardwareComponent_name_key" ON "HardwareComponent"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Image_url_key" ON "Image"("url");

-- CreateIndex
CREATE UNIQUE INDEX "_ImageToSetup_AB_unique" ON "_ImageToSetup"("A", "B");

-- CreateIndex
CREATE INDEX "_ImageToSetup_B_index" ON "_ImageToSetup"("B");

-- AddForeignKey
ALTER TABLE "Setup" ADD CONSTRAINT "Setup_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_setup_id_fkey" FOREIGN KEY ("setup_id") REFERENCES "Setup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HardwareComponentToSetup" ADD CONSTRAINT "HardwareComponentToSetup_hardwareComponentId_fkey" FOREIGN KEY ("hardwareComponentId") REFERENCES "HardwareComponent"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HardwareComponentToSetup" ADD CONSTRAINT "HardwareComponentToSetup_setupId_fkey" FOREIGN KEY ("setupId") REFERENCES "Setup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ImageToSetup" ADD CONSTRAINT "_ImageToSetup_A_fkey" FOREIGN KEY ("A") REFERENCES "Image"("url") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ImageToSetup" ADD CONSTRAINT "_ImageToSetup_B_fkey" FOREIGN KEY ("B") REFERENCES "Setup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
