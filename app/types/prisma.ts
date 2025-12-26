export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface User {
  id: string;
  email: string;
  name: string | null;
  password: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  extra: JsonValue | null;
}

export interface Video {
  id: string;
  title: string;
  channel_id: string;
  short_description: string | null;
  duration: number;
  view_count: number;
  type: string;
  keywords: string[];
  like_count: number;
  category: string | null;
  captions?: Caption[];
  extra: Record<string, any>;
  createdAt: Date | string;
  updatedAt: Date | string;
  thumbnails?: Thumbnail[];
  creator?: Creator;
  available_qualities: string[] | null;
  nextEdges?: VideoNext[];
  prevEdges?: VideoNext[];
}

export interface VideoNext {
  fromId: string;
  toId: string;
  position: number | null;
  extra: JsonValue | null;
  createdAt: Date | string;
  from?: Video;
  to?: Video;
}

export interface Caption {
  base_url: string;
  base_url_to_json: JsonValue | null;
  video_id: string | null;
  language_code: string | null;
  video?: Video | null;
  extra: JsonValue | null;
}

export interface Thumbnail {
  id: string;
  video_id: string | null;
  creator_id: string | null;
  url: string;
  width: number;
  height: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  extra: JsonValue | null;
  video?: Video | null;
  creator?: Creator | null;
}

export interface Creator {
  id: string;
  title: string;
  description: string | null;
  url: string;
  vanity_channel_url: string | null;
  avatars?: Thumbnail[];
  Videos?: Video[];
  createdAt: Date | string;
  updatedAt: Date | string;
  extra: JsonValue | null;
}
