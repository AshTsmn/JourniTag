import { useState, useEffect } from 'react';
import { Users, Search, UserPlus, UserMinus, Share2, MapPin } from 'lucide-react';

interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  profile_photo_url?: string;
}

interface Trip {
  id: number;
  title: string;
  city: string;
  country: string;
}

export default function Friends() {
  const [friends, setFriends] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'friends' | 'search' | 'share'>('friends');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [sharedWith, setSharedWith] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<{[key: number]: boolean}>({});

  useEffect(() => {
    loadFriends();
    loadTrips();
  }, []);

  const loadFriends = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/friends', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) setFriends(data.friends);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadTrips = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/trips', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) setTrips(data.trips);
    } catch (error) {
      console.error('Error loading trips:', error);
    }
  };

  const loadSharedWith = async (tripId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/trips/${tripId}/shared-with`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) setSharedWith(data.shared_with);
    } catch (error) {
      console.error('Error loading shared users:', error);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery || searchQuery.length < 2) {
      alert('Please enter at least 2 characters to search');
      return;
    }
    try {
      const response = await fetch(`http://localhost:8000/api/friends/search?query=${searchQuery}`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) setSearchResults(data.users);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const sendFriendRequest = async (user: User) => {
    // Confirmation dialog
    const confirmed = window.confirm(
      `Send friend request to ${user.name || user.username}?\n\nThey will be added to your friends list.`
    );
    if (!confirmed) return;

    setPendingRequests(prev => ({ ...prev, [user.id]: true }));

    try {
      const response = await fetch('http://localhost:8000/api/friends/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ friend_id: user.id })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`${user.name || user.username} has been added as a friend!`);
        setSearchResults(prev => prev.filter(u => u.id !== user.id));
        loadFriends();
      } else {
        alert(data.error || 'Failed to add friend');
      }
    } catch (error) {
      console.error('Error adding friend:', error);
      alert('Failed to add friend');
    } finally {
      setPendingRequests(prev => ({ ...prev, [user.id]: false }));
    }
  };

  const removeFriend = async (friend: User) => {
    const confirmed = window.confirm(
      `Remove ${friend.name || friend.username} from your friends?\n\nYou can add them again later.`
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`http://localhost:8000/api/friends/${friend.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setFriends(prev => prev.filter(f => f.id !== friend.id));
      } else {
        alert(data.error || 'Failed to remove friend');
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Failed to remove friend');
    }
  };

  const shareTrip = async (friendId: number) => {
    if (!selectedTrip) return;

    const friend = friends.find(f => f.id === friendId);
    const confirmed = window.confirm(
      `Share "${selectedTrip.title}" with ${friend?.name || friend?.username}?\n\nThey will be able to view this trip.`
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`http://localhost:8000/api/trips/${selectedTrip.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ friend_id: friendId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Trip shared with ${friend?.name || friend?.username}!`);
        loadSharedWith(selectedTrip.id);
      } else {
        alert(data.error || 'Failed to share trip');
      }
    } catch (error) {
      console.error('Error sharing trip:', error);
      alert('Failed to share trip');
    }
  };

  const handleTripSelect = (trip: Trip) => {
    setSelectedTrip(trip);
    loadSharedWith(trip.id);
  };

  const isAlreadyShared = (friendId: number) => {
    return sharedWith.some(u => u.id === friendId);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <Users size={32} className="text-blue-600" />
          <h1 className="text-2xl font-bold">Friends</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-4 py-2 rounded ${
              activeTab === 'friends' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            My Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 rounded ${
              activeTab === 'search' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Add Friends
          </button>
          <button
            onClick={() => setActiveTab('share')}
            className={`px-4 py-2 rounded ${
              activeTab === 'share' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Share Trips
          </button>
        </div>

        {/* Friends List Tab */}
        {activeTab === 'friends' && (
          <div className="space-y-2">
            {friends.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No friends yet. Click "Add Friends" to find people!
              </p>
            ) : (
              friends.map((friend) => (
                <div key={friend.id} className="p-3 bg-gray-50 rounded flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {friend.username[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{friend.name || friend.username}</div>
                      <div className="text-sm text-gray-600">{friend.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFriend(friend)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Remove friend"
                  >
                    <UserMinus size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Search/Add Friends Tab */}
        {activeTab === 'search' && (
          <div>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                placeholder="Search by username or email..."
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={searchUsers}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Search size={20} />
              </button>
            </div>

            <div className="space-y-2">
              {searchResults.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Search for users by username or email
                </p>
              ) : (
                searchResults.map((user) => (
                  <div key={user.id} className="p-3 bg-gray-50 rounded flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                        {user.username[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{user.name || user.username}</div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => sendFriendRequest(user)}
                      disabled={pendingRequests[user.id]}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      <UserPlus size={18} />
                      {pendingRequests[user.id] ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Share Trips Tab */}
        {activeTab === 'share' && (
          <div className="space-y-4">
            {/* Trip Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Select a trip to share:</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {trips.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No trips yet</p>
                ) : (
                  trips.map((trip) => (
                    <div
                      key={trip.id}
                      onClick={() => handleTripSelect(trip)}
                      className={`p-3 rounded cursor-pointer flex items-center gap-3 ${
                        selectedTrip?.id === trip.id
                          ? 'bg-blue-100 border-2 border-blue-500'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <MapPin size={18} className="text-gray-500" />
                      <div>
                        <div className="font-medium">{trip.title}</div>
                        <div className="text-sm text-gray-600">
                          {trip.city}, {trip.country}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Share with Friends */}
            {selectedTrip && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Share "{selectedTrip.title}" with:
                </label>
                
                {/* Already shared with */}
                {sharedWith.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Already shared with:</p>
                    <div className="flex flex-wrap gap-2">
                      {sharedWith.map((user) => (
                        <span
                          key={user.id}
                          className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                        >
                          {user.name || user.username}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Friends to share with */}
                <div className="space-y-2">
                  {friends.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      Add some friends first to share trips with them
                    </p>
                  ) : (
                    friends.map((friend) => (
                      <div
                        key={friend.id}
                        className="p-3 bg-gray-50 rounded flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            {friend.username[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{friend.name || friend.username}</div>
                          </div>
                        </div>
                        {isAlreadyShared(friend.id) ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm">
                            Shared ✓
                          </span>
                        ) : (
                          <button
                            onClick={() => shareTrip(friend.id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                          >
                            <Share2 size={18} />
                            Share
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {!selectedTrip && trips.length > 0 && (
              <p className="text-gray-500 text-center py-4">
                Select a trip above to share it with friends
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}