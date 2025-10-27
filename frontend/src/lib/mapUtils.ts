/**
 * Map Utility Functions
 * Helper functions for map operations and calculations
 */

import L from 'leaflet'
import type { Location } from '@/types'

/**
 * Calculate bounding box for a set of locations
 * @param locations Array of locations to calculate bounds from
 * @returns LatLngBounds or null if no locations
 */
export function calculateTripBounds(locations: Location[]): L.LatLngBounds | null {
  if (locations.length === 0) return null

  // Filter out locations without valid coordinates
  const validLocations = locations.filter((loc) => loc.x != null && loc.y != null && loc.x !== 0 && loc.y !== 0)

  if (validLocations.length === 0) return null

  // Single location: create small bounds around it
  if (validLocations.length === 1) {
    const loc = validLocations[0]
    return L.latLngBounds([
      [loc.y - 0.01, loc.x - 0.01],
      [loc.y + 0.01, loc.x + 0.01],
    ])
  }

  // Multiple locations: calculate actual bounds
  const lats = validLocations.map((loc) => loc.y)
  const lngs = validLocations.map((loc) => loc.x)

  return L.latLngBounds([
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ])
}

/**
 * Fallback city coordinates for common cities
 */
const CITY_COORDINATES: Record<string, [number, number]> = {
  'Tokyo, Japan': [35.6762, 139.6503],
  'Detroit, USA': [42.3314, -83.0458],
  'New York, USA': [40.7128, -74.006],
  'London, UK': [51.5074, -0.1278],
  'Paris, France': [48.8566, 2.3522],
  'San Francisco, USA': [37.7749, -122.4194],
  'Los Angeles, USA': [34.0522, -118.2437],
  'Chicago, USA': [41.8781, -87.6298],
  'Seattle, USA': [47.6062, -122.3321],
  'Austin, USA': [30.2672, -97.7431],
}

/**
 * Get coordinates for a city by name
 * @param city City name
 * @param country Country name
 * @returns [latitude, longitude] or null if not found
 */
export function getCityCoordinates(city: string, country: string): [number, number] | null {
  const key = `${city}, ${country}`
  return CITY_COORDINATES[key] || null
}

/**
 * Create bounds from city coordinates with default padding
 * @param cityCoords [latitude, longitude]
 * @returns LatLngBounds centered on city
 */
export function createCityBounds(cityCoords: [number, number]): L.LatLngBounds {
  const [lat, lng] = cityCoords
  const padding = 0.1 // ~11km at equator

  return L.latLngBounds([
    [lat - padding, lng - padding],
    [lat + padding, lng + padding],
  ])
}
