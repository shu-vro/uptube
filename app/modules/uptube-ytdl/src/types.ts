export interface YTDLProgress {
  url: String;
  progress: number;
  eta: number;
  line: string;
  error?: string;
}

export interface YTDLInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  view_count: number;
  uploader: string;
  description: string;
  formats: YTDLFormat[];
  [key: string]: any;
}

export interface YTDLFormat {
  format_id: string;
  extension: string;
  resolution: string;
  url: string;
  width?: number;
  height?: number;
  filesize: number;
  vcodec: string;
  acodec: string;
  [key: string]: any;
}
