-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "available_qualities" TEXT[] DEFAULT ARRAY[]::TEXT[];
