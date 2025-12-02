/**
 * TripDetailView Component
 * Shows list of locations for a specific trip
 */

import { useState } from 'react'
import { ArrowLeft, MapPin, Star, Clock, Share2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { Trip, Location } from '@/types'
import { cn } from '@/lib/utils'

const API_BASE_URL = 'http://localhost:8000'

interface TripDetailViewProps {
  trip: Trip
  onBack: () => void
  onLocationClick: (location: Location) => void
  locations?: Location[]
}

export function TripDetailView({ trip, onBack, onLocationClick, locations }: TripDetailViewProps) {
  const [showShareModal, setShowShareModal] = useState(false)
  const [friends, setFriends] = useState<any[]>([])
  const [sharedWith, setSharedWith] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Filter locations for this trip
  const tripLocations = (locations ?? []).filter((loc) => loc.trip_id === trip.id)

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

  const handleShareClick = async () => {
    setShowShareModal(true)
    setLoading(true)

    // Load friends
    const friendsResponse = await fetch('http://localhost:8000/api/friends')
    const friendsData = await friendsResponse.json()
    if (friendsData.success) setFriends(friendsData.friends)

    // Load who trip is already shared with
    const sharedResponse = await fetch(`http://localhost:8000/api/trips/${trip.id}/shared-with`)
    const sharedData = await sharedResponse.json()
    if (sharedData.success) setSharedWith(sharedData.shared_with)

    setLoading(false)
  }

  const handleShareWithFriend = async (friendId: number) => {
    const response = await fetch(`http://localhost:8000/api/trips/${trip.id}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ friend_id: friendId })
    })

    // Reload shared list
    const sharedResponse = await fetch(`http://localhost:8000/api/trips/${trip.id}/shared-with`)
    const sharedData = await sharedResponse.json()
    if (sharedData.success) setSharedWith(sharedData.shared_with)
    
    // Show success message
    const friendName = friends.find(f => f.id === friendId)?.username || 'friend'
    alert(`✅ Success! Trip shared with ${friendName}`)
  }

  const sharedIds = sharedWith.map(u => u.id)

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
          <Button variant="outline" size="sm" onClick={handleShareClick}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Trip Cover Photo */}
      <div className="relative h-40 bg-gradient-to-br from-purple-500 to-pink-500">
        {trip.cover_photo?.file_url ? (
          <img
            src={`${API_BASE_URL}${trip.cover_photo.file_url}`}
            alt={trip.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/20 text-xs">
            No cover photo
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
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

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Share2 className="text-blue-600" size={24} />
                <h2 className="text-xl font-bold">Share Trip</h2>
              </div>
              <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            {loading ? (
              <p className="text-center py-4">Loading...</p>
            ) : (
              <>
                {sharedWith.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-medium mb-2 text-sm">Shared with:</h3>
                    <div className="space-y-1">
                      {sharedWith.map((user: any) => (
                        <div key={user.id} className="p-2 bg-green-50 rounded text-sm">
                          {user.username}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-medium mb-2 text-sm">Share with friends:</h3>
                  {friends.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">No friends to share with</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {friends.map((friend: any) => (
                        <div
                          key={friend.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <span className="text-sm">{friend.username}</span>
                          {sharedIds.includes(friend.id) ? (
                            <span className="text-xs text-green-600">✓ Shared</span>
                          ) : (
                            <button
                              onClick={() => handleShareWithFriend(friend.id)}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                              Share
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
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