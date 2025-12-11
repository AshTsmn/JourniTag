import { useState, useEffect } from 'react'
import { X, Share2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Trip } from '@/types'

interface User {
  id: number
  username: string
  email: string
  name: string
}

interface ShareTripModalProps {
  isOpen: boolean
  trip: Trip
  onClose: () => void
}

export function ShareTripModal({ isOpen, trip, onClose }: ShareTripModalProps) {
  const [friends, setFriends] = useState<User[]>([])
  const [sharedWith, setSharedWith] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [sharing, setSharing] = useState<number | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchFriends()
      fetchSharedWith()
    }
  }, [isOpen, trip.id])

  const fetchFriends = async () => {
    try {
      const response = await fetch('/api/friends', {
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        setFriends(data.friends)
      }
    } catch (error) {
      console.error('Error fetching friends:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSharedWith = async () => {
    try {
      const response = await fetch(`/api/trips/${trip.id}/shared-with`, {
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        setSharedWith(data.shared_with)
      }
    } catch (error) {
      console.error('Error fetching shared users:', error)
    }
  }

  const shareTrip = async (friendId: number) => {
    setSharing(friendId)
    try {
      const response = await fetch(`/api/trips/${trip.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ friend_id: friendId })
      })
      const data = await response.json()
      if (data.success) {
        fetchSharedWith() // Refresh the list
      }
    } catch (error) {
      console.error('Error sharing trip:', error)
    } finally {
      setSharing(null)
    }
  }

  const unshareTrip = async (friendId: number) => {
    setSharing(friendId)
    try {
      const response = await fetch(`/api/trips/${trip.id}/unshare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ friend_id: friendId })
      })
      const data = await response.json()
      if (data.success) {
        fetchSharedWith() // Refresh the list
      }
    } catch (error) {
      console.error('Error unsharing trip:', error)
    } finally {
      setSharing(null)
    }
  }

  const isSharedWith = (friendId: number) => {
    return sharedWith.some(u => u.id === friendId)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1300]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Share Trip</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm text-gray-600 mb-4">
            Share <span className="font-semibold">"{trip.title}"</span> with your friends. They will have read-only access.
          </p>

          {loading ? (
            <p className="text-gray-500 text-center py-8">Loading friends...</p>
          ) : friends.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No friends yet</p>
              <p className="text-sm text-gray-400 mt-1">Add friends to share trips with them</p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map(friend => {
                const shared = isSharedWith(friend.id)
                const isProcessing = sharing === friend.id

                return (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                        {(friend.name || friend.username).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{friend.name || friend.username}</p>
                        <p className="text-xs text-gray-500">@{friend.username}</p>
                      </div>
                    </div>

                    {shared ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => unshareTrip(friend.id)}
                        disabled={isProcessing}
                        className="gap-1"
                      >
                        <Check className="h-4 w-4" />
                        Shared
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => shareTrip(friend.id)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? 'Sharing...' : 'Share'}
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
