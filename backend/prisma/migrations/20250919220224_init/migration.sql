/*
  Warnings:

  - You are about to drop the column `external_id` on the `Creator` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Video" DROP CONSTRAINT "Video_channel_id_fkey";

-- DropIndex
DROP INDEX "public"."Creator_external_id_key";

-- AlterTable
ALTER TABLE "public"."Creator" DROP COLUMN "external_id";

-- AddForeignKey
ALTER TABLE "public"."Video" ADD CONSTRAINT "Video_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "public"."Creator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
