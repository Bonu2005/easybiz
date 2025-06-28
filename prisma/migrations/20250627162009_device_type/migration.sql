/*
  Warnings:

  - Added the required column `deviceGroup` to the `Sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Ban" ALTER COLUMN "ban_end" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Sessions" ADD COLUMN     "deviceGroup" TEXT NOT NULL;
