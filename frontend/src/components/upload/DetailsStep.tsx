import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X, Star, Clock, DollarSign } from 'lucide-react'
import { UploadState, CreateTripRequest, CreateLocationRequest, CostLevel, TAG_OPTIONS } from '@/types'

interface DetailsStepProps {
  uploadState: UploadState
  newTrip: CreateTripRequest | null
  newLocation: CreateLocationRequest | null
  onDetailsComplete: (details: {
    tripDetails?: CreateTripRequest
    locationDetails?: CreateLocationRequest
  }) => void
  onBack: () => void
  onClose: () => void
}

export function DetailsStep({
  uploadState,
  newTrip,
  newLocation,
  onDetailsComplete,
  onBack,
  onClose
}: DetailsStepProps) {
  const [tripDetails, setTripDetails] = useState<CreateTripRequest>(newTrip || {
    title: '',
    city: '',
    country: '',
    start_date: '',
    end_date: '',
  })

  const [locationDetails, setLocationDetails] = useState<CreateLocationRequest>(newLocation || {
    trip_id: '',
    x: 0,
    y: 0,
    name: '',
    address: '',
    rating: 5,
    notes: '',
    tags: [],
    cost_level: 'Free',
    time_needed: 60,
    best_time_to_visit: '',
  })

  const [selectedTags, setSelectedTags] = useState<string[]>(locationDetails.tags || [])
  const [newTag, setNewTag] = useState('')

  const handleTripDetailsChange = useCallback((field: keyof CreateTripRequest, value: string) => {
    setTripDetails(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleLocationDetailsChange = useCallback((field: keyof CreateLocationRequest, value: any) => {
    setLocationDetails(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleAddTag = useCallback(() => {
    if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
      const updatedTags = [...selectedTags, newTag.trim()]
      setSelectedTags(updatedTags)
      setLocationDetails(prev => ({ ...prev, tags: updatedTags }))
      setNewTag('')
    }
  }, [newTag, selectedTags])

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    const updatedTags = selectedTags.filter(tag => tag !== tagToRemove)
    setSelectedTags(updatedTags)
    setLocationDetails(prev => ({ ...prev, tags: updatedTags }))
  }, [selectedTags])

  const handleSubmit = useCallback(() => {
    console.log('DetailsStep handleSubmit called with:', { newTrip, newLocation, tripDetails, locationDetails })

    if (newTrip && (!tripDetails.title || !tripDetails.city || !tripDetails.country)) {
      alert('Please fill in all required trip fields.')
      return
    }

    if (newLocation && (!locationDetails.name || !locationDetails.address)) {
      alert('Please fill in all required location fields.')
      return
    }

    console.log('Calling onDetailsComplete with:', {
      tripDetails: newTrip ? tripDetails : undefined,
      locationDetails: newLocation ? locationDetails : undefined,
    })

    onDetailsComplete({
      tripDetails: newTrip ? tripDetails : undefined,
      locationDetails: newLocation ? locationDetails : undefined,
    })
  }, [newTrip, newLocation, tripDetails, locationDetails, onDetailsComplete])

  const renderStarRating = (rating: number, onChange: (rating: number) => void) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="focus:outline-none"
        >
          <Star
            className={`h-5 w-5 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-gray-600">{rating}/5</span>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Trip Details */}
      {newTrip && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Trip Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="trip-title">Trip Title *</Label>
              <Input
                id="trip-title"
                value={tripDetails.title}
                onChange={(e) => handleTripDetailsChange('title', e.target.value)}
                placeholder="e.g., Tokyo Adventure"
              />
            </div>
            <div>
              <Label htmlFor="trip-city">City *</Label>
              <Input
                id="trip-city"
                value={tripDetails.city}
                onChange={(e) => handleTripDetailsChange('city', e.target.value)}
                placeholder="e.g., Tokyo"
              />
            </div>
            <div>
              <Label htmlFor="trip-country">Country *</Label>
              <Input
                id="trip-country"
                value={tripDetails.country}
                onChange={(e) => handleTripDetailsChange('country', e.target.value)}
                placeholder="e.g., Japan"
              />
            </div>
            <div>
              <Label htmlFor="trip-start-date">Start Date</Label>
              <Input
                id="trip-start-date"
                type="date"
                value={tripDetails.start_date}
                onChange={(e) => handleTripDetailsChange('start_date', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="trip-end-date">End Date</Label>
              <Input
                id="trip-end-date"
                type="date"
                value={tripDetails.end_date}
                onChange={(e) => handleTripDetailsChange('end_date', e.target.value)}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Location Details */}
      {newLocation && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Location Details</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location-name">Location Name *</Label>
                <Input
                  id="location-name"
                  value={locationDetails.name}
                  onChange={(e) => handleLocationDetailsChange('name', e.target.value)}
                  placeholder="e.g., Sensō-ji Temple"
                />
              </div>
              <div>
                <Label htmlFor="location-address">Address *</Label>
                <Input
                  id="location-address"
                  value={locationDetails.address}
                  onChange={(e) => handleLocationDetailsChange('address', e.target.value)}
                  placeholder="Full address"
                />
              </div>
            </div>

            <div>
              <Label>Rating</Label>
              {renderStarRating(locationDetails.rating, (rating) =>
                handleLocationDetailsChange('rating', rating)
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cost-level">Cost Level</Label>
                <Select
                  value={locationDetails.cost_level}
                  onValueChange={(value: CostLevel) => handleLocationDetailsChange('cost_level', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Free">Free</SelectItem>
                    <SelectItem value="$">$</SelectItem>
                    <SelectItem value="$$">$$</SelectItem>
                    <SelectItem value="$$$">$$$</SelectItem>
                    <SelectItem value="$-$$">$-$$</SelectItem>
                    <SelectItem value="$$-$$$">$$-$$$</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="time-needed">Time to Spend (minutes)</Label>
                <Input
                  id="time-needed"
                  type="number"
                  value={locationDetails.time_needed || ''}
                  onChange={(e) => handleLocationDetailsChange('time_needed', parseInt(e.target.value) || 0)}
                  placeholder="60"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="best-time">Best Time to Visit</Label>
              <Input
                id="best-time"
                value={locationDetails.best_time_to_visit || ''}
                onChange={(e) => handleLocationDetailsChange('best_time_to_visit', e.target.value)}
                placeholder="e.g., 7:00 am - 9:00 am"
              />
            </div>

            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedTags.map((tag) => (
                  <Badge key={tag} variant="default" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Select onValueChange={(value) => {
                  if (!selectedTags.includes(value)) {
                    const updated = [...selectedTags, value]
                    setSelectedTags(updated)
                    setLocationDetails(prev => ({ ...prev, tags: updated }))
                  }
                }}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Add tag from list" />
                  </SelectTrigger>
                  <SelectContent>
                    {TAG_OPTIONS.filter(tag => !selectedTags.includes(tag)).map((tag) => (
                      <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Custom tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <Button type="button" onClick={handleAddTag} disabled={!newTag.trim()}>
                  Add
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={locationDetails.notes || ''}
                onChange={(e) => handleLocationDetailsChange('notes', e.target.value)}
                placeholder="Personal notes about this location..."
                rows={3}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Photo Preview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Photos to Upload ({uploadState.previews.length})</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {uploadState.previews.map((preview, index) => (
            <div key={index} className="aspect-square overflow-hidden rounded-lg border">
              <img
                src={preview.preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Action buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleSubmit}>
          Upload Photos
        </Button>
      </div>
    </div>
  )
}
