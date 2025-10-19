import { useState } from 'react'
import { MapView } from '@/components/map'
import { Sidebar, SidebarView } from '@/components/sidebar/Sidebar'
import { SidebarHome } from '@/components/sidebar/SidebarHome'
import { TripListView } from '@/components/sidebar/TripListView'
import { TripDetailView } from '@/components/sidebar/TripDetailView'
import { LocationDetailView } from '@/components/location/LocationDetailView'
import { LocationDetailEdit } from '@/components/location/LocationDetailEdit'
import { usePhotos } from '@/hooks/usePhotos'
import { getLocationWithPhotos } from '@/lib/mockData'
import type { Photo, Location, Trip } from '@/types'
import './App.css'

function App() {
  const { photos, loading } = usePhotos()
  const [sidebarView, setSidebarView] = useState<SidebarView>('home')
  const [isEditing, setIsEditing] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [locationPhotos, setLocationPhotos] = useState<Photo[]>([])

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
  }

  const handleLocationClick = (location: Location) => {
    console.log('Location clicked:', location)
    const locationWithPhotos = getLocationWithPhotos(location.id)
    if (locationWithPhotos) {
      setSelectedLocation(locationWithPhotos)
      setLocationPhotos(locationWithPhotos.photos || [])
      setSidebarView('location-detail')
      setIsEditing(false)
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
    // Backend: Call locationAPI.updateLocation(location)
    setSelectedLocation(location)
    setIsEditing(false)
  }

  const handleUploadClick = () => {
    console.log('Upload clicked')
    // TODO: Open upload modal
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
          />
        )}

        {sidebarView === 'trip-list' && (
          <TripListView onBack={handleBackToHome} onTripClick={handleTripClick} />
        )}

        {sidebarView === 'trip-detail' && selectedTrip && (
          <TripDetailView
            trip={selectedTrip}
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
        <MapView photos={photos} onPhotoClick={handlePhotoClick} enableClustering={false} />
      </div>
    </div>
  )
}

export default App
