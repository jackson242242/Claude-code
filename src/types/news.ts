/** Gradient key for thumbnail stand-ins (no real images in Phase 0). */
export type ThumbnailKind =
  | 'teal-to-turquoise'
  | 'coral-to-gold'
  | 'grape-to-turquoise'
  | 'citrus-to-teal'
  | 'gold-to-coral'
  | 'turquoise-to-grape';

export type NewsCategory = 'team' | 'player' | 'schedule' | 'city' | 'video';

export interface NewsItem {
  id: string;
  category: NewsCategory;
  title: string;
  summary: string;
  source: string;
  publishedIso: string;
  thumbnailKind: ThumbnailKind;
  minutesRead?: number;
  videoSeconds?: number;
  teamName?: string;
  cityId?: string;
  /** City id to pre-fill the booking search in ConversionBridge */
  ctaCityId?: string;
}

export interface PlayerSpotlight {
  id: string;
  name: string;
  teamName: string;
  position: string;
  nationality: string;
  capsOrApps: number;
  description: string;
  thumbnailKind: ThumbnailKind;
}

export interface TeamBrief {
  id: string;
  name: string;
  confederation: string;
  groupId: string;
  wins: number;
  draws: number;
  losses: number;
  blurb: string;
}
