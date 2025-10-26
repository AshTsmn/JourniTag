import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Upload, MapPin, FileText, Check } from 'lucide-react'
import { UploadState, Trip, Location, CreateTripRequest, CreateLocationRequest, UploadPhotoRequest } from '@/types'
import { tripAPI, locationAPI, photoAPI } from '@/services/api'
import { FileSelectStep } from './FileSelectStep'
import { LocationSelectStep } from './LocationSelectStep'
import { DetailsStep } from './DetailsStep'
import { UploadingStep } from './UploadingStep'

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadComplete: (trip?: Trip, locations?: Location[]) => void
}

const STEPS = [
  { id: 'select', title: 'Select Photos', icon: Upload },
  { id: 'locate', title: 'Choose Location', icon: MapPin },
  { id: 'details', title: 'Add Details', icon: FileText },
  { id: 'uploading', title: 'Uploading', icon: Check },
] as const

export function UploadModal({ isOpen, onClose, onUploadComplete }: UploadModalProps) {
  console.log('UploadModal rendered with isOpen:', isOpen)

  const [uploadState, setUploadState] = useState<UploadState>({
    files: [],
    previews: [],
    currentStep: 'select',
  })

  const [newTrip, setNewTrip] = useState<CreateTripRequest | null>(null)
  const [newLocation, setNewLocation] = useState<CreateLocationRequest | null>(null)
  const [existingTripId, setExistingTripId] = useState<string | null>(null)
  const [existingLocationId, setExistingLocationId] = useState<string | null>(null)

  const currentStepIndex = STEPS.findIndex(step => step.id === uploadState.currentStep)
  const CurrentStepIcon = STEPS[currentStepIndex]?.icon

  const handleFilesSelected = useCallback((files: File[], previews: UploadState['previews']) => {
    setUploadState(prev => ({
      ...prev,
      files,
      previews,
      currentStep: 'locate',
    }))
  }, [])

  const handleLocationSelected = useCallback((locationData: {
    tripId?: string
    locationId?: string
    newTrip?: CreateTripRequest
    newLocation?: CreateLocationRequest
    coordinates: { x: number; y: number }
  }) => {
    if (locationData.tripId) {
      setExistingTripId(locationData.tripId)
    }
    if (locationData.locationId) {
      setExistingLocationId(locationData.locationId)
    }
    if (locationData.newTrip) {
      setNewTrip(locationData.newTrip)
    }
    if (locationData.newLocation) {
      setNewLocation(locationData.newLocation)
    }

    // Update coordinates for all photos
    setUploadState(prev => ({
      ...prev,
      previews: prev.previews.map(preview => ({
        ...preview,
        coordinates: locationData.coordinates,
      })),
      currentStep: 'details',
    }))
  }, [])

  const handleDetailsComplete = useCallback((details: {
    tripDetails?: CreateTripRequest
    locationDetails?: CreateLocationRequest
  }) => {
    console.log('handleDetailsComplete called with:', details)
    if (details.tripDetails) {
      setNewTrip(details.tripDetails)
      console.log('Set newTrip:', details.tripDetails)
    }
    if (details.locationDetails) {
      setNewLocation(details.locationDetails)
      console.log('Set newLocation:', details.locationDetails)
    }

    console.log('About to change step to uploading...')
    setUploadState(prev => ({
      ...prev,
      currentStep: 'uploading',
    }))
  }, [])

  const handleUpload = useCallback(async () => {
    try {
      console.log('handleUpload called with:', { newTrip, newLocation, existingTripId, existingLocationId })
      let finalTripId = existingTripId
      let finalLocationId = existingLocationId

      // Create new trip if needed
      if (newTrip && !existingTripId) {
        console.log('Creating new trip:', newTrip)
        const createdTrip = await tripAPI.createTrip(newTrip)
        finalTripId = createdTrip.id

        // If we created a new trip, also create a default location for it
        if (!existingLocationId) {
          // Use the GPS coordinates from the first photo
          const firstPhotoCoords = uploadState.previews[0]?.coordinates
          const defaultLocation = {
            name: newTrip.city || 'New Location',
            address: `${newTrip.city}, ${newTrip.country}`,
            x: firstPhotoCoords?.x || 0, // longitude
            y: firstPhotoCoords?.y || 0, // latitude
          }
          const locationToCreate = {
            ...defaultLocation,
            trip_id: finalTripId,
            rating: 0,
            tags: [],
            cost_level: 'Free' as const,
            time_needed: 0,
            notes: '',
          }
          const createdLocation = await locationAPI.createLocation(locationToCreate)
          finalLocationId = createdLocation.id
        }
      }

      // Create new location if needed (for existing trips)
      if (newLocation && !existingLocationId && existingTripId) {
        const locationToCreate = {
          ...newLocation,
          trip_id: finalTripId!,
        }
        const createdLocation = await locationAPI.createLocation(locationToCreate)
        finalLocationId = createdLocation.id
      }

      // Prepare photo upload data
      const uploadRequests: UploadPhotoRequest[] = uploadState.previews.map(preview => ({
        file: preview.file,
        location_id: finalLocationId!,
        x: preview.coordinates?.x,
        y: preview.coordinates?.y,
        is_cover_photo: false, // We'll handle cover photo selection separately
      }))

      console.log('Upload requests prepared:', uploadRequests)
      console.log('Final trip ID:', finalTripId)
      console.log('Final location ID:', finalLocationId)

      // Move to uploading step
      setUploadState(prev => ({
        ...prev,
        currentStep: 'uploading',
      }))

      // Upload photos
      const uploadedPhotos = await photoAPI.uploadPhotos(uploadRequests)

      // Get the created trip and location data
      console.log('Getting trip data for ID:', finalTripId)
      const tripData = finalTripId ? await tripAPI.getTripById(finalTripId) : null
      console.log('Trip data received:', tripData)

      console.log('Getting location data for ID:', finalLocationId)
      const locationData = finalLocationId ? await locationAPI.getLocationById(finalLocationId) : null
      console.log('Location data received:', locationData)

      // Store the results for the UploadingStep to use
      setUploadState(prev => ({
        ...prev,
        uploadResults: {
          trip: tripData?.trip,
          // include photos on the location so TripDetail can render them immediately
          locations: locationData ? [{ ...locationData.location, photos: locationData.photos }] : undefined,
        }
      }))
    } catch (error) {
      console.error('Upload failed:', error)
      // TODO: Show error message to user
    }
  }, [uploadState, newTrip, newLocation, existingTripId, existingLocationId, onUploadComplete, onClose])

  // Trigger upload when step changes to 'uploading'
  useEffect(() => {
    if (uploadState.currentStep === 'uploading') {
      console.log('Step changed to uploading, triggering handleUpload with current state:', { newTrip, newLocation, existingTripId, existingLocationId })
      console.log('Upload state previews:', uploadState.previews)
      console.log('Using location details:', newLocation)
      handleUpload()
    }
  }, [uploadState.currentStep, handleUpload])

  const handleClose = useCallback(() => {
    setUploadState({
      files: [],
      previews: [],
      currentStep: 'select',
    })
    setNewTrip(null)
    setNewLocation(null)
    setExistingTripId(null)
    setExistingLocationId(null)
    onClose()
  }, [onClose])

  const renderCurrentStep = () => {
    switch (uploadState.currentStep) {
      case 'select':
        return (
          <FileSelectStep
            onFilesSelected={handleFilesSelected}
            onClose={handleClose}
          />
        )
      case 'locate':
        return (
          <LocationSelectStep
            onLocationSelected={handleLocationSelected}
            onBack={() => setUploadState(prev => ({ ...prev, currentStep: 'select' }))}
            onClose={handleClose}
            uploadState={uploadState}
          />
        )
      case 'details':
        return (
          <DetailsStep
            uploadState={uploadState}
            newTrip={newTrip}
            newLocation={newLocation}
            onDetailsComplete={handleDetailsComplete}
            onBack={() => setUploadState(prev => ({ ...prev, currentStep: 'locate' }))}
            onClose={handleClose}
          />
        )
      case 'uploading':
        return (
          <UploadingStep
            uploadState={uploadState}
            onClose={handleClose}
            onUploadComplete={onUploadComplete}
          />
        )
      default:
        return null
    }
  }

  if (!isOpen) {
    console.log('Modal not open, returning null')
    return null
  }

  console.log('Rendering modal with step:', uploadState.currentStep)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[95vh] overflow-y-auto" style={{ backgroundColor: 'white', border: '3px solid blue' }}>
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              {CurrentStepIcon && <CurrentStepIcon className="h-5 w-5" />}
              Upload Photos
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="p-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-between mb-6">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon
              const isActive = index === currentStepIndex
              const isCompleted = index < currentStepIndex

              return (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full border-2
                    ${isActive ? 'border-blue-500 bg-blue-500 text-white' :
                      isCompleted ? 'border-green-500 bg-green-500 text-white' :
                      'border-gray-300 text-gray-400'}
                  `}>
                    {isCompleted ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </span>
                  {index < STEPS.length - 1 && (
                    <div className={`w-8 h-0.5 mx-2 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>

          {renderCurrentStep()}
        </div>
      </div>
    </div>
  )
}