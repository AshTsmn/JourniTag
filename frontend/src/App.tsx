import { useState } from 'react'
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
import { getLocationWithPhotos, mockLocations } from '@/lib/mockData'
import { locationAPI } from '@/services/api'
import { calculateTripBounds, getCityCoordinates, createCityBounds } from '@/lib/mapUtils'
import type { Photo, Location, Trip } from '@/types'
import './App.css'

function App() {
  const { photos, loading, setPhotos } = usePhotos()
  const [trips, setTrips] = useState<Trip[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [sidebarView, setSidebarView] = useState<SidebarView>('home')
  const [isEditing, setIsEditing] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [locationPhotos, setLocationPhotos] = useState<Photo[]>([])
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [mapFocusBounds, setMapFocusBounds] = useState<L.LatLngBounds | null>(null)

  const handlePhotoClick = (photo: Photo) => {
    console.log('Photo clicked:', photo)

    // Get location with all photos
    if (photo.location_id) {
      const locationWithPhotos = getLocationWithPhotos(photo.location_id)
      if (locationWithPhotos) {
        setSelectedLocation(locationWithPhotos)
        setLocationPhotos(locationWithPhotos.photos || [])
        setSidebarView('location-detail')
        setIsEditing(false)
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

  const handleBackToTripDetail = () => {
    setSidebarView('trip-detail')
    setSelectedLocation(null)
    setIsEditing(false)
  }

  const handleMyTripsClick = () => {
    setSidebarView('trip-list')
  }

  const handleTripClick = (trip: Trip) => {
    console.log('Trip clicked:', trip)
    setSelectedTrip(trip)
    setSidebarView('trip-detail')

    // Calculate bounds for trip locations and focus map
    const tripLocations = mockLocations.filter((loc) => loc.trip_id === trip.id)
    const bounds = calculateTripBounds(tripLocations)

    if (bounds) {
      setMapFocusBounds(bounds)
    } else {
      // Fallback to city coordinates
      const cityCoords = getCityCoordinates(trip.city, trip.country)
      if (cityCoords) {
        setMapFocusBounds(createCityBounds(cityCoords))
      }
    }
  }

  const handleLocationClick = (location: Location) => {
    console.log('Location clicked:', location)
    // Prefer runtime state location with photos
    const runtime = locations.find(l => l.id === location.id) || location
    const withMock = runtime.photos && runtime.photos.length > 0
      ? runtime
      : getLocationWithPhotos(location.id) || runtime

    setSelectedLocation(withMock)
    setLocationPhotos(withMock.photos || [])
    setSidebarView('location-detail')
    setIsEditing(false)
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

  const handleUploadComplete = (trip?: Trip, newLocations?: Location[]) => {
    console.log('Upload completed:', { trip, locations: newLocations })

    if (trip) {
      setTrips(prevTrips => [...prevTrips, trip])
      console.log('Added new trip to trips list:', trip)
    }

    if (newLocations && newLocations.length > 0) {
      console.log('Adding locations to state and map:', newLocations)
      // store locations for TripDetail view
      setLocations(prev => [...prev, ...newLocations])

      // add their photos to the map
      setPhotos(prevPhotos => {
        const newPhotos = newLocations.flatMap(location =>
          location.photos?.map(photo => ({
            ...photo,
            location: location
          })) || []
        )
        console.log('New photos to add:', newPhotos)
        return [...prevPhotos, ...newPhotos]
      })

      // compute trip stats
      if (trip) {
        const rated = newLocations.filter(l => (l.rating ?? 0) > 0)
        const avg = rated.length > 0 ? rated.reduce((s, l) => s + (l.rating ?? 0), 0) / rated.length : 0
        const photosCount = newLocations.reduce((s, l) => s + (l.photos?.length || 0), 0)
        setTrips(prev => prev.map(t => t.id === trip.id ? { ...t, rating: avg || undefined, photo_count: photosCount } : t))
      }

      // Navigate author to edit the first created location
      if (trip) {
        const first = newLocations[0]
        if (first) {
          setSelectedTrip(trip)
          setSelectedLocation(first)
          setLocationPhotos(first.photos || [])
          setIsEditing(true)
          setSidebarView('location-detail')
        }
      }
    }

    // Force a refresh to ensure the UI updates
    setTimeout(() => {
      console.log('Forcing UI refresh...')
      setTrips(prevTrips => [...prevTrips])
      setPhotos(prevPhotos => [...prevPhotos])
    }, 100)

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
