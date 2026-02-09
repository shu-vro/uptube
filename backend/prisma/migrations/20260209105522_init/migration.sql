/*
  Warnings:

  - You are about to drop the column `video_id` on the `Chapter` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Chapter_video_id_key";

-- AlterTable
ALTER TABLE "Chapter" DROP COLUMN "video_id";
