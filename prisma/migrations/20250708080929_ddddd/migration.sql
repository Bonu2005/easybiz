-- DropForeignKey
ALTER TABLE "Email_verification" DROP CONSTRAINT "Email_verification_userId_fkey";

-- AddForeignKey
ALTER TABLE "Email_verification" ADD CONSTRAINT "Email_verification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
