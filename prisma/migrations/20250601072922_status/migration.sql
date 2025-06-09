-- CreateEnum
CREATE TYPE "UsersStatus" AS ENUM ('PENDING', 'ACTIVE');

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "status" "UsersStatus" NOT NULL DEFAULT 'PENDING';
