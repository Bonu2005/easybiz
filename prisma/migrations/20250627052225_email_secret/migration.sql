/*
  Warnings:

  - You are about to drop the column `otpCode` on the `Email_verification` table. All the data in the column will be lost.
  - Added the required column `secret` to the `Email_verification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Email_verification" DROP COLUMN "otpCode",
ADD COLUMN     "secret" TEXT NOT NULL;
