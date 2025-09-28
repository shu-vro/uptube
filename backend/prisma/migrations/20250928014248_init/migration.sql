-- DropForeignKey
ALTER TABLE "public"."Thumbnail" DROP CONSTRAINT "Thumbnail_creator_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Thumbnail" DROP CONSTRAINT "Thumbnail_video_id_fkey";

-- AddForeignKey
ALTER TABLE "public"."Thumbnail" ADD CONSTRAINT "Thumbnail_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "public"."Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Thumbnail" ADD CONSTRAINT "Thumbnail_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
