/**
 * usePhotos Hook
 * Fetch and manage photos data
 */

import { useState, useEffect } from 'react'
import { photoAPI } from '@/services/api'
import type { Photo } from '@/types'

export function usePhotos() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPhotos()
  }, [])

  const loadPhotos = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch photos from backend API
      const data = await photoAPI.getPhotos()

      setPhotos(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load photos')
      console.error('Error loading photos:', err)
    } finally {
      setLoading(false)
    }
  }

  const deletePhoto = async (photoId: string) => {
    try {
      await photoAPI.deletePhoto(photoId)
      setPhotos((prev) => prev.filter((p) => p.id !== photoId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete photo')
      throw err
    }
  }

  return {
    photos,
    setPhotos,
    loading,
    error,
    refresh: loadPhotos,
    deletePhoto,
  }
}
