/**
 * TripDetailView Component
 * Shows list of locations for a specific trip
 */

import { ArrowLeft, MapPin, Star, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { Trip, Location } from '@/types'
import { mockLocations } from '@/lib/mockData'
import { cn } from '@/lib/utils'

interface TripDetailViewProps {
  trip: Trip
  onBack: () => void
  onLocationClick: (location: Location) => void
  locations?: Location[]
}

export function TripDetailView({ trip, onBack, onLocationClick, locations }: TripDetailViewProps) {
  // Merge runtime and mock locations for this trip (runtime overrides mock)
  const stateForTrip = (locations ?? []).filter((loc) => loc.trip_id === trip.id)
  const mockForTrip = mockLocations.filter((loc) => loc.trip_id === trip.id)
  const byId: Record<string, Location> = {}
  for (const l of mockForTrip) byId[l.id] = l
  for (const l of stateForTrip) byId[l.id] = { ...(byId[l.id] || {} as Location), ...l }
  const tripLocations = Object.values(byId)

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)

    const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' })
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' })
    const startDay = startDate.getDate()
    const endDay = endDate.getDate()

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}, ${startDate.getFullYear()}`
    }
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${startDate.getFullYear()}`
  }

  // Compute dynamic stats
  const rated = tripLocations.filter((l) => (l.rating ?? 0) > 0)
  const averageRating = rated.length > 0
    ? rated.reduce((s, l) => s + (l.rating ?? 0), 0) / rated.length
    : 0
  const totalPhotos = tripLocations.reduce((sum, l) => sum + (l.photos?.length || 0), 0)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3 mb-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{trip.title}</h1>
            <p className="text-sm text-muted-foreground">
              {formatDateRange(trip.start_date, trip.end_date)}
            </p>
          </div>
        </div>
      </div>

      {/* Trip Cover Photo */}
      <div className="relative h-40 bg-gradient-to-br from-purple-500 to-pink-500">
        <div className="absolute inset-0 flex items-center justify-center text-white/20 text-xs">
          Trip cover photo placeholder
        </div>
        {averageRating > 0 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/50 px-3 py-1.5 rounded">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-white font-semibold">{averageRating.toFixed(1)}</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{tripLocations.length} locations</span>
          <span>{totalPhotos} photos</span>
        </div>
      </div>

      <Separator />

      {/* Location List - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="text-lg font-semibold mb-3">Locations</h2>
        <div className="space-y-3">
          {tripLocations.length > 0 ? (
            tripLocations.map((location) => (
              <LocationCard
                key={location.id}
                location={location}
                onClick={() => onLocationClick(location)}
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No locations added yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface LocationCardProps {
  location: Location
  onClick: () => void
}

function LocationCard({ location, onClick }: LocationCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-3 rounded-lg border bg-card",
        "hover:shadow-md transition-shadow",
        "text-left"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Location Icon/Photo */}
        <div className="w-12 h-12 rounded-md bg-gradient-to-br from-blue-500 to-purple-500 flex-shrink-0 flex items-center justify-center">
          <MapPin className="w-6 h-6 text-white" />
        </div>

        {/* Location Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{location.name}</h3>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {location.address}
          </p>

          {/* Tags */}
          {(location.tags?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {(location.tags ?? []).slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-muted rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
              {(location.tags?.length ?? 0) > 2 && (
                <span className="px-2 py-0.5 bg-muted rounded-full text-xs">
                  +{(location.tags?.length ?? 0) - 2}
                </span>
              )}
            </div>
          )}

          {/* Rating and Time */}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{Number(location.rating ?? 0).toFixed(1)}</span>
            </div>
            {location.time_needed && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{location.time_needed}m</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <span>{location.cost_level}</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}
