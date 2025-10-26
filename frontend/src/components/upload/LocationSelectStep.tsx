import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, Plus, Search } from 'lucide-react'
import { Trip, Location } from '@/types'
import { mockTrips, mockLocations } from '@/lib/mockData'


interface LocationSelectStepProps {
  onLocationSelected: (data: {
    tripId?: string
    locationId?: string
    newTrip?: any
    newLocation?: any
    coordinates: { x: number; y: number }
  }) => void
  onBack: () => void
  onClose: () => void
  uploadState?: {
    previews: Array<{
      coordinates?: { x: number; y: number }
    }>
  }
}

export function LocationSelectStep({ onLocationSelected, onBack, onClose, uploadState }: LocationSelectStepProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [showNewTripForm, setShowNewTripForm] = useState(false)
  const [showNewLocationForm, setShowNewLocationForm] = useState(false)
  const [newTripData, setNewTripData] = useState({
    title: '',
    city: '',
    country: '',
    start_date: '',
    end_date: '',
  })
  const [newLocationData, setNewLocationData] = useState({
    name: '',
    address: '',
  })

  // Filter trips and locations based on search
  const filteredTrips = mockTrips.filter(trip =>
    trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trip.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trip.country.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredLocations = selectedTrip
    ? mockLocations.filter(location =>
        location.trip_id === selectedTrip.id &&
        (location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         location.address.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : []

  const handleTripSelect = useCallback((trip: Trip) => {
    setSelectedTrip(trip)
    setSelectedLocation(null)
    setShowNewTripForm(false)
    setShowNewLocationForm(false)
  }, [])

  const handleLocationSelect = useCallback((location: Location) => {
    setSelectedLocation(location)
    setShowNewLocationForm(false)
  }, [])

  const handleNewTrip = useCallback(() => {
    setShowNewTripForm(true)
    setShowNewLocationForm(false)
    setSelectedTrip(null)
    setSelectedLocation(null)
  }, [])

  const handleNewLocation = useCallback(() => {
    if (!selectedTrip) {
      alert('Please select a trip first.')
      return
    }
    setShowNewLocationForm(true)
    setSelectedLocation(null)
  }, [selectedTrip])

  const handleNewTripSubmit = useCallback(() => {
    console.log('handleNewTripSubmit called with:', newTripData)
    if (!newTripData.title || !newTripData.city || !newTripData.country) {
      alert('Please fill in all required fields.')
      return
    }

    // Use coordinates from EXIF data if available, otherwise default to Tokyo area
    const defaultCoordinates = { x: 139.6917, y: 35.6895 }
    const coordinates = uploadState?.previews.find(p => p.coordinates)?.coordinates || defaultCoordinates

    console.log('Calling onLocationSelected with newTrip:', newTripData)
    onLocationSelected({
      newTrip: newTripData,
      coordinates,
    })
  }, [newTripData, onLocationSelected, uploadState])

  const handleNewLocationSubmit = useCallback(() => {
    if (!newLocationData.name || !newLocationData.address) {
      alert('Please fill in all required fields.')
      return
    }

    if (!selectedTrip) {
      alert('Please select a trip first.')
      return
    }

    // Use coordinates from EXIF data if available, otherwise default to 0/0
    const coordinates = uploadState?.previews.find(p => p.coordinates)?.coordinates || { x: 0, y: 0 }

    onLocationSelected({
      tripId: selectedTrip.id,
      newLocation: {
        ...newLocationData,
        trip_id: selectedTrip.id,
        rating: 5,
        tags: [],
        cost_level: 'Free',
        x: coordinates.x,
        y: coordinates.y,
      },
      coordinates,
    })
  }, [newLocationData, selectedTrip, onLocationSelected, uploadState])

  const handleExistingLocationSubmit = useCallback(() => {
    console.log('handleExistingLocationSubmit called with:', { selectedTrip, selectedLocation })
    if (!selectedTrip || !selectedLocation) {
      alert('Please select both a trip and location.')
      return
    }

    console.log('Calling onLocationSelected with existing trip/location:', { tripId: selectedTrip.id, locationId: selectedLocation.id })
    onLocationSelected({
      tripId: selectedTrip.id,
      locationId: selectedLocation.id,
      coordinates: { x: selectedLocation.x, y: selectedLocation.y },
    })
  }, [selectedTrip, selectedLocation, onLocationSelected])

  const handleContinue = useCallback(() => {
    console.log('LocationSelectStep handleContinue called with:', { showNewTripForm, showNewLocationForm, selectedTrip, selectedLocation })
    if (showNewTripForm) {
      handleNewTripSubmit()
    } else if (showNewLocationForm) {
      handleNewLocationSubmit()
    } else {
      handleExistingLocationSubmit()
    }
  }, [showNewTripForm, showNewLocationForm, handleNewTripSubmit, handleNewLocationSubmit, handleExistingLocationSubmit])

  const canContinue =
    (showNewTripForm && newTripData.title && newTripData.city && newTripData.country) ||
    (showNewLocationForm && newLocationData.name && newLocationData.address) ||
    (selectedTrip && selectedLocation)

  // Check if any photos have GPS coordinates
  const hasGPSData = uploadState?.previews.some(p => p.coordinates)
  const gpsCoordinates = uploadState?.previews.find(p => p.coordinates)?.coordinates

  return (
    <div className="space-y-6">
      {/* GPS Info */}
      {hasGPSData && gpsCoordinates && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-2 text-green-700">
            <MapPin className="h-4 w-4" />
            <span className="font-medium">GPS coordinates detected!</span>
          </div>
          <p className="text-sm text-green-600 mt-1">
            Photos contain location data: {gpsCoordinates.y.toFixed(4)}, {gpsCoordinates.x.toFixed(4)}
          </p>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search trips or locations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* New Trip Form */}
      {showNewTripForm && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Create New Trip</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="trip-title">Trip Title</Label>
              <Input
                id="trip-title"
                value={newTripData.title}
                onChange={(e) => setNewTripData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Tokyo Adventure"
              />
            </div>
            <div>
              <Label htmlFor="trip-city">City</Label>
              <Input
                id="trip-city"
                value={newTripData.city}
                onChange={(e) => setNewTripData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="e.g., Tokyo"
              />
            </div>
            <div>
              <Label htmlFor="trip-country">Country</Label>
              <Input
                id="trip-country"
                value={newTripData.country}
                onChange={(e) => setNewTripData(prev => ({ ...prev, country: e.target.value }))}
                placeholder="e.g., Japan"
              />
            </div>
            <div>
              <Label htmlFor="trip-dates">Dates</Label>
              <Input
                id="trip-dates"
                value={newTripData.start_date}
                onChange={(e) => setNewTripData(prev => ({ ...prev, start_date: e.target.value }))}
                placeholder="YYYY-MM-DD"
              />
            </div>
          </div>
        </Card>
      )}

      {/* New Location Form */}
      {showNewLocationForm && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Create New Location</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="location-name">Location Name</Label>
              <Input
                id="location-name"
                value={newLocationData.name}
                onChange={(e) => setNewLocationData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Sensō-ji Temple"
              />
            </div>
            <div>
              <Label htmlFor="location-address">Address</Label>
              <Input
                id="location-address"
                value={newLocationData.address}
                onChange={(e) => setNewLocationData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Full address"
              />
            </div>
            {/* Coordinates come from EXIF automatically; fields hidden */}
          </div>
        </Card>
      )}

      {/* Trip Selection */}
      {!showNewTripForm && !showNewLocationForm && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Select Trip</h3>
            <Button variant="outline" size="sm" onClick={handleNewTrip}>
              <Plus className="h-4 w-4 mr-2" />
              New Trip
            </Button>
          </div>

          <div className="grid gap-3">
            {filteredTrips.map((trip) => (
              <Card
                key={trip.id}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedTrip?.id === trip.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => handleTripSelect(trip)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{trip.title}</h4>
                    <p className="text-sm text-gray-600">{trip.city}, {trip.country}</p>
                    <p className="text-xs text-gray-500">{trip.start_date} - {trip.end_date}</p>
                  </div>
                  {trip.rating && (
                    <div className="text-sm text-yellow-600">
                      ⭐ {trip.rating}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Location Selection */}
      {selectedTrip && !showNewTripForm && !showNewLocationForm && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Select Location in {selectedTrip.title}</h3>
            <Button variant="outline" size="sm" onClick={handleNewLocation}>
              <Plus className="h-4 w-4 mr-2" />
              New Location
            </Button>
          </div>

          <div className="grid gap-3">
            {filteredLocations.map((location) => (
              <Card
                key={location.id}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedLocation?.id === location.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => handleLocationSelect(location)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{location.name}</h4>
                    <p className="text-sm text-gray-600">{location.address}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-yellow-600">⭐ {location.rating}</span>
                      <span className="text-xs text-gray-500">{location.cost_level}</span>
                    </div>
                  </div>
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!canContinue}
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
