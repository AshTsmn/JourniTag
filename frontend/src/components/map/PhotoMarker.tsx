/**
 * PhotoMarker Component
 * Displays a photo as a marker on the map with thumbnail
 */

import { Marker, Popup } from 'react-leaflet'
import { divIcon } from 'leaflet'
import type { Photo } from '@/types'

interface PhotoMarkerProps {
  photo: Photo
  onClick?: (photo: Photo) => void
}

export function PhotoMarker({ photo, onClick }: PhotoMarkerProps) {
  // Create custom icon with photo thumbnail
  const customIcon = divIcon({
    html: `
      <div class="photo-marker">
        <img
          src="${photo.file_url}"
          alt="${photo.original_filename}"
          class="photo-marker-img"
        />
      </div>
    `,
    className: 'photo-marker-wrapper',
    iconSize: [50, 50],
    iconAnchor: [25, 50],
    popupAnchor: [0, -50],
  })

  return (
    <Marker
      position={[photo.y, photo.x]}
      icon={customIcon}
      eventHandlers={{
        click: () => onClick?.(photo),
      }}
    >
      <Popup>
        <div className="min-w-[200px]">
          <img
            src={photo.file_url}
            alt={photo.original_filename}
            className="w-full h-32 object-cover rounded-md mb-2"
          />
          <p className="text-sm font-medium">
            {photo.location?.name || 'Unknown Location'}
          </p>
          {photo.taken_at && (
            <p className="text-xs text-muted-foreground">
              {new Date(photo.taken_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </Popup>
    </Marker>
  )
}

// Add these styles to your global CSS or create a separate CSS file
export const photoMarkerStyles = `
.photo-marker-wrapper {
  background: transparent;
  border: none;
}

.photo-marker {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.photo-marker:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  border-color: #3b82f6;
}

.photo-marker-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
`
