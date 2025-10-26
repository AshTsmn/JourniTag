/**
 * Mock Data Generators
 * Used for frontend development while backend is being built
 */

import type { User, Trip, Location, Photo } from '@/types'

// ============================================
// Mock Data
// ============================================

export const mockUser: User = {
  id: '1',
  email: 'user@example.com',
  name: 'Travel Enthusiast',
  profile_photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=traveler',
  created_at: '2024-01-01T00:00:00Z',
}

export const mockTrips: Trip[] = [
  {
    id: '1',
    user_id: '1',
    title: '🌸 tokyo ~ 🌸',
    city: 'Tokyo',
    country: 'Japan',
    start_date: '2024-05-03',
    end_date: '2024-05-14',
    created_at: '2024-05-01T00:00:00Z',
    rating: 4.7,
    photo_count: 6,
  },
  {
    id: '2',
    user_id: '1',
    title: 'detroit 🏙️',
    city: 'Detroit',
    country: 'USA',
    start_date: '2024-04-05',
    end_date: '2024-04-08',
    created_at: '2024-04-01T00:00:00Z',
    rating: 2.8,
    photo_count: 4,
  },
]

export const mockLocations: Location[] = [
  // Tokyo Locations
  {
    id: '1',
    x: 139.7683, // longitude (Sensō-ji Temple)
    y: 35.7148, // latitude
    trip_id: '1',
    name: 'Sensō-ji / Asakusa',
    address: '2 Chome-3-1 Asakusa, Taito City, Tokyo 111-0032, Japan',
    rating: 5,
    notes: 'For the Temple: "Go at 7am - way fewer crowds"\nFor the Sushi: "Best tuna ever. Cash only!"\nFor the Plushies: "Cute but overpriced. Don Quijote has same ones cheaper."',
    tags: ['Cultural', 'Local eats', 'Splurge-worthy', 'Tourist spot'],
    cost_level: '$-$$',
    time_needed: 120, // 2-3 hours
    best_time_to_visit: '7:00 am - 9:00 am',
    created_at: '2024-05-03T07:00:00Z',
  },
  {
    id: '2',
    x: 139.7017,
    y: 35.6586,
    trip_id: '1',
    name: 'Shibuya Crossing',
    address: 'Shibuya, Tokyo, Japan',
    rating: 4,
    notes: 'Iconic crossing! Best viewed from Starbucks 2nd floor.',
    tags: ['Tourist spot', 'Cultural'],
    cost_level: 'Free',
    time_needed: 30,
    best_time_to_visit: '6:00 pm - 8:00 pm',
    created_at: '2024-05-04T18:00:00Z',
  },
  {
    id: '3',
    x: 139.7037,
    y: 35.6698,
    trip_id: '1',
    name: 'Meiji Shrine',
    address: '1-1 Yoyogikamizonocho, Shibuya City, Tokyo 151-8557, Japan',
    rating: 5,
    notes: 'Peaceful shrine in the heart of Tokyo. Write a wish on an ema!',
    tags: ['Cultural', 'Nature', 'Hidden gem'],
    cost_level: 'Free',
    time_needed: 60,
    best_time_to_visit: '8:00 am - 10:00 am',
    created_at: '2024-05-05T08:30:00Z',
  },
  // Detroit Locations
  {
    id: '4',
    x: -83.0458, // longitude (Detroit Institute of Arts)
    y: 42.3594, // latitude
    trip_id: '2',
    name: 'Detroit Institute of Arts',
    address: '5200 Woodward Ave, Detroit, MI 48202, USA',
    rating: 4,
    notes: 'For the Museum: "Diego Rivera murals are a must-see"\nFor the Coffee Shop: "Cafe DIA has decent pastries"',
    tags: ['Cultural', 'Tourist spot'],
    cost_level: '$$',
    time_needed: 120,
    best_time_to_visit: '10:00 am - 12:00 pm',
    created_at: '2024-04-05T10:00:00Z',
  },
  {
    id: '5',
    x: -83.0401,
    y: 42.3314,
    trip_id: '2',
    name: 'Belle Isle Park',
    address: 'Detroit, MI 48207, USA',
    rating: 3,
    notes: 'Nice island park. Good for walking but nothing special.',
    tags: ['Nature', 'Hidden gem'],
    cost_level: 'Free',
    time_needed: 90,
    best_time_to_visit: '2:00 pm - 5:00 pm',
    created_at: '2024-04-06T14:00:00Z',
  },
  {
    id: '6',
    x: -83.0497,
    y: 42.3486,
    trip_id: '2',
    name: 'Lafayette Coney Island',
    address: '118 W Lafayette Blvd, Detroit, MI 48226, USA',
    rating: 2,
    notes: 'For the Hot Dogs: "Overrated. American Coney Island next door is better"',
    tags: ['Local eats'],
    cost_level: '$',
    time_needed: 30,
    best_time_to_visit: '12:00 pm - 1:00 pm',
    created_at: '2024-04-07T12:30:00Z',
  },
]

