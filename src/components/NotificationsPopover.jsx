import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { NotificationService } from '../lib/notificationService'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Bell, Check, Info, AlertTriangle, MessageSquare, Trophy, CheckCircle2 } from 'lucide-react'

export function NotificationsPopover({ children }) {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchUnreadCount()
    
    // Set up polling for new notifications every minute
    const interval = setInterval(fetchUnreadCount, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  const fetchUnreadCount = async () => {
    const count = await NotificationService.getUnreadCount()
    setUnreadCount(count)
  }

  const fetchNotifications = async () => {
    setLoading(true)
    const data = await NotificationService.getNotifications()
    setNotifications(data)
    setLoading(false)
  }

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation()
    await NotificationService.markAsRead(id)
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n))
    fetchUnreadCount()
  }

  const handleMarkAllAsRead = async () => {
    await NotificationService.markAllAsRead()
    setNotifications(notifications.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id)
    }
    
    if (notification.link) {
      setIsOpen(false)
      navigate(notification.link)
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'achievement': return <Trophy className="h-5 w-5 text-purple-500" />
      case 'forum': return <MessageSquare className="h-5 w-5 text-blue-500" />
      default: return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  const formatTimeAgo = (d) => { 
    const ms = new Date() - new Date(d)
    const m = Math.floor(ms / 60000)
    if (m < 1) return 'Baru saja'
    if (m < 60) return `${m}m`
    const h = Math.floor(ms / 3600000)
    if (h < 24) return `${h}j`
    return `${Math.floor(ms / 86400000)}h` 
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="relative inline-flex cursor-pointer">
          {children || (
            <button className="relative p-2 hover:bg-white/10 rounded-full transition text-gray-600 dark:text-gray-300">
              <Bell className="w-6 h-6" />
            </button>
          )}
          {unreadCount > 0 && (
            <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></div>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 font-['Poppins']">Notifikasi</h3>
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-['Poppins']"
            >
              <Check className="h-3 w-3" /> Tandai semua dibaca
            </button>
          )}
        </div>
        
        <div className="max-h-[350px] overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">Memuat...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              <div className="flex justify-center mb-2">
                <Bell className="h-8 w-8 text-gray-300" />
              </div>
              Belum ada notifikasi
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 flex gap-3 cursor-pointer hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-blue-50/30' : ''}`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-['Poppins'] ${!notification.is_read ? 'font-semibold text-gray-900' : 'text-gray-800'}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-2 leading-relaxed">
                      {notification.message}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
                      {formatTimeAgo(notification.created_at)}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {notifications.length > 0 && (
          <div className="p-2 border-t border-gray-100 text-center">
            <span className="text-xs text-gray-500 font-medium">Menampilkan {notifications.length} notifikasi terbaru</span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
