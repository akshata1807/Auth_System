'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '../../lib/api'

interface User {
  id: string
  name: string
  email: string
}

export default function Welcome() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for token in URL parameters first (for OAuth callbacks)
    const urlParams = new URLSearchParams(window.location.search)
    const urlToken = urlParams.get('token')

    if (urlToken) {
      localStorage.setItem('token', urlToken)
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    // Decode token to get user info with proper error handling
    try {
      const parts = token.split('.')
      if (parts.length !== 3) {
        throw new Error('Invalid token format')
      }

      const payload = parts[1]
      // Handle URL-safe base64 encoding
      const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/')
      const paddedPayload = normalizedPayload + '='.repeat((4 - normalizedPayload.length % 4) % 4)

      const decodedPayload = atob(paddedPayload)
      const parsedPayload = JSON.parse(decodedPayload)

      console.log('Decoded token payload:', parsedPayload) // Debug log

      // Validate required fields - be more flexible
      if (!parsedPayload) {
        throw new Error('Token payload is empty')
      }

      // Use whatever ID field is available
      const userId = parsedPayload.id || parsedPayload.userId || parsedPayload.sub || parsedPayload._id
      const userEmail = parsedPayload.email || parsedPayload.emailAddress || parsedPayload.upn
      const userName = parsedPayload.name || parsedPayload.displayName || parsedPayload.preferred_username || parsedPayload.given_name

      if (!userId) {
        console.error('Missing user ID in token:', { parsedPayload })
        throw new Error('Invalid token payload - missing user ID')
      }

      if (!userEmail) {
        console.error('Missing user email in token:', { parsedPayload })
        throw new Error('Invalid token payload - missing user email')
      }

      setUser({
        id: String(userId),
        name: userName || userEmail?.split('@')[0] || 'User',
        email: userEmail
      })
    } catch (error) {
      console.error('Token decoding failed:', error)
      localStorage.removeItem('token')
      router.push('/login')
    }
    setLoading(false)
  }, [router])

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      // Ignore error
    }
    localStorage.removeItem('token')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Auth System</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/profile" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                Profile
              </Link>
              <Link href="/admin" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                Admin
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Welcome back, {user.name}!
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              You have successfully logged in to your account.
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-md mx-auto">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Your Account</h2>
              <div className="text-left">
                <p className="text-gray-600 dark:text-gray-400"><strong>Name:</strong> {user.name}</p>
                <p className="text-gray-600 dark:text-gray-400"><strong>Email:</strong> {user.email}</p>
              </div>
              <div className="mt-6">
                <Link
                  href="/profile"
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 inline-block"
                >
                  Manage Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}