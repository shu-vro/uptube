-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "VideoType" AS ENUM ('VIDEO', 'SHORT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "extra" JSONB DEFAULT '{}',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "short_description" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "view_count" TEXT NOT NULL DEFAULT '0',
    "type" "VideoType" NOT NULL DEFAULT 'VIDEO',
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "like_count" TEXT NOT NULL DEFAULT '0',
    "category" TEXT,
    "extra" JSONB DEFAULT '{}',
    "last_manual_fetch" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "available_qualities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "thumbnails" JSONB NOT NULL DEFAULT '[]',
    "sponsorblocks" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dislike_count" TEXT NOT NULL DEFAULT '0',
    "heatmap" JSONB DEFAULT '{}',

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "start" INTEGER NOT NULL,
    "end" INTEGER NOT NULL,
    "extra" JSONB DEFAULT '{}',
    "video_id" TEXT,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoNext" (
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "position" INTEGER,
    "extra" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoNext_pkey" PRIMARY KEY ("fromId","toId")
);

-- CreateTable
CREATE TABLE "Caption" (
    "base_url" TEXT NOT NULL,
    "base_url_to_json" JSONB DEFAULT '{}',
    "video_id" TEXT,
    "language_code" TEXT,
    "extra" JSONB DEFAULT '{}',

    CONSTRAINT "Caption_pkey" PRIMARY KEY ("base_url")
);

-- CreateTable
CREATE TABLE "Creator" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "vanity_channel_url" TEXT,
    "avatars" JSONB DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "extra" JSONB DEFAULT '{}',

    CONSTRAINT "Creator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Video_channel_id_idx" ON "Video"("channel_id");

-- CreateIndex
CREATE INDEX "Video_type_idx" ON "Video"("type");

-- CreateIndex
CREATE INDEX "Video_createdAt_idx" ON "Video"("createdAt");

-- CreateIndex
CREATE INDEX "Video_channel_id_type_idx" ON "Video"("channel_id", "type");

-- CreateIndex
CREATE INDEX "Chapter_video_id_idx" ON "Chapter"("video_id");

-- CreateIndex
CREATE INDEX "VideoNext_toId_idx" ON "VideoNext"("toId");

-- CreateIndex
CREATE INDEX "VideoNext_position_idx" ON "VideoNext"("position");

-- CreateIndex
CREATE INDEX "Caption_video_id_idx" ON "Caption"("video_id");

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "Creator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "Video"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoNext" ADD CONSTRAINT "VideoNext_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoNext" ADD CONSTRAINT "VideoNext_toId_fkey" FOREIGN KEY ("toId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caption" ADD CONSTRAINT "Caption_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "Video"("id") ON DELETE SET NULL ON UPDATE CASCADE;

