export type Thumbnail = {
  id: string;
  video_id?: string | null;
  creator_id?: string | null;
  width?: number;
  height?: number;
  createdAt?: string;
  updatedAt?: string;
  extra?: Record<string, any>;
};

export type Creator = {
  id: string;
  title: string;
  description?: string | null;
  url?: string | null;
  vanity_channel_url?: string | null;
  createdAt?: string;
  updatedAt?: string;
  extra?: Record<string, any>;
  avatars?: Thumbnail[];
};

export type Video = {
  id: string;
  title: string;
  channel_id?: string | null;
  short_description?: string | null;
  duration?: number; // seconds
  view_count?: number;
  createdAt?: string;
  updatedAt?: string;
  extra?: Record<string, any>;
  creator?: Creator | null;
  thumbnails?: Thumbnail[];

  // compatibility convenience fields used in UI components
  thumbnail?: string; // single thumbnail url
  channel?: string; // channel title
  views?: string; // preformatted views string
};
