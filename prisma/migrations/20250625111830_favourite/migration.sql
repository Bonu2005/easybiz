/*
  Warnings:

  - You are about to drop the column `userId` on the `FavoriteMessage` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[messageId]` on the table `FavoriteMessage` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "FavoriteMessage" DROP CONSTRAINT "FavoriteMessage_userId_fkey";

-- DropIndex
DROP INDEX "FavoriteMessage_userId_messageId_key";

-- AlterTable
ALTER TABLE "FavoriteMessage" DROP COLUMN "userId";

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteMessage_messageId_key" ON "FavoriteMessage"("messageId");
