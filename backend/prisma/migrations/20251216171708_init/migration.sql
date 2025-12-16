/*
  Warnings:

  - A unique constraint covering the columns `[url]` on the table `Thumbnail` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `url` to the `Thumbnail` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Thumbnail" ADD COLUMN     "url" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Thumbnail_url_key" ON "Thumbnail"("url");
