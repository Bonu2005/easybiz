-- CreateTable
CREATE TABLE "ViewPages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ViewPages_pkey" PRIMARY KEY ("id")
);
