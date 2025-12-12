import { useState } from 'react';
import { LogIn, Mail } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');

    const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';
    const body = isSignup
      ? { username, email, password }
      : { username, password };

    try {
      const response = await fetch(`${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',  // <-- THIS LINE IS NEW - enables session cookies
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        onLoginSuccess(data.user);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8">
        {/* App Branding */}
        <div className="text-center mb-8">
          <div className="flex flex-row items-center justify-center mb-4">
            <img
              src="/journitag-logo.png"
              alt="JourniTag Logo"
              className="h-20 w-20 mb-3 object-contain"
            />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-stone-600 to-stone-900 bg-clip-text text-transparent">
              JourniTag
            </h1>
          </div>
          <p className="text-gray-600 text-sm mb-6">
            Tag your journey, share your story. Capture, organize, and relive your travel memories with friends and family.
          </p>
          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-6"></div>
        </div>

        {/* Login Form Header */}
        <div className="text-center mb-6">
          <LogIn className="mx-auto mb-3 text-blue-600" size={32} />
          <h2 className="text-xl font-semibold text-gray-800">
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isSignup ? 'Start your journey today' : 'Sign in to continue'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="username"
            />
          </div>

          {isSignup && (
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="email@example.com"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="password"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            {isSignup ? 'Sign Up' : 'Sign In'}
          </button>

          <button
            onClick={() => setIsSignup(!isSignup)}
            className="w-full text-blue-600 hover:underline text-sm"
          >
            {isSignup ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
          </button>
        </div>

        {/* Footer - Contact Info */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500 mb-2">
            Need help or have questions?
          </p>
          <a
            href="mailto:journitag@umich.edu"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Mail className="mr-1" size={14} />
            journitag@umich.edu
          </a>
          <p className="text-xs text-gray-400 mt-3">
            © 2025 JourniTag. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}