/**
 * MultiMediaManager.jsx
 * Reusable component for managing an array of media files (upload & URL).
 * Used by teachers in material/question modals.
 */
import { useState, useRef } from 'react'
import { uploadQuestMedia, validateFile, detectMediaTypeFromFile, detectMediaTypeFromUrl } from '../lib/uploadHelper'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'

const TYPE_ICONS = {
  video: '🎥',
  audio: '🎵',
  image: '🖼️',
  pdf: '📄',
  link: '🔗',
  other: '📁'
}

const TYPE_LABELS = {
  video: 'Video',
  audio: 'Audio',
  image: 'Gambar',
  pdf: 'PDF',
  link: 'Link',
  other: 'File'
}

export default function MultiMediaManager({
  mediaFiles = [],
  onChange,
  maxFiles = 10,
  bucket = 'quest-media',
  folder = 'images',
  label = 'Media',
  acceptTypes = 'image/*,audio/*,video/*,.pdf',
  compact = false
}) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [addMethod, setAddMethod] = useState('upload') // 'upload' | 'url'
  const [urlInput, setUrlInput] = useState('')
  const [urlType, setUrlType] = useState('video')
  const [urlName, setUrlName] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    const remaining = maxFiles - mediaFiles.length
    if (files.length > remaining) {
      toast.error(`Maksimal ${maxFiles} file. Sisa slot: ${remaining}`)
      return
    }

    setUploading(true)
    const newMedia = [...mediaFiles]

    for (const file of files) {
      try {
        // Validate file
        const type = detectMediaTypeFromFile(file)
        const maxSize = type === 'video' ? 50 : type === 'audio' ? 20 : 10
        validateFile(file, maxSize)

        // Upload based on bucket
        let url
        if (bucket === 'materials') {
          const { data: { user } } = await supabase.auth.getUser()
          const fileExt = file.name.split('.').pop()
          const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
          const filePath = `lesson-materials/${fileName}`

          const { error } = await supabase.storage
            .from('materials')
            .upload(filePath, file, { cacheControl: '3600', upsert: false })
          if (error) throw error

          const { data: { publicUrl } } = supabase.storage
            .from('materials')
            .getPublicUrl(filePath)
          url = publicUrl
        } else {
          const result = await uploadQuestMedia(file, folder)
          url = result.url
        }

        newMedia.push({
          type,
          url,
          name: file.name,
          source: 'upload'
        })
      } catch (error) {
        toast.error(`Gagal upload ${file.name}: ${error.message}`)
      }
    }

    onChange(newMedia)
    setUploading(false)
    setShowAddForm(false)
    e.target.value = ''
  }

  const handleAddUrl = () => {
    if (!urlInput.trim()) {
      toast.error('Masukkan URL')
      return
    }
    if (mediaFiles.length >= maxFiles) {
      toast.error(`Maksimal ${maxFiles} media`)
      return
    }

    const detectedType = detectMediaTypeFromUrl(urlInput)
    const newMedia = [...mediaFiles, {
      type: urlType || detectedType,
      url: urlInput.trim(),
      name: urlName.trim() || urlInput.trim().split('/').pop() || 'External Media',
      source: 'url'
    }]

    onChange(newMedia)
    setUrlInput('')
    setUrlName('')
    setShowAddForm(false)
  }

  const handleRemove = (index) => {
    const newMedia = mediaFiles.filter((_, i) => i !== index)
    onChange(newMedia)
  }

  const handleUrlInputChange = (val) => {
    setUrlInput(val)
    // Auto-detect type
    const detected = detectMediaTypeFromUrl(val)
    if (detected !== 'link') setUrlType(detected)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label} {mediaFiles.length > 0 && <span className="text-gray-400 font-normal">({mediaFiles.length}/{maxFiles})</span>}
        </label>
        {mediaFiles.length < maxFiles && !showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Media
          </button>
        )}
      </div>

      {/* Existing media list */}
      {mediaFiles.length > 0 && (
        <div className={`space-y-2 ${compact ? '' : 'max-h-60 overflow-y-auto'}`}>
          {mediaFiles.map((media, index) => (
            <div key={index} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2.5 border border-gray-200 group">
              {/* Thumbnail / icon */}
              <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {media.type === 'image' ? (
                  <img src={media.url} alt="" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <span className="text-lg">{TYPE_ICONS[media.type] || '📁'}</span>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{media.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 uppercase">
                    {TYPE_LABELS[media.type] || media.type}
                  </span>
                  <span className="text-xs text-gray-400">
                    {media.source === 'upload' ? '📤 Upload' : '🔗 URL'}
                  </span>
                </div>
              </div>
              {/* Preview & Delete */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                {media.url && (
                  <a
                    href={media.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                    title="Buka di tab baru"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                  title="Hapus"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {mediaFiles.length === 0 && !showAddForm && (
        <div
          className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-green-300 hover:bg-green-50/30 transition"
          onClick={() => setShowAddForm(true)}
        >
          <div className="text-3xl mb-2">📎</div>
          <p className="text-sm text-gray-500">Belum ada media. Klik untuk menambahkan.</p>
          <p className="text-xs text-gray-400 mt-1">Upload file atau masukkan URL</p>
        </div>
      )}

      {/* Add media form */}
      {showAddForm && (
        <div className="border border-green-200 rounded-lg p-4 bg-green-50/30 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-800">Tambah Media</h4>
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setUrlInput(''); setUrlName('') }}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Method toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAddMethod('upload')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition ${
                addMethod === 'upload'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              📤 Upload File
            </button>
            <button
              type="button"
              onClick={() => setAddMethod('url')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition ${
                addMethod === 'url'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              🔗 URL Eksternal
            </button>
          </div>

          {addMethod === 'upload' ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptTypes}
                multiple
                onChange={handleFileUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-black text-sm"
                disabled={uploading}
              />
              {uploading && (
                <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Mengupload file...</span>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                💡 Max: Gambar 10MB, Audio 20MB, Video 50MB, PDF 10MB. Bisa pilih beberapa file sekaligus.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => handleUrlInputChange(e.target.value)}
                placeholder="https://... (YouTube, Google Drive, dll)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-black text-sm"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={urlName}
                  onChange={(e) => setUrlName(e.target.value)}
                  placeholder="Nama media (opsional)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-black text-sm"
                />
                <select
                  value={urlType}
                  onChange={(e) => setUrlType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-black text-sm"
                >
                  <option value="video">🎥 Video</option>
                  <option value="audio">🎵 Audio</option>
                  <option value="image">🖼️ Gambar</option>
                  <option value="pdf">📄 PDF</option>
                  <option value="link">🔗 Link</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleAddUrl}
                className="w-full px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm font-medium"
              >
                Tambah URL
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
