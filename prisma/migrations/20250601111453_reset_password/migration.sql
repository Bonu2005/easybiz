/*
  Warnings:

  - Added the required column `email` to the `Reset_Password` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Reset_Password" ADD COLUMN     "email" TEXT NOT NULL;
