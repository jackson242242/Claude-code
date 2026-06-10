interface LiveBadgeProps {
  /** Feed name to attribute, e.g. "The Guardian". */
  source?: string | null;
}

/**
 * A small "Live" pill shown on the news section only when a real RSS feed is
 * actually flowing (the page passes live=true). Honest by construction: on the
 * seed fallback the pill is simply not rendered.
 */
export const LiveBadge = ({ source }: LiveBadgeProps) => (
  <span
    className="inline-flex items-center gap-1.5 rounded-full border border-[#2ec27e]/40 bg-[#2ec27e]/10 px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wider text-[#2ec27e]"
    title={
      source != null
        ? `Live football headlines via ${source}, refreshed hourly`
        : 'Live football headlines, refreshed hourly'
    }
  >
    <span aria-hidden="true" className="relative flex h-1.5 w-1.5">
      <span className="absolute inline-flex h-full w-full rounded-full bg-[#2ec27e] opacity-75 motion-safe:animate-ping" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#2ec27e]" />
    </span>
    Live{source != null ? ` · ${source}` : ''}
  </span>
);
