/**
 * LocationDetailEdit Component
 * Edit mode for location details
 */

import { useState, useEffect } from 'react'
import { X, MapPin, Clock, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { RatingStars } from './RatingStars'
import { TagSelector } from './TagPill'
import { CostLevelSelector } from './CostLevelSelector'
import { NotesSection } from './NotesSection'
import type { Location, Photo } from '@/types'
import { TAG_OPTIONS } from '@/types'

interface LocationDetailEditProps {
  location: Location
  photos: Photo[]
  onCancel: () => void
  onSave: (location: Location) => void
}

export function LocationDetailEdit({
  location,
  photos,
  onCancel,
  onSave,
}: LocationDetailEditProps) {
  const normalizeLocation = (loc: Location): Location => ({
    ...loc,
    tags: loc.tags || [],
    rating: loc.rating ?? 0,
    cost_level: loc.cost_level || 'Free',
    notes: loc.notes || '',
  })

  const [editedLocation, setEditedLocation] = useState<Location>(normalizeLocation(location))

  // Update local state when location prop changes
  useEffect(() => {
    setEditedLocation(normalizeLocation(location))
  }, [location])

  const updateLocation = (updates: Partial<Location>) => {
    setEditedLocation({ ...editedLocation, ...updates })
  }

  const handleSave = () => {
    onSave(editedLocation)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with Close Button */}
      <div className="p-4 border-b flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Edit Location</span>
        <div className="flex-1" />
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Photo Gallery with Add Button */}
        <div className="relative w-full h-48 bg-muted">
          {photos.length > 0 ? (
            <div className="grid grid-cols-3 gap-1 h-full p-2">
              {photos.slice(0, 3).map((photo) => (
                <img
                  key={photo.id}
                  src={photo.file_url}
                  alt={photo.original_filename}
                  className="w-full h-full object-cover rounded-md"
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No photos
            </div>
          )}
          <Button
            variant="secondary"
            size="icon"
            className="absolute bottom-2 right-2 rounded-full shadow-lg"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold">{editedLocation.name}</h1>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Avatar className="w-6 h-6">
                <AvatarFallback>You</AvatarFallback>
              </Avatar>
              <span>Created by You</span>
            </div>
          </div>

          {/* Author Notes Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Author notes</h3>

            {/* Ratings */}
            <div className="space-y-2">
              <Label>Ratings</Label>
              <RatingStars
                value={editedLocation.rating}
                onChange={(rating) => updateLocation({ rating })}
              />
            </div>

            {/* Vibe Tags */}
            <div className="space-y-2">
              <Label>Vibe</Label>
              <TagSelector
                availableTags={[
                  ...Array.from(TAG_OPTIONS),
                  // Ensure custom tags (added by user) also appear and can be toggled
                  ...((editedLocation.tags || []).filter((t) => !Array.from(TAG_OPTIONS).includes(t)))
                ]}
                selectedTags={editedLocation.tags}
                onTagToggle={(tag) => {
                  const current = editedLocation.tags || []
                  const newTags = current.includes(tag)
                    ? current.filter((t) => t !== tag)
                    : [...current, tag]
                  updateLocation({ tags: newTags })
                }}
              />
            </div>

            {/* Notes */}
            <NotesSection
              notes={editedLocation.notes || ''}
              onChange={(notes) => updateLocation({ notes })}
            />
          </div>

          <Separator />

          {/* Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Details</h3>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">
                <MapPin className="w-4 h-4 inline mr-1" />
                Address
              </Label>
              <Input
                id="address"
                value={editedLocation.address}
                onChange={(e) => updateLocation({ address: e.target.value })}
                className="text-sm"
              />
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <Label>Budget</Label>
              <CostLevelSelector
                value={editedLocation.cost_level}
                onChange={(cost_level) => updateLocation({ cost_level })}
              />
            </div>

            {/* Best time to visit */}
            <div className="space-y-2">
              <Label htmlFor="best-time">
                <Clock className="w-4 h-4 inline mr-1" />
                Best time to visit
              </Label>
              <Input
                id="best-time"
                value={editedLocation.best_time_to_visit || ''}
                onChange={(e) => updateLocation({ best_time_to_visit: e.target.value })}
                placeholder="e.g., 7:00 am - 9:00 am"
              />
            </div>

            {/* Time to Spend */}
            <div className="space-y-2">
              <Label htmlFor="time-needed">Time to Spend</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="time-needed"
                  type="number"
                  value={editedLocation.time_needed ?? ''}
                  onChange={(e) =>
                    updateLocation({ time_needed: parseInt(e.target.value) || 0 })
                  }
                  placeholder="120"
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">minutes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with Save/Cancel Buttons */}
      <div className="border-t p-4">
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
