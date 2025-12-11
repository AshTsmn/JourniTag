import { Trip, Location, Photo, CreateTripRequest, CreateLocationRequest, UploadPhotoRequest } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const tripAPI = {
  async getAllTrips(): Promise<Trip[]> {
    // Use /all endpoint to get both owned and shared trips with access control info
    const response = await fetch(`${API_BASE_URL}/trips/all`, {
      credentials: 'include'
    })
    if (!response.ok) throw new Error('Failed to fetch trips')
    const data = await response.json()
    return data.trips || []
  },

  async getTripById(id: string): Promise<{ trip: Trip; locations: Location[]; photos: Photo[] }> {
    const response = await fetch(`${API_BASE_URL}/trips/${id}`, {
      credentials: 'include'
    })
    if (!response.ok) throw new Error('Failed to fetch trip')
    return response.json()
  },

  async createTrip(trip: CreateTripRequest): Promise<Trip> {
    const response = await fetch(`${API_BASE_URL}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(trip),
    })
    if (!response.ok) throw new Error('Failed to create trip')
    const data = await response.json()
    return data.trip
  },

  async updateTrip(id: string, trip: Partial<Trip>): Promise<Trip> {
    const response = await fetch(`${API_BASE_URL}/trips/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(trip),
    })
    if (!response.ok) throw new Error('Failed to update trip')
    const data = await response.json()
    return data.trip
  },

  async deleteTrip(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/trips/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to delete trip' }))
      throw new Error(error.error || 'Failed to delete trip')
    }
    const data = await response.json()
    console.log(data.message) // "Trip 'Tokyo Adventure' deleted successfully"
  }
}

export const locationAPI = {
  async getLocationById(id: string): Promise<{ location: Location; photos: Photo[] }> {
    const response = await fetch(`${API_BASE_URL}/locations/${id}`, {
      credentials: 'include'
    })
    if (!response.ok) throw new Error('Failed to fetch location')
    return response.json()
  },

  async createLocation(location: CreateLocationRequest): Promise<Location> {
    const response = await fetch(`${API_BASE_URL}/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(location),
    })
    if (!response.ok) throw new Error('Failed to create location')
    const data = await response.json()
    return data.location
  },

  async updateLocation(location: Location): Promise<Location> {
    const response = await fetch(`${API_BASE_URL}/locations/${location.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(location),
    })
    if (!response.ok) throw new Error('Failed to update location')
    const data = await response.json()
    return data.location
  },

  async deleteLocation(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/locations/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!response.ok) throw new Error('Failed to delete location')
  },
}

export const photoAPI = {
  async getPhotos(): Promise<Photo[]> {
    const response = await fetch(`${API_BASE_URL}/photos`, {
      credentials: 'include'
    })
    if (!response.ok) throw new Error('Failed to fetch photos')
    const data = await response.json()
    return data.photos || []
  },

  async uploadPhotos(requests: UploadPhotoRequest[]): Promise<Photo[]> {
    if (requests.length === 0) {
      return []
    }

    // All photos should go to the same location
    const locationId = requests[0].location_id

    // Create FormData for batch upload
    const formData = new FormData()
    formData.append('location_id', locationId.toString())

    // Add all files to the FormData
    requests.forEach((request) => {
      formData.append('files', request.file)
    })

    console.log('Uploading photos to Flask backend:', {
      location_id: locationId,
      file_count: requests.length
    })

    // Send batch upload request to Flask
    const response = await fetch(`${API_BASE_URL}/photos/batch-upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
      // Don't set Content-Type header - let browser set it with boundary
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }))
      throw new Error(error.error || 'Failed to upload photos')
    }

    const data = await response.json()
    console.log('Upload response:', data)

    if (!data.success) {
      throw new Error(data.error || 'Upload failed')
    }

    return data.photos || []
  },

  async getPhotosByLocation(locationId: string): Promise<Photo[]> {
    const response = await fetch(`${API_BASE_URL}/photos/location/${locationId}`, {
      credentials: 'include'
    })
    if (!response.ok) throw new Error('Failed to fetch photos')
    const data = await response.json()
    return data.photos || []
  },

  async deletePhoto(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/photos/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!response.ok) throw new Error('Failed to delete photo')
  },

  async setCoverPhoto(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/photos/${id}/set-cover`, {
      method: 'PATCH',
      credentials: 'include',
    })
    if (!response.ok) throw new Error('Failed to set cover photo')
  },
}