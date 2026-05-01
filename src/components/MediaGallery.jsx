/**
 * MediaGallery.jsx
 * Reusable component to display an array of media files.
 * Used in both teacher preview and student-facing pages.
 */

const TYPE_ICONS = {
  video: '🎥',
  audio: '🎵',
  image: '🖼️',
  pdf: '📄',
  link: '🔗',
  other: '📁'
}

/**
 * Get YouTube embed URL from regular URL
 */
function getYouTubeEmbedUrl(url) {
  if (!url) return null
  const youtubeRegex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
  const match = url.match(youtubeRegex)
  if (match && match[1]) return `https://www.youtube.com/embed/${match[1]}`
  return null
}

/**
 * Render a single media item
 */
function MediaItem({ media, className = '', compact = false }) {
  const { type, url, name } = media

  if (type === 'image') {
    return (
      <div className={`rounded-lg overflow-hidden border border-gray-200 bg-gray-100 ${className}`}>
        <img
          src={url}
          alt={name || 'Image'}
          className={`w-full object-contain ${compact ? 'max-h-32' : 'max-h-64'}`}
        />
      </div>
    )
  }

  if (type === 'video') {
    const embedUrl = getYouTubeEmbedUrl(url)
    if (embedUrl) {
      return (
        <div className={`relative bg-black rounded-lg overflow-hidden ${className}`} style={{ paddingBottom: compact ? '40%' : '56.25%' }}>
          <iframe
            src={embedUrl}
            className="absolute top-0 left-0 w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={name}
          />
        </div>
      )
    }
    return (
      <div className={`rounded-lg overflow-hidden bg-black ${className}`}>
        <video controls className={`w-full ${compact ? 'max-h-40' : 'max-h-64'}`}>
          <source src={url} />
        </video>
      </div>
    )
  }

  if (type === 'audio') {
    return (
      <div className={`bg-gray-50 rounded-lg p-3 border border-gray-200 ${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🎵</span>
          <span className="text-sm text-gray-700 truncate">{name || 'Audio'}</span>
        </div>
        <audio controls className="w-full h-8">
          <source src={url} />
        </audio>
      </div>
    )
  }

  if (type === 'pdf') {
    return (
      <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
        <div className="bg-gray-50 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📄</span>
            <span className="text-sm font-medium text-gray-700 truncate">{name || 'Document'}</span>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Buka PDF ↗
          </a>
        </div>
        {!compact && (
          <iframe src={url} className="w-full" style={{ height: '300px' }} title={name} />
        )}
      </div>
    )
  }

  // Link / other
  return (
    <div className={`bg-gray-50 rounded-lg p-3 border border-gray-200 ${className}`}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <span className="text-lg">🔗</span>
        <span className="text-sm font-medium truncate">{name || url}</span>
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  )
}

/**
 * Merge legacy single-field media with media_files array
 * Used for backward compatibility
 */
export function mergeLegacyMedia(item, legacyFields = {}) {
  const media = []
  
  // Add legacy fields first
  if (legacyFields.file_url && item[legacyFields.file_url]) {
    // For lesson_materials: use material_type to determine type
    const url = item[legacyFields.file_url]
    const type = item.material_type || 'link'
    media.push({ type, url, name: item.title || 'Media', source: 'legacy' })
  }
  if (legacyFields.question_image_url && item[legacyFields.question_image_url]) {
    media.push({ type: 'image', url: item[legacyFields.question_image_url], name: 'Question Image', source: 'legacy' })
  }
  if (legacyFields.question_audio_url && item[legacyFields.question_audio_url]) {
    media.push({ type: 'audio', url: item[legacyFields.question_audio_url], name: 'Question Audio', source: 'legacy' })
  }
  if (legacyFields.question_video_url && item[legacyFields.question_video_url]) {
    media.push({ type: 'video', url: item[legacyFields.question_video_url], name: 'Question Video', source: 'legacy' })
  }

  // Add media_files array (skip duplicates by URL)
  const existingUrls = new Set(media.map(m => m.url))
  const mediaFiles = Array.isArray(item.media_files) ? item.media_files : []
  mediaFiles.forEach(mf => {
    if (!existingUrls.has(mf.url)) {
      media.push(mf)
    }
  })

  return media
}

/**
 * MediaGallery component - displays array of media
 */
export default function MediaGallery({ mediaFiles = [], compact = false, className = '' }) {
  if (!mediaFiles || mediaFiles.length === 0) return null

  // Single item - render full width
  if (mediaFiles.length === 1) {
    return (
      <div className={className}>
        <MediaItem media={mediaFiles[0]} compact={compact} />
      </div>
    )
  }

  // Multiple items - render as list
  return (
    <div className={`space-y-3 ${className}`}>
      {mediaFiles.map((media, index) => (
        <MediaItem key={index} media={media} compact={compact} />
      ))}
    </div>
  )
}

/**
 * Compact inline media display for answer options
 */
export function OptionMedia({ mediaFiles = [] }) {
  if (!mediaFiles || mediaFiles.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {mediaFiles.map((media, index) => {
        if (media.type === 'image') {
          return (
            <img
              key={index}
              src={media.url}
              alt={media.name || ''}
              className="h-16 w-auto rounded border border-gray-200 object-contain"
            />
          )
        }
        if (media.type === 'audio') {
          return (
            <audio key={index} controls className="h-8 max-w-[200px]">
              <source src={media.url} />
            </audio>
          )
        }
        return (
          <div key={index} className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            <span>{TYPE_ICONS[media.type] || '📁'}</span>
            <span className="truncate max-w-[100px]">{media.name || 'Media'}</span>
          </div>
        )
      })}
    </div>
  )
}
