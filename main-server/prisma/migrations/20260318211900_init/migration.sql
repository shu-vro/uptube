/*
  Warnings:

  - You are about to drop the column `refreshTokenId` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `RefreshToken` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_refreshTokenId_fkey";

-- DropIndex
DROP INDEX "User_refreshTokenId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "refreshTokenId";

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_userId_key" ON "RefreshToken"("userId");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
