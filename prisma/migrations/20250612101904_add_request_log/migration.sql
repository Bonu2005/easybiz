/*
  Warnings:

  - The primary key for the `RequestLog` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "RequestLog" DROP CONSTRAINT "RequestLog_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "RequestLog_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "RequestLog_id_seq";
