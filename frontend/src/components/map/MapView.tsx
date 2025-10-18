/**
 * MapView Component
 * Main map container displaying all photos as markers with clustering
 */

import { useEffect } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import { PhotoMarker } from './PhotoMarker'
import { ClusterLayer } from './ClusterLayer'
import { useMapState } from '@/hooks/useMapState'
import type { Photo } from '@/types'
import L from 'leaflet'

interface MapViewProps {
  photos: Photo[]
  onPhotoClick?: (photo: Photo) => void
  className?: string
  enableClustering?: boolean
}

// Helper component to handle map center changes
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()

  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])

  return null
}

export function MapView({ photos, onPhotoClick, className, enableClustering = true }: MapViewProps) {
  const { mapState, flyTo } = useMapState({
    center: [35.6762, 139.6503], // Tokyo default
    zoom: 13,
  })

  // Fly to photo location when clicked
  const handlePhotoClick = (photo: Photo) => {
    flyTo([photo.y, photo.x], 15)
    onPhotoClick?.(photo)
  }

  return (
    <div className={className} style={{ height: '100%', width: '100%' }}>
      <MapContainer
        center={mapState.center}
        zoom={mapState.zoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={"https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" + (L.Browser.retina ? '@2x.png' : '.png')}
          subdomains='abcd'
          minZoom={0}
          maxZoom={20}
          // url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController center={mapState.center} zoom={mapState.zoom} />

        {/* Render photo markers with optional clustering */}
        {enableClustering ? (
          <ClusterLayer maxClusterRadius={60}>
            {photos.map((photo) => (
              <PhotoMarker key={photo.id} photo={photo} onClick={handlePhotoClick} />
            ))}
          </ClusterLayer>
        ) : (
          photos.map((photo) => (
            <PhotoMarker key={photo.id} photo={photo} onClick={handlePhotoClick} />
          ))
        )}
      </MapContainer>
    </div>
  )
}
