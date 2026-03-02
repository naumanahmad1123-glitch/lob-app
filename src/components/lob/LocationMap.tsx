import { MapPin, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

interface LocationMapProps {
  location: string;
}

export function LocationMap({ location }: LocationMapProps) {
  const encodedLocation = encodeURIComponent(location);
  const mapsEmbedUrl = `https://maps.google.com/maps?q=${encodedLocation}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedLocation}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="gradient-card rounded-2xl overflow-hidden border border-border/50 shadow-card mb-4"
    >
      {/* Map embed */}
      <div className="w-full h-40 relative">
        <iframe
          src={mapsEmbedUrl}
          className="w-full h-full border-0 grayscale-[20%] contrast-[1.1]"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`Map of ${location}`}
        />
      </div>

      {/* Location info + directions */}
      <div className="p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-medium text-foreground truncate">{location}</span>
        </div>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shrink-0 hover:opacity-90 transition-opacity"
        >
          <Navigation className="w-3.5 h-3.5" />
          Directions
        </a>
      </div>
    </motion.div>
  );
}
