/**
 * TypeScript interfaces matching the database schema
 * These types represent the data structure expected from the backend API
 */

// ============================================
// Core Entities
// ============================================

export interface User {
  id: string
  email: string
  name: string
  profile_photo_url?: string
  created_at: string
}

export interface Trip {
  id: string
  user_id: string
  title: string
  city: string
  country: string
  start_date: string
  end_date: string
  created_at: string
  // Additional computed fields
  rating?: number // Average rating from locations
  cover_photo?: Photo
  photo_count?: number
}

export interface Location {
  id: string
  x: number // longitude
  y: number // latitude
  trip_id: string
  name: string
  address: string
  rating: number // 1-5 stars
  notes?: string // Personal context
  tags: string[] // ["Cultural", "Local eats", "Tourist spot", etc.]
  cost_level: CostLevel // "Free" | "$" | "$$" | "$$$"
  time_needed?: number // in minutes
  best_time_to_visit?: string // e.g., "7:00 am - 9:00 am"
  created_at: string
  // Additional fields
  photos?: Photo[] // Photos at this location
}

export interface Photo {
  id: string
  location_id: string
  user_id: string
  x: number // longitude
  y: number // latitude
  file_url: string
  original_filename: string
  taken_at?: string // from EXIF data
  is_cover_photo: boolean
  // Additional fields
  location?: Location
}

export interface SharedTrip {
  id: string
  trip_id: string
  shared_by_user_id: string
  shared_with_email: string
  share_token: string // unique URL identifier
  created_at: string
  expires_at?: string
}

// ============================================
// Enums & Constants
// ============================================

export type CostLevel = "Free" | "$" | "$$" | "$$$" | "$-$$" | "$$-$$$"

export const COST_LEVELS: CostLevel[] = ["Free", "$", "$$", "$$$", "$-$$", "$$-$$$"]

export const TAG_OPTIONS = [
  "Cultural",
  "Local eats",
  "Tourist spot",
  "Splurge-worthy",
  "Nature",
  "Shopping",
  "Nightlife",
  "Hidden gem",
  "Family-friendly",
  "Adventure",
] as const

export type Tag = (typeof TAG_OPTIONS)[number]

// ============================================
// API Request/Response Types
// ============================================

export interface CreateTripRequest {
  title: string
  city: string
  country: string
  start_date: string
  end_date: string
}

export interface UpdateTripRequest extends Partial<CreateTripRequest> {
  id: string
}

export interface CreateLocationRequest {
  trip_id: string
  x: number
  y: number
  name: string
  address: string
  rating: number
  notes?: string
  tags: string[]
  cost_level: CostLevel
  time_needed?: number
  best_time_to_visit?: string
}

export interface UpdateLocationRequest extends Partial<CreateLocationRequest> {
  id: string
}

export interface UploadPhotoRequest {
  location_id?: string // Optional if creating new location
  file: File
  x?: number // From EXIF or manual selection
  y?: number
  is_cover_photo?: boolean
}

export interface ShareTripRequest {
  trip_id: string
  shared_with_email: string
  expires_in_days?: number
}

// ============================================
// UI State Types
// ============================================

export interface MapState {
  center: [number, number]
  zoom: number
  selectedLocationId?: string
  selectedPhotoId?: string
}

export interface UploadState {
  files: File[]
  previews: {
    file: File
    preview: string
    coordinates?: { x: number; y: number }
    exifData?: ExifData
  }[]
  currentStep: "select" | "locate" | "details" | "uploading"
}

export interface ExifData {
  latitude?: number
  longitude?: number
  dateTaken?: string
  camera?: string
  location?: string
}

// ============================================
// Filter & Search Types
// ============================================

export interface TripFilters {
  search?: string
  country?: string
  year?: number
  minRating?: number
}

export interface LocationFilters {
  tags?: string[]
  minRating?: number
  costLevel?: CostLevel[]
}
