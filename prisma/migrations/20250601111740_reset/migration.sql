/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `Reset_Password` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Reset_Password_email_key" ON "Reset_Password"("email");
