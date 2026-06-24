import { Avatar, Thumbnail } from './prisma';

export interface ChannelVideoPreview {
  id: string;
  title: string;
  thumbnails: Thumbnail[];
  duration: number;
  view_count: string;
  published_text: string;
  createdAt: string | null;
}

export interface CreatorProfile {
  id: string;
  title: string;
  handle: string | null;
  description: string | null;
  url: string;
  vanity_channel_url: string | null;
  avatars: Avatar[];
  banner: Thumbnail[] | null;
  subscriber_count: string | null;
  video_count: string | null;
  is_verified: boolean;
}

export interface CreatorPageResponse {
  profile: CreatorProfile | null;
  videos: ChannelVideoPreview[];
  nextCursor: string | null;
}

/** @deprecated Use CreatorProfile + CreatorPageResponse */
export interface CreatorPage extends CreatorProfile {
  videos: ChannelVideoPreview[];
}
