'use client';

import { useState } from 'react';
import type { TouristVideo } from '@/types/touristVideo';
import { FootageTile } from './FootageTile';
import { VideoLightbox } from './VideoLightbox';

interface FanFootageWallProps {
  videos: TouristVideo[];
}

export const FanFootageWall = ({ videos }: FanFootageWallProps) => {
  const [selectedVideo, setSelectedVideo] = useState<TouristVideo | null>(null);

  if (videos.length === 0) return null;

  return (
    <section aria-label="Fan footage from the host cities">
      {/* Section header */}
      <div className="mb-4">
        <h2 className="text-[#f3f6fa] text-xl font-bold tracking-tight m-0">
          Fan footage from the host cities
        </h2>
        <p className="text-[#8a97a8] text-sm mt-1 m-0">
          Short clips captured by fans on the ground across all 16 venues.
        </p>
      </div>

      {/* Video wall grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {videos.map((video) => (
          <FootageTile
            key={video.id}
            video={video}
            onOpen={setSelectedVideo}
          />
        ))}
      </div>

      {/* Pop-up player — rendered in place, floats via fixed positioning */}
      {selectedVideo != null && (
        <VideoLightbox
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </section>
  );
};
