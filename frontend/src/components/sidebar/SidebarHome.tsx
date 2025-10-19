/**
 * SidebarHome Component
 * Default sidebar view showing search, upload, and recent trips
 */

import { Search, Upload, Home, Map, Settings } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import type { Trip } from '@/types'
import { mockTrips, mockUser } from '@/lib/mockData'
import { cn } from '@/lib/utils'

interface SidebarHomeProps {
  onTripClick?: (trip: Trip) => void
  onUploadClick?: () => void
  onMyTripsClick?: () => void
}

export function SidebarHome({ onTripClick, onUploadClick, onMyTripsClick }: SidebarHomeProps) {
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-9 bg-muted/50"
            />
          </div>
          {/* <Avatar className="w-9 h-9">
            <AvatarFallback>
              {mockUser.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar> */}
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* Upload Section */}
        <div className="p-4">
          <button
            onClick={onUploadClick}
            className={cn(
              "w-full border-2 border-dashed rounded-lg p-8",
              "flex flex-col items-center justify-center gap-3",
              "hover:border-primary hover:bg-muted/50 transition-colors",
              "cursor-pointer"
            )}
          >
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary-foreground" />
            </div>
            <span className="text-base font-medium text-primary">Upload Photos</span>
          </button>
        </div>

        {/* Recent Trips */}
        <div className="px-4 pb-4">
          <h2 className="text-xl font-bold mb-4">Recent trips</h2>
          <div className="space-y-3">
            {mockTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onClick={() => onTripClick?.(trip)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="border-t p-4">
        <div className="flex items-center justify-around">
          <Button variant="ghost" size="sm" className="flex-col h-auto py-2 gap-1">
            <Home className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium text-primary">Home</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-col h-auto py-2 gap-1"
            onClick={onMyTripsClick}
          >
            <Map className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">My Trips</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex-col h-auto py-2 gap-1">
            <Settings className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Settings</span>
          </Button>
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

  // Get a sample quote based on trip title
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
