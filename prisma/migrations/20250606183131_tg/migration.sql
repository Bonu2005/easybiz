/*
  Warnings:

  - A unique constraint covering the columns `[telegram]` on the table `Users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[facebook]` on the table `Users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[instagram]` on the table `Users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "facebook" TEXT,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "telegram" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Users_telegram_key" ON "Users"("telegram");

-- CreateIndex
CREATE UNIQUE INDEX "Users_facebook_key" ON "Users"("facebook");

-- CreateIndex
CREATE UNIQUE INDEX "Users_instagram_key" ON "Users"("instagram");
