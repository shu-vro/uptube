/*
  Warnings:

  - You are about to drop the column `videoId` on the `Caption` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Caption" DROP CONSTRAINT "Caption_videoId_fkey";

-- AlterTable
ALTER TABLE "Caption" DROP COLUMN "videoId",
ADD COLUMN     "video_id" TEXT;

-- AddForeignKey
ALTER TABLE "Caption" ADD CONSTRAINT "Caption_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "Video"("id") ON DELETE SET NULL ON UPDATE CASCADE;
