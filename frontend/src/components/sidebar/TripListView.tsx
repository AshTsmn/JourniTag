/**
 * TripListView Component
 * Shows list of all trips similar to Recent Trips on home
 */

import { ArrowLeft, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Trip } from '@/types'
import { mockTrips } from '@/lib/mockData'
import { cn } from '@/lib/utils'

interface TripListViewProps {
  onBack: () => void
  onTripClick: (trip: Trip) => void
}

export function TripListView({ onBack, onTripClick }: TripListViewProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3 mb-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold flex-1">My Trips</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search trips..."
            className="pl-9 bg-muted/50"
          />
        </div>
      </div>

      {/* Trip List - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {mockTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onClick={() => onTripClick(trip)} />
          ))}
        </div>
      </div>
    </div>
  )
}

interface TripCardProps {
  trip: Trip
  onClick: () => void
}

function TripCard({ trip, onClick }: TripCardProps) {
  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)

    const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' })
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' })
    const startDay = startDate.getDate()
    const endDay = endDate.getDate()

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}`
    }
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`
  }

  const getQuote = (title: string) => {
    if (title.includes('tokyo')) {
      return '"Good food, good life. 10/10 would come again."'
    }
    if (title.includes('detroit')) {
      return '"I don\'t want to talk about it."'
    }
    return '"Amazing experience!"'
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
        {/* Placeholder gradient - will be replaced with actual photo */}
        <div className="absolute inset-0 flex items-center justify-center text-white/20 text-xs">
          Photo placeholder
        </div>

        {/* Trip Title & Rating Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-2 left-3 right-3 flex items-start justify-between">
          <div>
            <h3 className="font-bold text-white text-lg">{trip.title}</h3>
            <p className="text-white/90 text-sm">
              {formatDateRange(trip.start_date, trip.end_date)}
            </p>
          </div>
          {trip.rating && (
            <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded">
              <span className="text-yellow-400">⭐</span>
              <span className="text-white font-semibold">{trip.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        <div className="absolute bottom-0 p-3 text-sm text-white italic">
          {getQuote(trip.title)}
        </div>
      </div>
    </button>
  )
}
