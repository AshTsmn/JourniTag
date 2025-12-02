import { useState } from 'react'
import Login from '@/components/Login'
import Friends from '@/components/Friends'
import MainApp from '@/components/MainApp'

function App() {
  const [user, setUser] = useState(null)
  const [showFriends, setShowFriends] = useState(false)

  // Not logged in - show login
  if (!user) {
    return <Login onLoginSuccess={setUser} />
  }

  // Logged in - show friends or main app
  return (
    <div>
      {/* Top Nav Bar */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50 px-4 py-3">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">JourniTag</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFriends(!showFriends)}
              className={`px-4 py-2 rounded ${
                showFriends ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              {showFriends ? 'Back to Map' : 'Friends'}
            </button>
            <span className="text-sm text-gray-600">
              {user.username}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content - with top padding for nav */}
      <div className="pt-[60px] h-screen">
        {showFriends ? <Friends /> : <MainApp />}
      </div>
    </div>
  )
}

export default App