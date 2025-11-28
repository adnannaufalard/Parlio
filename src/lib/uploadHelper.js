import { supabase } from './supabaseClient'

/**
 * Upload file ke Supabase Storage
 * @param {File} file - File object dari input
 * @param {string} folder - Folder di bucket (image/audio/video)
 * @returns {Promise<{url: string, path: string}>} - Public URL dan path
 */
export async function uploadQuestMedia(file, folder = 'images') {
  try {
    // Validasi file
    if (!file) throw new Error('No file provided')
    
    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 9)
    const fileExt = file.name.split('.').pop()
    const fileName = `${timestamp}_${randomStr}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    // Upload ke Supabase Storage
    const { data, error } = await supabase.storage
      .from('quest-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('quest-media')
      .getPublicUrl(filePath)

    return {
      url: urlData.publicUrl,
      path: filePath
    }
  } catch (error) {
    console.error('Upload error:', error)
    throw error
  }
}

/**
 * Delete file dari Supabase Storage
 * @param {string} filePath - Path file di storage
 */
export async function deleteQuestMedia(filePath) {
  try {
    if (!filePath) return

    const { error } = await supabase.storage
      .from('quest-media')
      .remove([filePath])

    if (error) throw error
  } catch (error) {
    console.error('Delete error:', error)
    throw error
  }
}

/**
 * Get file type from MIME type
 * @param {string} mimeType - MIME type of file
 * @returns {string} - 'image', 'audio', or 'video'
 */
export function getFileTypeFromMime(mimeType) {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.startsWith('video/')) return 'video'
  return 'other'
}

/**
 * Validate file size and type
 * @param {File} file - File to validate
 * @param {number} maxSizeMB - Maximum size in MB
 * @returns {boolean}
 */
export function validateFile(file, maxSizeMB = 50) {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} not allowed`)
  }

  // Check file size
  const maxSize = maxSizeMB * 1024 * 1024 // Convert to bytes
  if (file.size > maxSize) {
    throw new Error(`File size exceeds ${maxSizeMB}MB`)
  }

  return true
}
