/*
  Warnings:

  - You are about to drop the column `parent_id` on the `Video` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Video" DROP CONSTRAINT "Video_parent_id_fkey";

-- AlterTable
ALTER TABLE "Caption" ADD COLUMN     "extra" JSONB DEFAULT '{}';

-- AlterTable
ALTER TABLE "Video" DROP COLUMN "parent_id";

-- CreateTable
CREATE TABLE "VideoNext" (
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "position" INTEGER,
    "extra" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoNext_pkey" PRIMARY KEY ("fromId","toId")
);

-- CreateIndex
CREATE INDEX "VideoNext_toId_idx" ON "VideoNext"("toId");

-- AddForeignKey
ALTER TABLE "VideoNext" ADD CONSTRAINT "VideoNext_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoNext" ADD CONSTRAINT "VideoNext_toId_fkey" FOREIGN KEY ("toId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;
