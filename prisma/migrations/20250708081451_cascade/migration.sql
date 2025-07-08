-- DropForeignKey
ALTER TABLE "Blocks" DROP CONSTRAINT "Blocks_pageId_fkey";

-- DropForeignKey
ALTER TABLE "FavoriteMessage" DROP CONSTRAINT "FavoriteMessage_messageId_fkey";

-- DropForeignKey
ALTER TABLE "Pages" DROP CONSTRAINT "Pages_projectId_fkey";

-- DropForeignKey
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_roleId_fkey";

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pages" ADD CONSTRAINT "Pages_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blocks" ADD CONSTRAINT "Blocks_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteMessage" ADD CONSTRAINT "FavoriteMessage_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
