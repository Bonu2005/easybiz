-- DropForeignKey
ALTER TABLE "RequestLog" DROP CONSTRAINT "RequestLog_userId_fkey";

-- AlterTable
ALTER TABLE "RequestLog" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "RequestLog" ADD CONSTRAINT "RequestLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
