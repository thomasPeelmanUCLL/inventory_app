-- CreateTable
CREATE TABLE "inventorys" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "inventorys_pkey" PRIMARY KEY ("id")
);
