import { useState, useEffect } from 'react'
import Login from '@/components/Login'
import Friends from '@/components/Friends'
import MainApp from '@/components/MainApp'

interface User {
  id: number
  username: string
  email: string
  name: string
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [showFriends, setShowFriends] = useState(false)
  const [loading, setLoading] = useState(true)

  // Check if user is already logged in (keeps you logged in after page refresh)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/auth/check', {
          credentials: 'include'
        })
        const data = await response.json()
        
        if (data.authenticated) {
          setUser(data.user)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  // Logout function
  const handleLogout = async () => {
    try {
      await fetch('http://localhost:8000/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      setUser(null)
      setShowFriends(false)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Show loading spinner while checking if logged in
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  // Not logged in - show login page
  if (!user) {
    return <Login onLoginSuccess={setUser} />
  }

  // Logged in - show main app
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
              {user.name || user.username}
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-[60px] h-screen">
        {showFriends ? <Friends /> : <MainApp />}
      </div>
    </div>
  )
}

export default App