/**
 * ClusterLayer Component
 * Supports clustering of custom marker components (like PhotoMarker)
 * Pass PhotoMarker components as children
 */

import { useEffect, ReactElement, Children, isValidElement } from 'react'
import { useMap } from 'react-leaflet'
import L, { MarkerClusterGroup } from 'leaflet'
import { divIcon } from 'leaflet'
import 'leaflet.markercluster'
import type { Photo } from '@/types'

interface ClusterLayerProps {
  children: ReactElement | ReactElement[]
  maxClusterRadius?: number
  showCoverageOnHover?: boolean
}

/**
 * ClusterLayer that wraps PhotoMarker children
 *
 * Usage:
 * <ClusterLayer>
 *   {photos.map(photo => (
 *     <PhotoMarker key={photo.id} photo={photo} onClick={handleClick} />
 *   ))}
 * </ClusterLayer>
 */
export function ClusterLayer({
  children,
  maxClusterRadius = 60,
  showCoverageOnHover = false
}: ClusterLayerProps) {
  const map = useMap()

  useEffect(() => {
    // Create cluster group
    const clusterGroup: MarkerClusterGroup = L.markerClusterGroup({
      showCoverageOnHover,
      maxClusterRadius,
      // Custom cluster icon with count
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount()
        return divIcon({
          html: `<div class="cluster-icon">
            <span>${count}</span>
          </div>`,
          className: 'cluster-marker-wrapper',
          iconSize: L.point(40, 40),
        })
      },
    })

    // Extract marker data from children
    const childArray = Children.toArray(children)

    childArray.forEach((child) => {
      if (!isValidElement(child)) return

      const props = child.props as { photo?: Photo; onClick?: (photo: Photo) => void }
      const photo = props.photo

      if (!photo) return

      // Create the custom icon HTML (same as PhotoMarker)
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

      // Create Leaflet marker with custom icon
      const marker = L.marker([photo.y, photo.x], { icon: customIcon })

      // Add popup
      marker.bindPopup(`
        <div class="min-w-[200px]">
          <img
            src="${photo.file_url}"
            alt="${photo.original_filename}"
            class="w-full h-32 object-cover rounded-md mb-2"
          />
          <p class="text-sm font-medium">
            ${photo.location?.name || 'Unknown Location'}
          </p>
          ${photo.taken_at ? `
            <p class="text-xs text-gray-500">
              ${new Date(photo.taken_at).toLocaleDateString()}
            </p>
          ` : ''}
        </div>
      `)

      // Handle click event
      if (props.onClick) {
        marker.on('click', () => {
          props.onClick?.(photo)
        })
      }

      // Add marker to cluster group
      clusterGroup.addLayer(marker)
    })

    // Add cluster group to map
    map.addLayer(clusterGroup)

    // Cleanup on unmount
    return () => {
      map.removeLayer(clusterGroup)
    }
  }, [map, children, maxClusterRadius, showCoverageOnHover])

  // Don't render anything to DOM
  return null
}