import { supabase } from './supabaseClient'

class PresenceService {
  constructor() {
    this.channel = null
    this.isInitialized = false
    this.listeners = new Set()
    this.onlineUsers = new Map()
  }

  async initialize() {
    if (this.isInitialized) return
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const user = session.user

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role, avatar_url')
        .eq('id', user.id)
        .single()

      if (!profile) return

      this.channel = supabase.channel('global_presence', {
        config: {
          presence: {
            key: user.id,
          },
        },
      })

      this.channel
        .on('presence', { event: 'sync' }, () => {
          const state = this.channel.presenceState()
          this.updateOnlineUsers(state)
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await this.channel.track({
              user_id: user.id,
              full_name: profile.full_name,
              role: profile.role,
              avatar_url: profile.avatar_url,
              online_at: new Date().toISOString()
            })
          }
        })

      this.isInitialized = true
    } catch (error) {
      console.error('Error initializing presence:', error)
    }
  }

  updateOnlineUsers(state) {
    const newOnlineUsers = new Map()
    Object.keys(state).forEach((key) => {
      if (state[key] && state[key].length > 0) {
        newOnlineUsers.set(key, state[key][0])
      }
    })
    this.onlineUsers = newOnlineUsers
    this.notifyListeners()
  }

  getOnlineUsers() {
    return Array.from(this.onlineUsers.values())
  }

  subscribe(callback) {
    this.listeners.add(callback)
    callback(this.getOnlineUsers())
    return () => this.listeners.delete(callback)
  }

  notifyListeners() {
    const users = this.getOnlineUsers()
    this.listeners.forEach((listener) => listener(users))
  }

  async disconnect() {
    if (this.channel) {
      await supabase.removeChannel(this.channel)
      this.channel = null
      this.isInitialized = false
      this.onlineUsers.clear()
    }
  }
}

export const presenceService = new PresenceService()
