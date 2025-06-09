-- CreateTable
CREATE TABLE "Activation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activation_status" "UsersStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activation_pkey" PRIMARY KEY ("id")
);
