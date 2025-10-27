import { useState, useEffect } from 'react'
import L from 'leaflet'
import { MapView } from '@/components/map'
import { Sidebar, SidebarView } from '@/components/sidebar/Sidebar'
import { SidebarHome } from '@/components/sidebar/SidebarHome'
import { TripListView } from '@/components/sidebar/TripListView'
import { TripDetailView } from '@/components/sidebar/TripDetailView'
import { LocationDetailView } from '@/components/location/LocationDetailView'
import { LocationDetailEdit } from '@/components/location/LocationDetailEdit'
import { UploadModal } from '@/components/upload'
import { usePhotos } from '@/hooks/usePhotos'
import { locationAPI, tripAPI } from '@/services/api'
import { calculateTripBounds, getCityCoordinates, createCityBounds } from '@/lib/mapUtils'
import type { Photo, Location, Trip } from '@/types'
import './App.css'

function App() {
  const { photos, loading: photosLoading, setPhotos } = usePhotos()
  const [trips, setTrips] = useState<Trip[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [tripsLoading, setTripsLoading] = useState(true)
  const [sidebarView, setSidebarView] = useState<SidebarView>('home')
  const [isEditing, setIsEditing] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [locationPhotos, setLocationPhotos] = useState<Photo[]>([])
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [mapFocusBounds, setMapFocusBounds] = useState<L.LatLngBounds | null>(null)

  const loading = photosLoading || tripsLoading

  // Fetch trips on mount
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setTripsLoading(true)
        const tripsData = await tripAPI.getAllTrips()
        setTrips(tripsData)
      } catch (error) {
        console.error('Error fetching trips:', error)
      } finally {
        setTripsLoading(false)
      }
    }

    fetchTrips()
  }, [])

  const handlePhotoClick = async (photo: Photo) => {
    console.log('Photo clicked:', photo)

    // Get location with all photos from API
    if (photo.location_id) {
      try {
        const { location, photos } = await locationAPI.getLocationById(photo.location_id.toString())
        setSelectedLocation({ ...location, photos })
        setLocationPhotos(photos)
        setSidebarView('location-detail')
        setIsEditing(false)
      } catch (error) {
        console.error('Error fetching location:', error)
      }
    }
  }

  const handleBackToHome = () => {
    setSidebarView('home')
    setSelectedTrip(null)
    setSelectedLocation(null)
    setLocationPhotos([])
    setIsEditing(false)
  }

  const handleBackToTripList = () => {
    setSidebarView('trip-list')
    setSelectedTrip(null)
    setSelectedLocation(null)
    setIsEditing(false)
  }

  const handleBackToTripDetail = async () => {
    setSidebarView('trip-detail')
    setSelectedLocation(null)
    setIsEditing(false)

    // Re-fetch trip locations to ensure we have the latest data
    if (selectedTrip) {
      try {
        const tripData = await tripAPI.getTripById(selectedTrip.id.toString())

        // Update locations state with trip locations
        setLocations(prev => {
          const byId: Record<string, Location> = {}
          for (const l of prev) byId[l.id] = l
          for (const l of tripData.locations) byId[l.id] = l
          return Object.values(byId)
        })

        // Recalculate bounds for trip locations
        const bounds = calculateTripBounds(tripData.locations)
        if (bounds) {
          setMapFocusBounds(bounds)
        }
      } catch (error) {
        console.error('Error fetching trip details:', error)
      }
    }
  }

  const handleMyTripsClick = () => {
    setSidebarView('trip-list')
  }

  const handleTripClick = async (trip: Trip) => {
    console.log('Trip clicked:', trip)
    setSelectedTrip(trip)
    setSidebarView('trip-detail')

    // Fetch trip details including locations from API
    try {
      const tripData = await tripAPI.getTripById(trip.id.toString())

      // Update locations state with trip locations
      setLocations(prev => {
        const byId: Record<string, Location> = {}
        for (const l of prev) byId[l.id] = l
        for (const l of tripData.locations) byId[l.id] = l
        return Object.values(byId)
      })

      // Calculate bounds for trip locations and focus map
      const bounds = calculateTripBounds(tripData.locations)

      if (bounds) {
        setMapFocusBounds(bounds)
      } else {
        // Fallback to city coordinates
        const cityCoords = getCityCoordinates(trip.city, trip.country)
        if (cityCoords) {
          setMapFocusBounds(createCityBounds(cityCoords))
        }
      }
    } catch (error) {
      console.error('Error fetching trip details:', error)
      // Fallback to city coordinates on error
      const cityCoords = getCityCoordinates(trip.city, trip.country)
      if (cityCoords) {
        setMapFocusBounds(createCityBounds(cityCoords))
      }
    }
  }

  const handleLocationClick = async (location: Location) => {
    console.log('Location clicked:', location)

    // Fetch location details from API
    try {
      const { location: fetchedLocation, photos } = await locationAPI.getLocationById(location.id.toString())
      const enriched = { ...fetchedLocation, photos }

      // Update locations state
      setLocations(prev => {
        const byId: Record<string, Location> = {}
        for (const l of prev) byId[l.id] = l
        byId[enriched.id] = enriched
        return Object.values(byId)
      })

      setSelectedLocation(enriched)
      setLocationPhotos(photos)
      setSidebarView('location-detail')
      setIsEditing(false)
    } catch (error) {
      console.error('Error fetching location:', error)
    }
  }

  const handleEditClick = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  const handleSaveLocation = (location: Location) => {
    console.log('Saving location:', location)
    // Persist to mock API store and refresh local state
    locationAPI.updateLocation(location).then((updated) => {
      // update local locations state
      setLocations(prev => {
        const idx = prev.findIndex(l => l.id === updated.id)
        if (idx === -1) return [...prev, updated]
        const copy = [...prev]
        copy[idx] = updated
        return copy
      })
      setSelectedLocation(updated)
      setIsEditing(false)

      // Recompute trip stats (avg rating, photo count)
      if (updated.trip_id) {
        const related = locations.filter(l => l.trip_id === updated.trip_id).map(l => l.id === updated.id ? updated : l)
        const rated = related.filter(l => (l.rating ?? 0) > 0)
        const avg = rated.length > 0 ? rated.reduce((s, l) => s + (l.rating ?? 0), 0) / rated.length : 0
        const photosCount = related.reduce((s, l) => s + (l.photos?.length || 0), 0)
        setTrips(prev => prev.map(t => t.id === updated.trip_id ? { ...t, rating: avg || undefined, photo_count: photosCount } : t))
      }
    })
  }

  const handleUploadClick = () => {
    console.log('Upload clicked - opening modal')
    setIsUploadModalOpen(true)
    console.log('Modal state set to:', true)
  }

  const handleUploadComplete = (trip?: Trip, newLocations?: Location[], pendingPhotos?: UploadPhotoRequest[]) => {
  console.log('Upload completed:', { trip, locations: newLocations, pendingPhotos })

  if (trip) {
    setTrips(prevTrips => {
      // Only add if this trip doesn't already exist
      const exists = prevTrips.some(t => t.id === trip.id)
      if (exists) {
        console.log('Trip already exists, not adding duplicate')
        return prevTrips
      }
      console.log('Adding new trip:', trip)
      return [...prevTrips, trip]
    })
  }

  if (newLocations && newLocations.length > 0) {
    setLocations(prev => [...prev, ...newLocations])

    // Navigate to edit the first location
    if (trip) {
      const first = newLocations[0]
      if (first) {
        setSelectedTrip(trip)
        setSelectedLocation({ ...first, pendingPhotoUploads: pendingPhotos }) // Add pending photos here
        setLocationPhotos(first.photos || [])
        setIsEditing(true)
        setSidebarView('location-detail')
      }
    }
  }

  setIsUploadModalOpen(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading photos...</p>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex">
      {/* Sidebar */}
      <Sidebar view={sidebarView}>
        {sidebarView === 'home' && (
          <SidebarHome
            onTripClick={handleTripClick}
            onUploadClick={handleUploadClick}
            onMyTripsClick={handleMyTripsClick}
            trips={trips}
          />
        )}

        {sidebarView === 'trip-list' && (
          <TripListView onBack={handleBackToHome} onTripClick={handleTripClick} trips={trips} />
        )}

        {sidebarView === 'trip-detail' && selectedTrip && (
          <TripDetailView
            trip={selectedTrip}
            locations={locations}
            onBack={handleBackToTripList}
            onLocationClick={handleLocationClick}
          />
        )}

        {sidebarView === 'location-detail' && selectedLocation && (
          isEditing ? (
            <LocationDetailEdit
              location={selectedLocation}
              photos={locationPhotos}
              onCancel={handleCancelEdit}
              onSave={handleSaveLocation}
            />
          ) : (
            <LocationDetailView
              location={selectedLocation}
              photos={locationPhotos}
              onBack={selectedTrip ? handleBackToTripDetail : handleBackToHome}
              onEdit={handleEditClick}
            />
          )
        )}
      </Sidebar>

      {/* Map - offset by sidebar width */}
      <div className="flex-1" style={{ marginLeft: sidebarView === 'location-detail' ? '400px' : '360px' }}>
        <MapView
          photos={photos}
          onPhotoClick={handlePhotoClick}
          focusBounds={mapFocusBounds}
          enableClustering={false}
        />
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  )
}

export default App
