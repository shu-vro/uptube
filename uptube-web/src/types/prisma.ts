import type { ISponsorBlockTakenResponse } from "./sponsorblock";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface Thumbnail {
  url: string;
  width: number;
  height: number;
}

export interface Avatar {
  url: string;
  width: number;
  height: number;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  password: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  extra: Record<string, unknown> | null;
}

export interface Video {
  id: string;
  title: string;
  channel_id: string;
  short_description: string | null;
  duration: number;
  view_count: string;
  type: "VIDEO" | "SHORT";
  keywords: string[];
  like_count: string;
  dislike_count: string;
  category: string | null;
  extra: Record<string, unknown> | null;
  last_manual_fetch: Date | string;
  available_qualities: string[];
  thumbnails: Thumbnail[];
  sponsorblocks: ISponsorBlockTakenResponse[];
  chapters: unknown[] | null;
  trulyCreatedAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  heatmap: JsonValue | null;
  captions?: Caption[];
  creator?: Creator;
  nextEdges?: VideoNext[];
  prevEdges?: VideoNext[];
}

export interface VideoNext {
  fromId: string;
  toId: string;
  position: number | null;
  extra: Record<string, unknown> | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  from?: Video;
  to?: Video;
}

export interface Caption {
  base_url: string;
  base_url_to_json: JsonValue | null;
  video_id: string | null;
  language_code: string | null;
  extra: Record<string, unknown> | null;
  video?: Video | null;
}

export interface Creator {
  id: string;
  title: string;
  description: string | null;
  url: string;
  vanity_channel_url: string | null;
  avatars: Avatar[] | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  extra: Record<string, unknown> | null;
  Videos?: Video[];
}
