-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "category" TEXT,
ADD COLUMN     "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "like_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "parent_id" TEXT;

-- CreateTable
CREATE TABLE "Caption" (
    "id" TEXT NOT NULL,
    "base_url" TEXT NOT NULL,
    "base_url_to_json" JSONB DEFAULT '{}',
    "videoId" TEXT,
    "language_code" TEXT,

    CONSTRAINT "Caption_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Video"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caption" ADD CONSTRAINT "Caption_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE SET NULL ON UPDATE CASCADE;
