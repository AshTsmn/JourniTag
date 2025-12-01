import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, MapPin } from 'lucide-react'
import { UploadState } from '@/types'

interface FileSelectStepProps {
  onFilesSelected: (files: File[], previews: UploadState['previews']) => void
  onClose: () => void
}

export function FileSelectStep({ onFilesSelected, onClose }: FileSelectStepProps) {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<UploadState['previews']>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (selectedFiles: FileList | File[]) => {
    console.log('Files selected:', selectedFiles)
    const fileArray = Array.from(selectedFiles)

    // Filter for supported image types
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/heic', 'image/heif']
    const imageFiles = fileArray.filter(file =>
      file.type.startsWith('image/') && supportedTypes.includes(file.type.toLowerCase())
    )

    console.log('Image files:', imageFiles)

    if (imageFiles.length === 0) {
      alert('Please select supported image files (JPEG, PNG, GIF, WebP, BMP). HEIC files need to be converted first.')
      return
    }

    const newFiles = [...files, ...imageFiles]
    setFiles(newFiles)
    setIsProcessing(true)

    try {
      // Create previews (locally, for display)
      const localPreviews = await Promise.all(imageFiles.map(async (file) => {
        const preview = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            if (e.target?.result) {
              resolve(e.target.result as string)
            } else {
              reject(new Error('Failed to read file'))
            }
          }
          reader.onerror = () => reject(new Error('FileReader error'))
          reader.readAsDataURL(file)
        })

        return { file, preview, coordinates: undefined, exifData: undefined }
      }))

      // Send files to backend for EXIF extraction
      const formData = new FormData()
      imageFiles.forEach(file => {
        formData.append('files', file)
      })

      console.log('Sending files to backend for EXIF extraction...')
      const response = await fetch('http://localhost:8000/api/photos/extract-exif', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Backend error: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('EXIF data from backend:', data)

      if (!data.success) {
        throw new Error(data.error || 'Failed to extract EXIF data')
      }

      // Merge backend EXIF data with local previews
      const mergedPreviews = localPreviews.map((preview, index) => {
        const exifResult = data.photos[index]
        return {
          ...preview,
          coordinates: exifResult?.coordinates?.latitude && exifResult?.coordinates?.longitude ? {
            x: exifResult.coordinates.longitude,
            y: exifResult.coordinates.latitude,
          } : undefined,
          exifData: exifResult,
        }
      })

      setPreviews(prev => [...prev, ...mergedPreviews])
      console.log('Updated previews with backend EXIF data:', mergedPreviews)
    } catch (error) {
      console.error('Error processing files:', error)
      alert(`Error processing files: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }, [files])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const droppedFiles = e.dataTransfer.files
    console.log('Files dropped:', droppedFiles)
    handleFileSelect(droppedFiles)
  }, [handleFileSelect])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input changed:', e.target.files)
    if (e.target.files) {
      handleFileSelect(e.target.files)
    }
  }, [handleFileSelect])

  const handleRemoveFile = useCallback((index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    const newPreviews = previews.filter((_, i) => i !== index)

    setFiles(newFiles)
    setPreviews(newPreviews)
  }, [files, previews])

  const handleContinue = useCallback(() => {
    if (files.length === 0) {
      alert('Please select at least one photo.')
      return
    }
    onFilesSelected(files, previews)
  }, [files, previews, onFilesSelected])

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      previews.forEach(preview => {
        if (preview.preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview.preview)
        }
      })
    }
  }, [previews])

  return (
    <div className="space-y-6">
      {/* File input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.heic,.heif"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Drop zone */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">
          {isProcessing ? 'Processing photos...' : 'Upload Photos'}
        </h3>
        <p className="text-gray-600 mb-4">
          {isProcessing ? 
            'Extracting GPS coordinates from your photos...' :
            'Drag and drop your photos here, or click to browse'
          }
        </p>
        {!isProcessing && (
          <Button
            onClick={(e) => {
              e.stopPropagation()
              openFileDialog()
            }}
            variant="outline"
          >
            Choose Files
          </Button>
        )}
      </div>

      {/* Selected files preview */}
      {files.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold">Selected Photos ({files.length})</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative group bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="aspect-square relative">
                  <img
                    src={preview.preview}
                    alt={`Preview ${index + 1}`}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                      objectFit: 'cover',
                      width: '100%',
                      height: '100%',
                      display: 'block'
                    }}
                  />
                  {preview.coordinates && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      GPS
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveFile(index)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-2">
                  <p className="text-sm font-medium truncate">
                    {preview.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(preview.file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                  {preview.coordinates && (
                    <p className="text-xs text-green-600">
                      📍 {preview.coordinates.y.toFixed(4)}, {preview.coordinates.x.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 mt-6 -mx-6 px-6 py-4 shadow-lg">
        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleContinue}
            disabled={files.length === 0 || isProcessing}
            className={`px-6 py-2 ${files.length === 0 || isProcessing ? 'opacity-50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isProcessing ? 'Processing...' : `Continue (${files.length} photos)`}
          </Button>
        </div>
      </div>
    </div>
  )
}