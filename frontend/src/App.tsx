import { useState, useEffect } from 'react'
import Login from '@/components/Login'
import MainApp from '@/components/MainApp'

interface User {
  id: number
  username: string
  email: string
  name: string
}

function App() {
  const [user, setUser] = useState<User | null>(null)
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
    <div className="h-screen w-screen overflow-hidden">
      {/* Minimal Top Bar - just user info and logout */}
      <div className="fixed top-0 right-0 z-[1200] px-4 py-2">
        <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm px-3 py-2">
          <span className="text-sm font-medium text-gray-700">
            {user.name || user.username}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:text-red-700 hover:underline"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main App - has its own BottomNav with Home, Friends, Trips */}
      <MainApp />
    </div>
  )
}

export default App