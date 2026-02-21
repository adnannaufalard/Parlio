import { supabase } from './supabaseClient'

/**
 * Log activity ke database
 * @param {Object} params
 * @param {string} params.action - Deskripsi action (e.g., "Login berhasil", "Membuat user baru")
 * @param {string} params.actionType - Tipe action: 'auth', 'create', 'update', 'delete', 'view', 'quest', 'reward', 'system'
 * @param {string} [params.resourceType] - Tipe resource: 'user', 'class', 'chapter', 'lesson', 'quest', 'material', 'announcement', etc
 * @param {string} [params.resourceId] - ID dari resource
 * @param {string} [params.resourceName] - Nama/label dari resource
 * @param {Object} [params.details] - Detail tambahan dalam format JSON
 */
export async function logActivity({
  action,
  actionType = 'info',
  resourceType = null,
  resourceId = null,
  resourceName = null,
  details = {}
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.warn('Cannot log activity: No authenticated user')
      return null
    }

    // Get user profile for additional info
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role, email')
      .eq('id', user.id)
      .single()

    const logData = {
      user_id: user.id,
      user_email: user.email || profile?.email,
      user_name: profile?.full_name || 'Unknown',
      user_role: profile?.role || 'unknown',
      action,
      action_type: actionType,
      resource_type: resourceType,
      resource_id: resourceId,
      resource_name: resourceName,
      details,
      ip_address: null, // Could be obtained from request headers in server context
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null
    }

    const { data, error } = await supabase
      .from('activity_logs')
      .insert([logData])
      .select()
      .single()

    if (error) {
      console.error('Error logging activity:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in logActivity:', error)
    return null
  }
}

// Predefined action types for consistency
export const ACTION_TYPES = {
  AUTH: 'auth',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  VIEW: 'view',
  QUEST: 'quest',
  REWARD: 'reward',
  SYSTEM: 'system'
}

// Predefined resource types
export const RESOURCE_TYPES = {
  USER: 'user',
  CLASS: 'class',
  CHAPTER: 'chapter',
  LESSON: 'lesson',
  QUEST: 'quest',
  MATERIAL: 'material',
  ANNOUNCEMENT: 'announcement',
  MOTIVATIONAL_MESSAGE: 'motivational_message',
  REWARD: 'reward'
}

// Helper functions for common actions
export const ActivityLogger = {
  // Auth
  login: () => logActivity({
    action: 'Login berhasil',
    actionType: ACTION_TYPES.AUTH
  }),
  
  logout: () => logActivity({
    action: 'Logout',
    actionType: ACTION_TYPES.AUTH
  }),

  // User management
  createUser: (userName, role) => logActivity({
    action: `Membuat user baru: ${userName}`,
    actionType: ACTION_TYPES.CREATE,
    resourceType: RESOURCE_TYPES.USER,
    resourceName: userName,
    details: { role }
  }),

  updateUser: (userId, userName, changes) => logActivity({
    action: `Mengupdate user: ${userName}`,
    actionType: ACTION_TYPES.UPDATE,
    resourceType: RESOURCE_TYPES.USER,
    resourceId: userId,
    resourceName: userName,
    details: changes
  }),

  deleteUser: (userId, userName) => logActivity({
    action: `Menghapus user: ${userName}`,
    actionType: ACTION_TYPES.DELETE,
    resourceType: RESOURCE_TYPES.USER,
    resourceId: userId,
    resourceName: userName
  }),

  // Announcement
  createAnnouncement: (title) => logActivity({
    action: `Membuat announcement: ${title}`,
    actionType: ACTION_TYPES.CREATE,
    resourceType: RESOURCE_TYPES.ANNOUNCEMENT,
    resourceName: title
  }),

  updateAnnouncement: (id, title) => logActivity({
    action: `Mengupdate announcement: ${title}`,
    actionType: ACTION_TYPES.UPDATE,
    resourceType: RESOURCE_TYPES.ANNOUNCEMENT,
    resourceId: id,
    resourceName: title
  }),

  deleteAnnouncement: (id, title) => logActivity({
    action: `Menghapus announcement: ${title}`,
    actionType: ACTION_TYPES.DELETE,
    resourceType: RESOURCE_TYPES.ANNOUNCEMENT,
    resourceId: id,
    resourceName: title
  }),

  // Motivational Message
  createMotivationalMessage: (message) => logActivity({
    action: `Membuat motivational message`,
    actionType: ACTION_TYPES.CREATE,
    resourceType: RESOURCE_TYPES.MOTIVATIONAL_MESSAGE,
    resourceName: message.substring(0, 50) + '...'
  }),

  updateMotivationalMessage: (id, message) => logActivity({
    action: `Mengupdate motivational message`,
    actionType: ACTION_TYPES.UPDATE,
    resourceType: RESOURCE_TYPES.MOTIVATIONAL_MESSAGE,
    resourceId: id,
    resourceName: message.substring(0, 50) + '...'
  }),

  deleteMotivationalMessage: (id) => logActivity({
    action: `Menghapus motivational message`,
    actionType: ACTION_TYPES.DELETE,
    resourceType: RESOURCE_TYPES.MOTIVATIONAL_MESSAGE,
    resourceId: id
  }),

  // Quest
  startQuest: (questId, questTitle) => logActivity({
    action: `Mengerjakan quest: ${questTitle}`,
    actionType: ACTION_TYPES.QUEST,
    resourceType: RESOURCE_TYPES.QUEST,
    resourceId: questId,
    resourceName: questTitle
  }),

  completeQuest: (questId, questTitle, score, passed) => logActivity({
    action: `Menyelesaikan quest: ${questTitle} (${passed ? 'LULUS' : 'GAGAL'})`,
    actionType: ACTION_TYPES.QUEST,
    resourceType: RESOURCE_TYPES.QUEST,
    resourceId: questId,
    resourceName: questTitle,
    details: { score, passed }
  }),

  // Generic view
  viewPage: (pageName) => logActivity({
    action: `Membuka halaman: ${pageName}`,
    actionType: ACTION_TYPES.VIEW,
    resourceName: pageName
  })
}

export default logActivity
