import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { X, Upload, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { tripAPI, locationAPI, photoAPI } from '@/services/api'
import type { CreateLocationRequest, CreateTripRequest, Location, Trip, UploadPhotoRequest } from '@/types'
import { COST_LEVELS, TAG_OPTIONS } from '@/types'

interface QuickUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadComplete: (trip?: Trip, locations?: Location[], pendingPhotos?: UploadPhotoRequest[]) => void
}

interface PreviewItem {
  file: File
  preview: string
  coordinates?: { x: number; y: number }
  exifData?: any
}

type TripMode = 'existing' | 'new'
type LocationMode = 'existing' | 'new'

export function QuickUploadModal({ isOpen, onClose, onUploadComplete }: QuickUploadModalProps) {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<PreviewItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [tripMode, setTripMode] = useState<TripMode>('existing')
  const [locationMode, setLocationMode] = useState<LocationMode>('new')

  const [trips, setTrips] = useState<Trip[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedTripId, setSelectedTripId] = useState<string>('')
  const [selectedLocationId, setSelectedLocationId] = useState<string>('')

  const [tripDetails, setTripDetails] = useState<CreateTripRequest>({
    title: '',
    city: '',
    country: '',
    start_date: '',
    end_date: '',
  })

  const [locationDetails, setLocationDetails] = useState<CreateLocationRequest>({
    trip_id: '',
    x: 0,
    y: 0,
    name: '',
    address: '',
    rating: 5,
    notes: '',
    tags: [],
    cost_level: 'Free',
    time_needed: 60,
    best_time_to_visit: '',
  })
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')

  const firstCoordinates = useMemo(
    () => previews.find(p => p.coordinates)?.coordinates,
    [previews]
  )

  // Reset on open
  useEffect(() => {
    if (!isOpen) return
    setFiles([])
    setPreviews([])
    setIsProcessing(false)
    setTripMode('existing')
    setLocationMode('new')
    setSelectedTripId('')
    setSelectedLocationId('')
    setTripDetails({ title: '', city: '', country: '', start_date: '', end_date: '' })
    setLocationDetails({
      trip_id: '',
      x: 0,
      y: 0,
      name: '',
      address: '',
      rating: 5,
      notes: '',
      tags: [],
      cost_level: 'Free',
      time_needed: 60,
      best_time_to_visit: '',
    })
    setSelectedTags([])
    setNewTag('')
  }, [isOpen])

  // Fetch trips on open
  useEffect(() => {
    if (!isOpen) return
    const run = async () => {
      try {
        const data = await tripAPI.getAllTrips()
        setTrips(data)
      } catch (e) {
        console.error('Failed to load trips:', e)
      }
    }
    run()
  }, [isOpen])

  // Fetch locations when trip changes
  useEffect(() => {
    const run = async () => {
      if (!selectedTripId) {
        setLocations([])
        return
      }
      try {
        const { locations: locs } = await tripAPI.getTripById(selectedTripId)
        setLocations(locs)
      } catch (e) {
        console.error('Failed to load locations:', e)
        setLocations([])
      }
    }
    run()
  }, [selectedTripId])

  // Auto-geocode coordinates into name/address AND trip city/country
  useEffect(() => {
    const run = async () => {
      if (!firstCoordinates) return
      try {
        const resp = await fetch('http://localhost:8000/api/geocode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude: firstCoordinates.y, longitude: firstCoordinates.x }),
        })
        if (!resp.ok) return
        const data = await resp.json()
        if (data?.success) {
          // Update location details
          setLocationDetails(prev => ({
            ...prev,
            name: prev.name || data.name || '',
            address: prev.address || data.address || '',
            x: firstCoordinates.x,
            y: firstCoordinates.y,
          }))
          
          // ALSO update trip details with city and country (only if creating new trip)
          if (tripMode === 'new') {
            setTripDetails(prev => ({
              ...prev,
              city: prev.city || data.city || '',
              country: prev.country || data.country || '',
            }))
          }
        } else {
          setLocationDetails(prev => ({ ...prev, x: firstCoordinates.x, y: firstCoordinates.y }))
        }
      } catch (e) {
        console.warn('Geocode failed:', e)
        setLocationDetails(prev => ({ ...prev, x: firstCoordinates.x, y: firstCoordinates.y }))
      }
    }
    run()
  }, [firstCoordinates, tripMode])  // Add tripMode to dependencies

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFilesSelected = useCallback(async (selected: FileList | File[]) => {
    const chosen = Array.from(selected)
    const supportedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/heic',
      'image/heif',
    ]
    const imgs = chosen.filter(f => f.type.startsWith('image/') && supportedTypes.includes(f.type.toLowerCase()))
    if (imgs.length === 0) {
      alert('Please select supported image files (JPEG, PNG, GIF, WebP, BMP, HEIC/HEIF).')
      return
    }
    const newFiles = [...files, ...imgs]
    setFiles(newFiles)
    setIsProcessing(true)
    try {
      const form = new FormData()
      imgs.forEach(f => form.append('files', f))
      const r = await fetch('http://localhost:8000/api/photos/extract-exif', { method: 'POST', body: form })
      if (!r.ok) throw new Error('EXIF request failed')
      const data = await r.json()
      if (!data?.success) throw new Error(data?.error || 'EXIF parse failed')

      const merged: PreviewItem[] = imgs.map((file, index) => {
        const ex = data.photos[index]
        const coords =
          ex?.coordinates?.latitude && ex?.coordinates?.longitude
            ? { x: ex.coordinates.longitude, y: ex.coordinates.latitude }
            : undefined
        const preview: string =
          ex?.preview_data_url ||
          URL.createObjectURL(file)
        return { file, preview, coordinates: coords, exifData: ex }
      })

      setPreviews(prev => [...prev, ...merged])
    } catch (e: any) {
      console.error('File process error:', e)
      alert(`Error processing files: ${e.message || 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }, [files])

  const handleRemoveFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }, [])

  const canUpload = useMemo(() => {
    if (files.length === 0) return false
    if (tripMode === 'new') {
      if (!tripDetails.title || !tripDetails.city || !tripDetails.country) return false
      return (locationDetails.name && locationDetails.address) || !!firstCoordinates
    }
    if (!selectedTripId) return false
    if (locationMode === 'existing') return !!selectedLocationId
    return (locationDetails.name && locationDetails.address) || !!firstCoordinates
  }, [files.length, tripMode, tripDetails, selectedTripId, locationMode, selectedLocationId, locationDetails, firstCoordinates])

  const handleUpload = useCallback(async () => {
    if (!canUpload) return
    try {
      let finalTripId: string | undefined = selectedTripId
      let finalLocationId: string | undefined = selectedLocationId

      if (tripMode === 'new') {
        const createdTrip = await tripAPI.createTrip(tripDetails)
        finalTripId = createdTrip.id.toString()
      }
      if (!finalTripId) throw new Error('Trip is required')

      if (locationMode === 'new' || tripMode === 'new') {
        const coords = firstCoordinates || { x: 0, y: 0 }
        const payload: CreateLocationRequest = {
          ...locationDetails,
          trip_id: finalTripId,
          x: coords.x,
          y: coords.y,
          tags: selectedTags,
        }
        if (!payload.name) payload.name = tripDetails.city || 'New Location'
        if (!payload.address) payload.address = [tripDetails.city, tripDetails.country].filter(Boolean).join(', ')
        const createdLoc = await locationAPI.createLocation(payload)
        finalLocationId = createdLoc.id.toString()
      }

      if (!finalLocationId) throw new Error('Location is required')

      const requests: UploadPhotoRequest[] = previews.map(p => ({
        file: p.file,
        location_id: finalLocationId,
        x: p.coordinates?.x,
        y: p.coordinates?.y,
        is_cover_photo: false,
      }))
      await photoAPI.uploadPhotos(requests)

      const tripData = await tripAPI.getTripById(finalTripId)
      const locData = await locationAPI.getLocationById(finalLocationId)

      onUploadComplete(
        tripData?.trip,
        locData?.location ? [{ ...locData.location, photos: locData.photos }] : [],
        requests
      )
      onClose()
    } catch (e) {
      console.error('Upload failed:', e)
      alert('Upload failed. Please try again.')
    }
  }, [canUpload, tripMode, tripDetails, selectedTripId, locationMode, selectedLocationId, locationDetails, selectedTags, previews, firstCoordinates, onUploadComplete, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1200]">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full mx-4 max-h-[95vh] overflow-y-auto border border-slate-200">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-base font-semibold flex items-center gap-2 text-slate-900">
            <Upload className="h-5 w-5" />
            Quick Upload
          </h2>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Photos */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.heic,.heif"
              onChange={e => e.target.files && handleFilesSelected(e.target.files)}
              className="hidden"
            />
            <Card className="p-5 rounded-xl border border-slate-200 shadow-none bg-slate-50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Photos</h3>
                  <p className="text-xs text-slate-500">Select images. GPS is auto-detected when available.</p>
                </div>
                <Button
                  variant="outline"
                  onClick={openFileDialog}
                  disabled={isProcessing}
                  className="h-9 px-3 text-sm"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isProcessing ? 'Processing...' : 'Choose Files'}
                </Button>
              </div>
              {previews.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {previews.map((p, i) => (
                    <div key={i} className="relative rounded-lg border border-slate-200 overflow-hidden bg-white">
                      <img src={p.preview} alt={`Preview ${i + 1}`} className="w-full h-40 object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(i)}
                        className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1 shadow-sm"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="border border-dashed border-slate-300 rounded-xl py-10 px-4 text-center text-sm text-slate-500 cursor-pointer bg-white/60 hover:bg-white transition"
                  onClick={openFileDialog}
                >
                  Drag and drop photos here, or <span className="font-medium text-slate-800">click to browse</span>
                </div>
              )}
            </Card>
          </div>

          {/* Trip & Location */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Trip */}
            <Card className="p-5 rounded-xl border border-slate-200 shadow-none">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900">Trip</h3>
                <div className="inline-flex items-center rounded-full bg-slate-100 p-1 text-xs font-medium text-slate-600">
                  <button
                    type="button"
                    className={`px-3 py-1 rounded-full transition ${
                      tripMode === 'existing' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
                    }`}
                    onClick={() => setTripMode('existing')}
                  >
                    Existing
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1 rounded-full transition ${
                      tripMode === 'new' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
                    }`}
                    onClick={() => {
                      setTripMode('new')
                      setSelectedTripId('')
                      setLocations([])
                    }}
                  >
                    New
                  </button>
                </div>
              </div>

              {tripMode === 'existing' ? (
                <div className="space-y-3">
                  <Label className="text-xs font-medium text-slate-500">Choose Trip</Label>
                  <Select value={selectedTripId} onValueChange={v => setSelectedTripId(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a trip" />
                    </SelectTrigger>
                    <SelectContent>
                      {trips.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.title} — {t.city}, {t.country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-slate-500">Title *</Label>
                    <Input
                      value={tripDetails.title}
                      onChange={e => setTripDetails({ ...tripDetails, title: e.target.value })}
                      placeholder="Peru Adventures"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-500">City *</Label>
                    <Input
                      value={tripDetails.city}
                      onChange={e => setTripDetails({ ...tripDetails, city: e.target.value })}
                      placeholder="Cusco"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-500">Country *</Label>
                    <Input
                      value={tripDetails.country}
                      onChange={e => setTripDetails({ ...tripDetails, country: e.target.value })}
                      placeholder="Peru"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-500">Start Date</Label>
                    <Input
                      type="date"
                      value={tripDetails.start_date}
                      onChange={e => setTripDetails({ ...tripDetails, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-500">End Date</Label>
                    <Input
                      type="date"
                      value={tripDetails.end_date}
                      onChange={e => setTripDetails({ ...tripDetails, end_date: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </Card>

            {/* Location */}
            <Card className="p-5 rounded-xl border border-slate-200 shadow-none">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900">Location</h3>
                <div className="inline-flex items-center rounded-full bg-slate-100 p-1 text-xs font-medium text-slate-600">
                  <button
                    type="button"
                    className={`px-3 py-1 rounded-full transition ${
                      locationMode === 'existing' && tripMode === 'existing'
                        ? 'bg-white shadow-sm text-slate-900'
                        : 'text-slate-500'
                    }`}
                    onClick={() => setLocationMode('existing')}
                    disabled={tripMode === 'new'}
                  >
                    Existing
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1 rounded-full transition ${
                      locationMode === 'new' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
                    }`}
                    onClick={() => setLocationMode('new')}
                  >
                    New
                  </button>
                </div>
              </div>

              {locationMode === 'existing' && tripMode === 'existing' ? (
                <div className="space-y-3">
                  <Label className="text-xs font-medium text-slate-500">Choose Location</Label>
                  <Select value={selectedLocationId} onValueChange={v => setSelectedLocationId(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedTripId ? 'Select a location' : 'Select a trip first'} />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(l => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-slate-500">Name *</Label>
                      <Input
                        value={locationDetails.name}
                        onChange={e => setLocationDetails({ ...locationDetails, name: e.target.value })}
                        placeholder="Machu Picchu"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-500">Address *</Label>
                      <Input
                        value={locationDetails.address}
                        onChange={e => setLocationDetails({ ...locationDetails, address: e.target.value })}
                        placeholder="Cusipata, Cusco"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-500">Rating</Label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setLocationDetails({ ...locationDetails, rating: n })}
                        >
                          <Star
                            className={
                              n <= (locationDetails.rating || 0)
                                ? 'h-5 w-5 text-yellow-400 fill-current'
                                : 'h-5 w-5 text-gray-300'
                            }
                          />
                        </button>
                      ))}
                      <span className="text-sm text-muted-foreground">{locationDetails.rating}/5</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-slate-500">Budget</Label>
                      <Select
                        value={locationDetails.cost_level}
                        onValueChange={v => setLocationDetails({ ...locationDetails, cost_level: v as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COST_LEVELS.map(c => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-500">Time to Spend (minutes)</Label>
                      <Input
                        type="number"
                        value={locationDetails.time_needed || 0}
                        onChange={e =>
                          setLocationDetails({
                            ...locationDetails,
                            time_needed: parseInt(e.target.value || '0', 10),
                          })
                        }
                        placeholder="60"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-500">Best time to visit</Label>
                    <Input
                      value={locationDetails.best_time_to_visit || ''}
                      onChange={e =>
                        setLocationDetails({
                          ...locationDetails,
                          best_time_to_visit: e.target.value,
                        })
                      }
                      placeholder="e.g., 7:00 am – 9:00 am"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-500">Tags</Label>
                    <div className="flex flex-wrap gap-2 mb-2 mt-1">
                      {selectedTags.map(tag => (
                        <Badge key={tag} className="flex items-center gap-1 rounded-full px-3 py-1 text-xs">
                          {tag}
                          <button
                            type="button"
                            onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Select
                        onValueChange={v => {
                          if (!selectedTags.includes(v)) {
                            setSelectedTags([...selectedTags, v])
                          }
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Add tag" />
                        </SelectTrigger>
                        <SelectContent>
                          {TAG_OPTIONS.filter(t => !selectedTags.includes(t)).map(t => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Custom tag"
                        value={newTag}
                        onChange={e => setNewTag(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && newTag.trim()) {
                            setSelectedTags([...selectedTags, newTag.trim()])
                            setNewTag('')
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="px-3"
                        onClick={() => {
                          if (newTag.trim()) {
                            setSelectedTags([...selectedTags, newTag.trim()])
                            setNewTag('')
                          }
                        }}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-500">What you should know (notes)</Label>
                    <Textarea
                      rows={3}
                      value={locationDetails.notes || ''}
                      onChange={e => setLocationDetails({ ...locationDetails, notes: e.target.value })}
                      placeholder="Helpful context for future you and friends…"
                    />
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>

        <div className="sticky bottom-0 bg-slate-50 border-t px-6 py-3.5 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {previews.length} photo{previews.length === 1 ? '' : 's'} selected{' '}
            {firstCoordinates ? `• GPS: ${firstCoordinates.y?.toFixed(4)}, ${firstCoordinates.x?.toFixed(4)}` : ''}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="h-9 px-4 text-sm">
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!canUpload || isProcessing} className="h-9 px-5 text-sm">
              {isProcessing ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}


