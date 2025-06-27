/*
  Warnings:

  - You are about to drop the column `otpCode` on the `Reset_Password` table. All the data in the column will be lost.
  - Added the required column `secret` to the `Reset_Password` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Reset_Password" DROP COLUMN "otpCode",
ADD COLUMN     "secret" TEXT NOT NULL;
