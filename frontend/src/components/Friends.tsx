import { useState, useEffect } from 'react';
import { Users, Search, UserPlus } from 'lucide-react';

export default function Friends() {
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeTab, setActiveTab] = useState<'friends' | 'search'>('friends');

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    const response = await fetch('http://localhost:8000/api/friends');
    const data = await response.json();
    if (data.success) setFriends(data.friends);
  };

  const searchUsers = async () => {
    if (!searchQuery) return;
    const response = await fetch(`http://localhost:8000/api/friends/search?query=${searchQuery}`);
    const data = await response.json();
    if (data.success) setSearchResults(data.users);
  };

  const addFriend = async (friendId: number) => {
    const response = await fetch('http://localhost:8000/api/friends/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ friend_id: friendId })
    });
    
    if (response.ok) {
      setSearchResults(searchResults.filter((u: any) => u.id !== friendId));
      loadFriends();
      alert('Friend added!');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <Users size={32} className="text-blue-600" />
          <h1 className="text-2xl font-bold">Friends</h1>
        </div>

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
        </div>

        {activeTab === 'friends' && (
          <div className="space-y-2">
            {friends.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No friends yet</p>
            ) : (
              friends.map((friend: any) => (
                <div key={friend.id} className="p-3 bg-gray-50 rounded flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {friend.username[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{friend.username}</div>
                    <div className="text-sm text-gray-600">{friend.email}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                placeholder="Search username or email..."
                className="flex-1 px-4 py-2 border rounded-lg"
              />
              <button
                onClick={searchUsers}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg"
              >
                <Search size={20} />
              </button>
            </div>

            <div className="space-y-2">
              {searchResults.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Search for users</p>
              ) : (
                searchResults.map((user: any) => (
                  <div key={user.id} className="p-3 bg-gray-50 rounded flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {user.username[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => addFriend(user.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      <UserPlus size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
