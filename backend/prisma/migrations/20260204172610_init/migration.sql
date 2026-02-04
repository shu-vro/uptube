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
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL DEFAULT 'video',
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT,
    "extra" JSONB DEFAULT '{}',
    "last_manual_fetch" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "available_qualities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "thumbnails" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "VideoNext_toId_idx" ON "VideoNext"("toId");

-- CreateIndex
CREATE INDEX "VideoNext_position_idx" ON "VideoNext"("position");

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "Creator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoNext" ADD CONSTRAINT "VideoNext_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoNext" ADD CONSTRAINT "VideoNext_toId_fkey" FOREIGN KEY ("toId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caption" ADD CONSTRAINT "Caption_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "Video"("id") ON DELETE SET NULL ON UPDATE CASCADE;
