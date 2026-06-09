/**
 * Types for the Fan Footage / Tourist Video pillar.
 *
 * ThumbnailKind is limited to the four gradient keys used in this pillar.
 * Cards show gradient placeholders until posterUrl / videoUrl are populated
 * from a real source (e.g. Pexels via PEXELS_API_KEY).
 */

export type ThumbnailKind =
  | 'teal-to-turquoise'
  | 'grape-to-turquoise'
  | 'coral-to-gold'
  | 'citrus-to-teal';

export interface TouristVideo {
  id: string;
  title: string;
  /** One of the 16 host-city ids, or null for generic content. */
  cityId: string | null;
  /** Search query / keyword that produced this result (for traceability). */
  query: string;
  /** Thumbnail image URL, or null when showing a gradient placeholder. */
  posterUrl: string | null;
  /** Direct mp4 URL, or null when no real source is connected. */
  videoUrl: string | null;
  durationSeconds: number;
  /** 'Pexels' | 'Matchday26' */
  sourceName: string;
  /** Attribution link — Pexels licence requires linking back to the asset page. */
  sourceUrl: string;
  /** Uploader / creator name from the source, or null. */
  author: string | null;
  thumbnailKind: ThumbnailKind;
}
