export interface ISponsorBlockSegment {
  segment: [number, number];
  UUID: string;
  category:
    | "sponsor"
    | "selfpromo"
    | "interaction"
    | "intro"
    | "outro"
    | "preview"
    | "hook"
    | "filler";
  videoDuration: number;
  actionType: string;
  locked: number;
  votes: number;
  description: string;
}

export interface ISponsorBlockTakenResponse {
  category: ISponsorBlockSegment["category"];
  start: number;
  end: number;
}
