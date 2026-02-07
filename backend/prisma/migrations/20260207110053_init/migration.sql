-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "dislike_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "heatmap" JSONB DEFAULT '[]';
