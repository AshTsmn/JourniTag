/**
 * TripListView Component
 * Shows list of all trips with a toggle between "My Trips" and "Shared Trips"
 */

import { useState, useEffect } from 'react'
import { ArrowLeft, Search, User, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Trip } from '@/types'
import { cn } from '@/lib/utils'

const API_BASE_URL = ''

interface SharedTrip extends Trip {
  owner_username?: string
  owner_name?: string
  access_type?: 'owner' | 'shared'
}

interface TripListViewProps {
  onBack: () => void
  onTripClick: (trip: Trip) => void
  trips?: Trip[]
}

export function TripListView({ onBack, onTripClick, trips }: TripListViewProps) {
  const [activeTab, setActiveTab] = useState<'my' | 'shared'>('my')
  const [search, setSearch] = useState('')
  const [sharedTrips, setSharedTrips] = useState<SharedTrip[]>([])
  const [loadingShared, setLoadingShared] = useState(false)

  // Fetch shared trips when switching to shared tab
  useEffect(() => {
    if (activeTab === 'shared') {
      fetchSharedTrips()
    }
  }, [activeTab])

  const fetchSharedTrips = async () => {
    setLoadingShared(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/trips/shared-with-me`, {
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        setSharedTrips(data.trips || [])
      }
    } catch (error) {
      console.error('Error fetching shared trips:', error)
    } finally {
      setLoadingShared(false)
    }
  }

  const normalizedSearch = search.trim().toLowerCase()

  // Filter trips based on active tab
  // For "My trips" tab, only show owned trips (not shared ones)
  const myOwnedTrips = (trips || []).filter(trip => trip.access_level === 'owner')
  const tripsForActiveTab = activeTab === 'my' ? myOwnedTrips : sharedTrips

  const visibleTrips = tripsForActiveTab.filter((trip) => {
    if (!normalizedSearch) return true
    const haystack = `${trip.title} ${trip.city} ${trip.country}`.toLowerCase()
    return haystack.includes(normalizedSearch)
  })

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3 mb-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold mb-2">Trips</h1>
            <div className="inline-flex items-center rounded-full bg-muted p-1 text-xs font-medium">
              <button
                type="button"
                className={cn(
                  "px-3 py-1 rounded-full transition-colors",
                  activeTab === 'my'
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground"
                )}
                onClick={() => setActiveTab('my')}
              >
                My trips
              </button>
              <button
                type="button"
                className={cn(
                  "px-3 py-1 rounded-full transition-colors",
                  activeTab === 'shared'
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground"
                )}
                onClick={() => setActiveTab('shared')}
              >
                Shared trips
              </button>
            </div>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search trips..."
            className="pl-9 bg-muted/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Trip List - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {loadingShared && activeTab === 'shared' ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Loading shared trips...
            </p>
          ) : visibleTrips && visibleTrips.length > 0 ? (
            visibleTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onClick={() => onTripClick(trip)}
                isShared={activeTab === 'shared'}
              />
            ))
          ) : activeTab === 'shared' ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No shared trips yet. Trips that friends share with you will appear here.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No trips yet. Upload some photos to get started!
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

interface TripCardProps {
  trip: SharedTrip
  onClick: () => void
  isShared?: boolean
}

function TripCard({ trip, onClick, isShared }: TripCardProps) {
  const formatDateRange = (start: string, end: string) => {
    if (!start && !end) return ''

    const startDate = start ? new Date(start) : null
    const endDate = end ? new Date(end) : null

    const startValid = !!(startDate && !isNaN(startDate.getTime()))
    const endValid = !!(endDate && !isNaN(endDate.getTime()))

    if (!startValid && !endValid) return ''

    const startMonth = startValid
      ? startDate!.toLocaleDateString('en-US', { month: 'short' })
      : ''
    const endMonth = endValid
      ? endDate!.toLocaleDateString('en-US', { month: 'short' })
      : ''
    const startDay = startValid ? startDate!.getDate() : ''
    const endDay = endValid ? endDate!.getDate() : ''

    // Only start date is valid
    if (startValid && !endValid) {
      return `${startMonth} ${startDay}`
    }

    // Both valid – format a range
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}`
    }
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`
  }

  const getQuote = (title: string) => {
    return ''
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-lg overflow-hidden",
        "bg-card border shadow-sm",
        "hover:shadow-md transition-shadow",
        "text-left"
      )}
    >
      {/* Cover Photo */}
      <div className="relative h-40 bg-gradient-to-br from-purple-500 to-pink-500">
        {trip.cover_photo?.file_url ? (
          <img
            src={`${API_BASE_URL}${trip.cover_photo.file_url}`}
            alt={trip.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/20 text-xs">
            No photo
          </div>
        )}

        {/* Trip Title & Rating Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-2 left-3 right-3 flex items-start justify-between">
          <div>
            <h3 className="font-bold text-white text-lg">{trip.title}</h3>
            <p className="text-white/90 text-sm">
              {formatDateRange(trip.start_date, trip.end_date)}
            </p>
          </div>
        </div>

        {/* Shared by indicator (top-right) */}
        {isShared && trip.owner_username && (
          <div className="absolute top-2 right-3 flex items-center gap-1 bg-white/90 text-slate-900 px-2.5 py-1 rounded-full text-xs shadow-sm">
            <User className="w-3 h-3 text-slate-600" />
            <span className="font-semibold">
              {trip.owner_name || trip.owner_username}
            </span>
          </div>
        )}

        {/* Bottom overlay: rating pill (bottom-right) + quote */}
        {typeof trip.rating === 'number' && trip.rating > 0 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/50 px-3 py-1.5 rounded">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-white font-semibold text-sm">
              {trip.rating.toFixed(1)}
            </span>
          </div>
        )}
        {getQuote(trip.title) && (
          <div className="absolute bottom-0 left-0 right-0 p-3 text-sm text-white italic">
            {getQuote(trip.title)}
          </div>
        )}
      </div>
    </button>
  )
}