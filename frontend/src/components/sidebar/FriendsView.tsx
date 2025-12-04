import { useState, useEffect } from 'react'
import { UserPlus, Users, Share2, Search, X, Check } from 'lucide-react'

interface User {
  id: number
  username: string
  email: string
  name: string
  profile_photo_url?: string
}

interface Trip {
  id: number
  title: string
  city?: string
  country?: string
}

interface FriendRequest {
  id: number
  user_id: number
  username: string
  email: string
  name: string
  profile_photo_url?: string
}

type Tab = 'friends' | 'add' | 'share'

interface FriendsViewProps {
  /**
   * Optional trip id to immediately open in the "Share Trips" tab.
   * Used when user clicks Share from a specific location/trip context.
   */
  shareTripId?: string | number | null
  /**
   * Callback fired once the shareTripId has been consumed, so parent
   * can clear its temporary navigation state.
   */
  onShareHandled?: () => void
}

export function FriendsView({ shareTripId, onShareHandled }: FriendsViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('friends')
  const [friends, setFriends] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [trips, setTrips] = useState<Trip[]>([])
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [sharedWith, setSharedWith] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([])
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([])

  // Confirmation dialog state
  const [confirmAction, setConfirmAction] = useState<{
    type: 'add' | 'remove' | 'share'
    user?: User
    trip?: Trip
  } | null>(null)

  // Fetch friends list
  useEffect(() => {
    fetchFriends()
    fetchFriendRequests()
    fetchTrips()
  }, [])

  // Refresh friends & requests whenever user switches back to "My Friends" tab
  useEffect(() => {
    if (activeTab === 'friends') {
      fetchFriends()
      fetchFriendRequests()
    }
  }, [activeTab])

  // If we are given a trip to share (e.g. from Location detail "Share" button),
  // automatically switch to Share tab and preselect that trip once trips are loaded.
  useEffect(() => {
    if (!shareTripId || trips.length === 0) return

    const numericId = Number(shareTripId)
    if (!Number.isFinite(numericId)) return

    const trip = trips.find((t) => t.id === numericId)
    if (!trip) return

    setActiveTab('share')
    setSelectedTrip(trip)
    fetchSharedWith(trip.id)
    onShareHandled?.()
  }, [shareTripId, trips])

  const fetchFriends = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/friends', {
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

  const fetchFriendRequests = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/friends/requests', {
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        setIncomingRequests(data.incoming || [])
        setOutgoingRequests(data.outgoing || [])
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error)
    }
  }

  const fetchTrips = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/trips', {
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        setTrips(data.trips)
      }
    } catch (error) {
      console.error('Error fetching trips:', error)
    }
  }

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`http://localhost:8000/api/friends/search?query=${encodeURIComponent(query)}`, {
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        // Filter out existing friends
        const friendIds = new Set(friends.map(f => f.id))
        setSearchResults(data.users.filter((u: User) => !friendIds.has(u.id)))
      }
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const sendFriendRequest = async (user: User) => {
    try {
      const response = await fetch('http://localhost:8000/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ friend_id: user.id })
      })
      const data = await response.json()
      if (data.success) {
        if (data.accepted) {
          // Request auto-accepted (other user had already requested us)
          setFriends([...friends, user])
          setSearchResults(searchResults.filter(u => u.id !== user.id))
        } else {
          // Pending request
          await fetchFriendRequests()
        }
        setConfirmAction(null)
      }
    } catch (error) {
      console.error('Error adding friend:', error)
    }
  }

  const removeFriend = async (user: User) => {
    try {
      const response = await fetch(`http://localhost:8000/api/friends/${user.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        setFriends(friends.filter(f => f.id !== user.id))
        setConfirmAction(null)
      }
    } catch (error) {
      console.error('Error removing friend:', error)
    }
  }

  const acceptRequest = async (request: FriendRequest) => {
    try {
      const response = await fetch(`http://localhost:8000/api/friends/requests/${request.id}/accept`, {
        method: 'POST',
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        // Add to friends and remove from incoming requests
        const newFriend: User = data.friend || {
          id: request.user_id,
          username: request.username,
          email: request.email,
          name: request.name,
          profile_photo_url: request.profile_photo_url
        }
        setFriends(prev => [...prev, newFriend])
        setIncomingRequests(prev => prev.filter(r => r.id !== request.id))
      }
    } catch (error) {
      console.error('Error accepting friend request:', error)
    }
  }

  const deleteRequest = async (request: FriendRequest) => {
    try {
      const response = await fetch(`http://localhost:8000/api/friends/requests/${request.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        setIncomingRequests(prev => prev.filter(r => r.id !== request.id))
        setOutgoingRequests(prev => prev.filter(r => r.id !== request.id))
      }
    } catch (error) {
      console.error('Error deleting friend request:', error)
    }
  }

  const fetchSharedWith = async (tripId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/trips/${tripId}/shared-with`, {
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

  const shareTrip = async (user: User) => {
    if (!selectedTrip) return

    try {
      const response = await fetch(`http://localhost:8000/api/trips/${selectedTrip.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ friend_id: user.id })
      })
      const data = await response.json()
      if (data.success) {
        setSharedWith([...sharedWith, user])
        setConfirmAction(null)
      }
    } catch (error) {
      console.error('Error sharing trip:', error)
    }
  }

  const handleTripSelect = (trip: Trip) => {
    setSelectedTrip(trip)
    fetchSharedWith(trip.id)
  }

  // Confirmation Dialog Component
  const ConfirmDialog = () => {
    if (!confirmAction) return null

    let title = ''
    let message = ''
    let onConfirm = () => {}

    if (confirmAction.type === 'add' && confirmAction.user) {
      title = 'Add Friend'
      message = `Send friend request to ${confirmAction.user.name || confirmAction.user.username}?`
      onConfirm = () => sendFriendRequest(confirmAction.user!)
    } else if (confirmAction.type === 'remove' && confirmAction.user) {
      title = 'Remove Friend'
      message = `Remove ${confirmAction.user.name || confirmAction.user.username} from your friends? You can add them again later.`
      onConfirm = () => removeFriend(confirmAction.user!)
    } else if (confirmAction.type === 'share' && confirmAction.user && confirmAction.trip) {
      title = 'Share Trip'
      message = `Share "${confirmAction.trip.title}" with ${confirmAction.user.name || confirmAction.user.username}? They will be able to view this trip.`
      onConfirm = () => shareTrip(confirmAction.user!)
    }

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-gray-600 mb-4">{message}</p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setConfirmAction(null)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <h2 className="text-xl font-bold mb-4">Friends</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'friends'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Users className="h-4 w-4" />
          My Friends
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'add'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <UserPlus className="h-4 w-4" />
          Add Friends
        </button>
        <button
          onClick={() => setActiveTab('share')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'share'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Share2 className="h-4 w-4" />
          Share Trips
        </button>
      </div>

      {/* My Friends Tab */}
      {activeTab === 'friends' && (
        <div>
          {loading ? (
            <p className="text-gray-500 text-center py-8">Loading...</p>
          ) : (
            <>
              {/* Incoming requests (always show if present, even with zero friends) */}
              {incomingRequests.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Friend requests</p>
                  <div className="space-y-2">
                    {incomingRequests.map(request => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                            {(request.name || request.username).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{request.name || request.username}</p>
                            <p className="text-sm text-gray-500">@{request.username}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => acceptRequest(request)}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => deleteRequest(request)}
                            className="px-3 py-1 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Friends list or empty state */}
              {friends.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No friends yet</p>
                  <button
                    onClick={() => setActiveTab('add')}
                    className="mt-2 text-blue-600 hover:underline text-sm"
                  >
                    Add your first friend
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {friends.map(friend => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                          {(friend.name || friend.username).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{friend.name || friend.username}</p>
                          <p className="text-sm text-gray-500">@{friend.username}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setConfirmAction({ type: 'remove', user: friend })}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove friend"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Add Friends Tab */}
      {activeTab === 'add' && (
        <div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by username or email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                searchUsers(e.target.value)
              }}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {isSearching ? (
            <p className="text-gray-500 text-center py-4">Searching...</p>
          ) : searchQuery.length < 2 ? (
            <p className="text-gray-500 text-center py-8 text-sm">
              Type at least 2 characters to search
            </p>
          ) : searchResults.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No users found</p>
          ) : (
            <div className="space-y-2">
              {searchResults.map(user => {
                const isFriend = friends.some(f => f.id === user.id)
                const outgoing = outgoingRequests.find(r => r.user_id === user.id)
                const incoming = incomingRequests.find(r => r.user_id === user.id)

                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-medium">
                        {(user.name || user.username).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{user.name || user.username}</p>
                        <p className="text-sm text-gray-500">@{user.username}</p>
                      </div>
                    </div>

                    {isFriend ? (
                      <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700">
                        Friends
                      </span>
                    ) : outgoing ? (
                      <button
                        onClick={() => deleteRequest(outgoing)}
                        className="px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                      >
                        Request pending
                      </button>
                    ) : incoming ? (
                      <button
                        onClick={() => acceptRequest(incoming)}
                        className="px-3 py-1 text-xs rounded-full bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Accept request
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmAction({ type: 'add', user })}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Add friend"
                      >
                        <UserPlus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Share Trips Tab */}
      {activeTab === 'share' && (
        <div>
          {/* Trip selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select a trip to share
            </label>
            <select
              value={selectedTrip?.id || ''}
              onChange={(e) => {
                const trip = trips.find(t => t.id === Number(e.target.value))
                if (trip) handleTripSelect(trip)
              }}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a trip...</option>
              {trips.map(trip => (
                <option key={trip.id} value={trip.id}>
                  {trip.title} {trip.city && `- ${trip.city}`}
                </option>
              ))}
            </select>
          </div>

          {selectedTrip && (
            <>
              {/* Already shared with */}
              {sharedWith.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Already shared with:</p>
                  <div className="flex flex-wrap gap-2">
                    {sharedWith.map(user => (
                      <span
                        key={user.id}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                      >
                        <Check className="h-3 w-3" />
                        {user.name || user.username}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Friends to share with */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Share with friends:</p>
                {friends.length === 0 ? (
                  <p className="text-gray-500 text-center py-4 text-sm">
                    Add friends first to share trips
                  </p>
                ) : (
                  <div className="space-y-2">
                    {friends
                      .filter(f => !sharedWith.some(s => s.id === f.id))
                      .map(friend => (
                        <div
                          key={friend.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                              {(friend.name || friend.username).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{friend.name || friend.username}</p>
                              <p className="text-sm text-gray-500">@{friend.username}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setConfirmAction({ type: 'share', user: friend, trip: selectedTrip })}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Share with this friend"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    {friends.filter(f => !sharedWith.some(s => s.id === f.id)).length === 0 && (
                      <p className="text-gray-500 text-center py-4 text-sm">
                        Already shared with all friends
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog />
    </div>
  )
}