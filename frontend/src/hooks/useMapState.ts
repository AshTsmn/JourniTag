/**
 * useMapState Hook
 * Manages map state: center, zoom, selected location/photo
 */

import { useState, useCallback } from 'react'
import type { MapState } from '@/types'

export function useMapState(initialState?: Partial<MapState>) {
  const [mapState, setMapState] = useState<MapState>({
    center: initialState?.center || [35.6762, 139.6503], // Default: Tokyo
    zoom: initialState?.zoom || 13,
    selectedLocationId: initialState?.selectedLocationId,
    selectedPhotoId: initialState?.selectedPhotoId,
  })

  const setCenter = useCallback((center: [number, number]) => {
    setMapState((prev) => ({ ...prev, center }))
  }, [])

  const setZoom = useCallback((zoom: number) => {
    setMapState((prev) => ({ ...prev, zoom }))
  }, [])

  const selectLocation = useCallback((locationId: string | undefined) => {
    setMapState((prev) => ({ ...prev, selectedLocationId: locationId }))
  }, [])

  const selectPhoto = useCallback((photoId: string | undefined) => {
    setMapState((prev) => ({ ...prev, selectedPhotoId: photoId }))
  }, [])

  const flyTo = useCallback((center: [number, number], zoom?: number) => {
    setMapState((prev) => ({
      ...prev,
      center,
      zoom: zoom ?? prev.zoom,
    }))
  }, [])

  const reset = useCallback(() => {
    setMapState({
      center: [35.6762, 139.6503],
      zoom: 13,
      selectedLocationId: undefined,
      selectedPhotoId: undefined,
    })
  }, [])

  return {
    mapState,
    setCenter,
    setZoom,
    selectLocation,
    selectPhoto,
    flyTo,
    reset,
  }
}
