export interface ISponsorBlockSegment {
  segment: [number, number]; // [0, 15.23] start and end time in seconds
  UUID: string;
  category:
    | 'sponsor'
    | 'selfpromo'
    | 'interaction'
    | 'intro'
    | 'outro'
    | 'preview'
    | 'hook'
    | 'filler'; // [1]
  videoDuration: number; // Duration of video when submission occurred (to be used to determine when a submission is out of date). 0 when unknown. +- 1 second
  actionType: string; // [3]
  locked: number; // if submission is locked
  votes: number; // Votes on segment
  description: string; // title for chapters, empty string for other segments
}

export interface ISponsorBlockTakenResponse {
  category: ISponsorBlockSegment['category'];
  start: number;
  end: number;
}
