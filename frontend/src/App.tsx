import { useState } from 'react'
import { MapView } from '@/components/map'
import { usePhotos } from '@/hooks/usePhotos'
import type { Photo } from '@/types'
import './App.css'

function App() {
  const { photos, loading } = usePhotos()
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)

  const handlePhotoClick = (photo: Photo) => {
    setSelectedPhoto(photo)
    console.log('Photo clicked:', photo)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading photos...</p>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen relative">
      <MapView photos={photos} onPhotoClick={handlePhotoClick} />

      {/* Selected photo info - temporary debug */}
      {selectedPhoto && (
        <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg max-w-sm z-[1000]">
          <img
            src={selectedPhoto.file_url}
            alt={selectedPhoto.original_filename}
            className="w-full h-32 object-cover rounded mb-2"
          />
          <p className="font-semibold">{selectedPhoto.location?.name}</p>
          <p className="text-sm text-gray-600">{selectedPhoto.location?.address}</p>
          <button
            onClick={() => setSelectedPhoto(null)}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}

export default App