export const mockPhotos: Photo[] = [
  // Tokyo Photos
  {
    id: '1',
    location_id: '1',
    user_id: '1',
    x: 139.7683,
    y: 35.7148,
    file_url: '/src/assets/test-photos/pic-1.png',
    original_filename: 'IMG_2045.jpg',
    taken_at: '2024-05-03T07:15:00Z',
    is_cover_photo: true,
  },
  {
    id: '2',
    location_id: '1',
    user_id: '1',
    x: 139.7683,
    y: 35.7148,
    file_url: '/src/assets/test-photos/pic-2.png',
    original_filename: 'IMG_2046.jpg',
    taken_at: '2024-05-03T12:30:00Z',
    is_cover_photo: false,
  },
  {
    id: '3',
    location_id: '1',
    user_id: '1',
    x: 139.7685,
    y: 35.7150,
    file_url: '/src/assets/test-photos/pic-3.png',
    original_filename: 'IMG_2047.jpg',
    taken_at: '2024-05-03T14:00:00Z',
    is_cover_photo: false,
  },
  {
    id: '4',
    location_id: '2',
    user_id: '1',
    x: 139.7017,
    y: 35.6586,
    file_url: '/src/assets/test-photos/pic-4.png',
    original_filename: 'IMG_2048.jpg',
    taken_at: '2024-05-04T19:00:00Z',
    is_cover_photo: true,
  },
  {
    id: '5',
    location_id: '3',
    user_id: '1',
    x: 139.7037,
    y: 35.6698,
    file_url: '/src/assets/test-photos/pic-5.png',
    original_filename: 'IMG_2049.jpg',
    taken_at: '2024-05-05T09:00:00Z',
    is_cover_photo: true,
  },
  {
    id: '6',
    location_id: '3',
    user_id: '1',
    x: 139.7040,
    y: 35.6700,
    file_url: '/src/assets/test-photos/pic-6.png',
    original_filename: 'IMG_2050.jpg',
    taken_at: '2024-05-05T10:00:00Z',
    is_cover_photo: false,
  },
  // Detroit Photos (reusing test-photos assets)
  {
    id: '7',
    location_id: '4',
    user_id: '1',
    x: -83.0458,
    y: 42.3594,
    file_url: '/src/assets/test-photos/pic-1.png',
    original_filename: 'IMG_3001.jpg',
    taken_at: '2024-04-05T10:30:00Z',
    is_cover_photo: true,
  },
  {
    id: '8',
    location_id: '4',
    user_id: '1',
    x: -83.0460,
    y: 42.3595,
    file_url: '/src/assets/test-photos/pic-2.png',
    original_filename: 'IMG_3002.jpg',
    taken_at: '2024-04-05T11:00:00Z',
    is_cover_photo: false,
  },
  {
    id: '9',
    location_id: '5',
    user_id: '1',
    x: -83.0401,
    y: 42.3314,
    file_url: '/src/assets/test-photos/pic-3.png',
    original_filename: 'IMG_3003.jpg',
    taken_at: '2024-04-06T14:30:00Z',
    is_cover_photo: true,
  },
  {
    id: '10',
    location_id: '6',
    user_id: '1',
    x: -83.0497,
    y: 42.3486,
    file_url: '/src/assets/test-photos/pic-4.png',
    original_filename: 'IMG_3004.jpg',
    taken_at: '2024-04-07T12:45:00Z',
    is_cover_photo: true,
  },
]

// ============================================
// Mock Data Generators
// ============================================

export function getLocationWithPhotos(locationId: string): Location | undefined {
  const location = mockLocations.find((l) => l.id === locationId)
  if (!location) return undefined

  return {
    ...location,
    photos: mockPhotos.filter((p) => p.location_id === locationId),
  }
}

export function getTripWithData(tripId: string) {
  const trip = mockTrips.find((t) => t.id === tripId)
  if (!trip) return null

  const locations = mockLocations.filter((l) => l.trip_id === tripId)
  const photos = mockPhotos.filter((p) =>
    locations.some((l) => l.id === p.location_id)
  )

  const coverPhoto = photos.find((p) => p.is_cover_photo)

  return {
    trip: {
      ...trip,
      cover_photo: coverPhoto,
    },
    locations,
    photos,
  }
}

export function getAllPhotosWithLocations(): (Photo & { location?: Location })[] {
  return mockPhotos.map((photo) => ({
    ...photo,
    location: mockLocations.find((l) => l.id === photo.location_id),
  }))
}

// ============================================
// Helper Functions
// ============================================

/**
 * Generate a random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

/**
 * Simulate API delay
 */
export function delay(ms: number = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Get random element from array
 */
export function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
