/**
 * LocationDetailView Component
 * Read-only view of location details
 */

import { ArrowLeft, Briefcase, Share2, Pencil, MapPin, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import type { Location, Photo } from '@/types'
import { cn } from '@/lib/utils'

interface LocationDetailViewProps {
  location: Location
  photos: Photo[]
  onBack: () => void
  onEdit: () => void
}

export function LocationDetailView({
  location,
  photos,
  onBack,
  onEdit,
}: LocationDetailViewProps) {
  const parseNotes = (notes?: string) => {
    if (!notes) return []

    const lines = notes.split('\n').filter((line) => line.trim())
    const categories: { category: string; note: string }[] = []

    lines.forEach((line) => {
      const match = line.match(/^For the (.+?): "(.+)"$/)
      if (match) {
        categories.push({
          category: match[1],
          note: match[2],
        })
      }
    })

    return categories
  }

  const parsedNotes = parseNotes(location.notes)

  return (
    <div className="flex flex-col h-full">
      {/* Header with Back Button */}
      <div className="p-4 border-b flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1" />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Photo Gallery */}
        <div className="relative w-full h-64 bg-muted overflow-x-auto">
          {photos.length > 0 ? (
            <div className="flex gap-1 h-full p-2 w-48">
              {photos.map((photo) => (
                <img
                  key={photo.id}
                  src={photo.file_url}
                  alt={photo.original_filename}
                  className="h-full w-auto object-cover rounded-md"
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No photos
            </div>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold">{location.name}</h1>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Avatar className="w-6 h-6">
                <AvatarFallback>You</AvatarFallback>
              </Avatar>
              <span>Created by You</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button className="flex-1" variant="default">
              <Briefcase className="w-4 h-4 mr-2" />
              Add to trip
            </Button>
            <Button variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>

          <Separator />

          {/* Author Notes Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold">Author notes</h3>
              <div className="flex-1" />
              <Button variant="ghost" size="icon" onClick={onEdit}>
                <Pencil className="w-4 h-4" />
              </Button>
            </div>

            {/* Ratings */}
            <div className="space-y-2">
              <Label>Ratings</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={cn(
                      'text-2xl',
                      star <= location.rating ? 'text-yellow-400' : 'text-gray-300'
                    )}
                  >
                    ⭐
                  </span>
                ))}
              </div>
            </div>

            {/* Vibe Tags */}
            {location.tags.length > 0 && (
              <div className="space-y-2">
                <Label>Vibe</Label>
                <div className="flex flex-wrap gap-2">
                  {location.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-muted rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* What you should know */}
            {parsedNotes.length > 0 && (
              <div className="space-y-2">
                <Label>What you should know</Label>
                <div className="space-y-2">
                  {parsedNotes.map(({ category, note }, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium">For the {category}:</span>{' '}
                      <span className="text-muted-foreground">"{note}"</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Details</h3>

            {/* Address */}
            <div className="space-y-2">
              <Label>
                <MapPin className="w-4 h-4 inline mr-1" />
                Address
              </Label>
              <p className="text-sm text-muted-foreground">{location.address}</p>
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <Label>Budget</Label>
              <p className="text-sm text-muted-foreground">{location.cost_level}</p>
            </div>

            {/* Best time to visit */}
            {location.best_time_to_visit && (
              <div className="space-y-2">
                <Label>
                  <Clock className="w-4 h-4 inline mr-1" />
                  Best time to visit
                </Label>
                <p className="text-sm text-muted-foreground">
                  {location.best_time_to_visit}
                </p>
              </div>
            )}

            {/* Hours to spend */}
            {location.time_needed && (
              <div className="space-y-2">
                <Label>Hours to spend</Label>
                <p className="text-sm text-muted-foreground">
                  {location.time_needed / 60} hours
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
