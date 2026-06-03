'use client';

import { useState } from 'react';

interface ShareTripLinkProps {
  shareToken: string;
}

export const ShareTripLink = ({ shareToken }: ShareTripLinkProps) => {
  const [copied, setCopied] = useState(false);
  const path = `/trips/shared/${shareToken}`;
  const url =
    typeof window !== 'undefined' ? `${window.location.origin}${path}` : path;

  const onCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be unavailable; the read-only field still lets users copy.
    }
  };

  return (
    <div className="share">
      <input
        readOnly
        className="share__url"
        value={url}
        aria-label="Shareable trip link"
        onFocus={(event) => event.target.select()}
      />
      <button type="button" onClick={onCopy}>
        {copied ? 'Copied!' : 'Copy link'}
      </button>
    </div>
  );
};
