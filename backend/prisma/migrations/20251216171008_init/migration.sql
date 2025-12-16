/*
  Warnings:

  - The primary key for the `Caption` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Caption` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Caption" DROP CONSTRAINT "Caption_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Caption_pkey" PRIMARY KEY ("base_url");
