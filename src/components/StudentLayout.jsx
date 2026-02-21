/**
 * StudentLayout.jsx
 * Layout component khusus untuk halaman Siswa
 * Mobile-First Design dengan Bottom Navigation sesuai blueprint Parlio
 * 
 * Features:
 * - Collapsible Sidebar (icon-only / expanded)
 * - Bottom Navigation Bar untuk mobile-first experience
 * - Menu: Dashboard, Kelas, Leaderboard, Reward, Profile
 * - Logout functionality
 * - Responsive design (mobile-first)
 * - Active state highlighting
 * - XP & Coins display di header
 * 
 * @component
 */

import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { 
  LayoutDashboard, 
  GraduationCap, 
  Trophy, 
  ShoppingBag, 
  User, 
  Megaphone, 
  Users, 
  MessageCircle, 
  Zap, 
  Coins,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

/**
 * Icon component untuk render Lucide icons
 * @param {string} name - Nama icon yang akan di-render
 */
function Icon({ name, className = "h-6 w-6" }) {
  const iconMap = {
    dashboard: <LayoutDashboard className={className} />,
    classes: <GraduationCap className={className} />,
    leaderboard: <Trophy className={className} />,
    store: <ShoppingBag className={className} />,
    profile: <User className={className} />,
    announcement: <Megaphone className={className} />,
    members: <Users className={className} />,
    forum: <MessageCircle className={className} />,
    xp: <Zap className={className} />,
    coin: <Coins className={className} />,
    logout: <LogOut className={className} />,
    expand: <ChevronRight className={className} />,
    collapse: <ChevronLeft className={className} />,
  }

  return iconMap[name] || null
}

/**
 * StudentLayout Component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content yang akan di-render di dalam layout
 * @param {boolean} props.showHeader - Tampilkan header dengan stats (default: true)
 * @param {boolean} props.showBottomNav - Tampilkan bottom navigation (default: true)
 * @param {boolean} props.showClassNav - Tampilkan navigasi class detail (default: false)
 * @param {string} props.activeClassTab - Tab aktif untuk class navigation
 * @param {function} props.onClassTabChange - Handler untuk perubahan tab class
 */
export default function StudentLayout({ 
  children, 
  showHeader = true,
  showBottomNav = true,
  showClassNav = false, 
  activeClassTab = 'pelajaran',
  onClassTabChange = () => {}
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [studentStats, setStudentStats] = useState(() => {
    // Try to get cached stats from sessionStorage for instant display
    const cached = sessionStorage.getItem('studentStats')
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch {
        return { xp: 0, coins: 0, level: 1, currentStreak: 0, fullName: '', userId: '', avatarUrl: '' }
      }
    }
    return { xp: 0, coins: 0, level: 1, currentStreak: 0, fullName: '', userId: '', avatarUrl: '' }
  })

  useEffect(() => {
    fetchStudentStats()
  }, [])

  /**
   * Fetch student stats from database with caching
   */
  const fetchStudentStats = async () => {
    try {
      // Use cached session first for faster response
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) return

      // Fetch from profiles table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, xp_points, coins, avatar_url')
        .eq('id', session.user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return
      }

      if (profile) {
        const xp = profile.xp_points || 0
        const level = Math.floor(xp / 100) + 1
        
        const newStats = {
          xp: xp,
          coins: profile.coins || 0,
          level: level,
          currentStreak: 0,
          fullName: profile.full_name || 'Student',
          userId: session.user.id,
          avatarUrl: profile.avatar_url || ''
        }
        
        setStudentStats(newStats)
        // Cache to sessionStorage for instant load on navigation
        sessionStorage.setItem('studentStats', JSON.stringify(newStats))
      }
    } catch (error) {
      console.error('Error fetching student stats:', error)
    }
  }

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('Berhasil logout')
      navigate('/login')
    } catch (error) {
      console.error('Error logging out:', error)
      toast.error('Gagal logout')
    }
  }

  /**
   * Check apakah path saat ini aktif
   * @param {string} path - Path untuk dicek
   * @returns {boolean}
   */
  const isActive = (path) => {
    if (path === '/student/dashboard') {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  /**
   * Bottom Navigation menu items sesuai blueprint
   */
  const bottomNavItems = [
    {
      label: 'Dashboard',
      path: '/student/dashboard',
      icon: 'dashboard'
    },
    {
      label: 'Kelas',
      path: '/student/chapters',
      icon: 'classes'
    },
    {
      label: 'Leaderboard',
      path: '/student/leaderboard',
      icon: 'leaderboard'
    },
    {
      label: 'Store',
      path: '/student/reward',
      icon: 'store'
    },
    {
      label: 'Profile',
      path: '/student/profile',
      icon: 'profile'
    }
  ]

  /**
   * Class Navigation items (Pelajaran, Pengumuman, Anggota, Leaderboard, Forum)
   */
  const classNavItems = [
    {
      label: 'Pelajaran',
      value: 'pelajaran',
      icon: 'classes'
    },
    {
      label: 'Pengumuman',
      value: 'announcements',
      icon: 'announcement'
    },
    {
      label: 'Anggota',
      value: 'members',
      icon: 'members'
    },
    {
      label: 'Leaderboard',
      value: 'leaderboard',
      icon: 'leaderboard'
    },
    {
      label: 'Forum',
      value: 'forum',
      icon: 'forum'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Desktop: Collapsible Sidebar Navigation */}
      {showBottomNav && (
        <aside 
          className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col z-50 transition-all duration-300 ${
            sidebarExpanded ? 'lg:w-64' : 'lg:w-20'
          }`}
        >
          <div className="flex flex-col h-full bg-white border-r border-gray-200 shadow-sm">
            {/* Toggle Button */}
            <div className="flex items-center justify-center p-4 border-b border-gray-100">
              <button
                onClick={() => setSidebarExpanded(!sidebarExpanded)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                title={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
              >
                <Icon name={sidebarExpanded ? 'collapse' : 'expand'} className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
              {showClassNav ? (
                // Class Navigation
                classNavItems.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => onClassTabChange(item.value)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all
                      ${activeClassTab === item.value
                        ? 'bg-[#1E258F] text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                      ${sidebarExpanded ? 'justify-start' : 'justify-center'}
                    `}
                    title={!sidebarExpanded ? item.label : undefined}
                  >
                    <Icon name={item.icon} className="h-5 w-5 flex-shrink-0" />
                    {sidebarExpanded && (
                      <span className="text-sm whitespace-nowrap">{item.label}</span>
                    )}
                  </button>
                ))
              ) : (
                // Default Navigation
                bottomNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    {...(item.badge && { onClick: (e) => e.preventDefault() })}
                    className={`
                      relative flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all
                      ${isActive(item.path)
                        ? 'bg-[#1E258F] text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                      ${item.badge ? 'opacity-50 cursor-not-allowed' : ''}
                      ${sidebarExpanded ? 'justify-start' : 'justify-center'}
                    `}
                    title={!sidebarExpanded ? item.label : undefined}
                  >
                    <Icon name={item.icon} className="h-5 w-5 flex-shrink-0" />
                    {sidebarExpanded && (
                      <>
                        <span className="text-sm whitespace-nowrap">{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    {!sidebarExpanded && item.badge && (
                      <span className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                        !
                      </span>
                    )}
                  </Link>
                ))
              )}
            </nav>

            {/* Testing Button - DEV ONLY (Sidebar) */}
            <div className={`px-3 pb-2 ${sidebarExpanded ? '' : 'flex justify-center'}`}>
              <Link 
                to="/student/testing"
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-xl bg-yellow-50 text-yellow-800 border border-yellow-200 hover:shadow-md transition-all
                  ${sidebarExpanded ? '' : 'justify-center'}
                `}
                title={!sidebarExpanded ? 'Testing Panel' : undefined}
              >
                <span className="text-lg">🧪</span>
                {sidebarExpanded && (
                  <span className="text-sm font-bold whitespace-nowrap">Testing Panel</span>
                )}
              </Link>
            </div>

            {/* Logout Button */}
            <div className={`px-3 pb-4 border-t border-gray-200 pt-4 ${sidebarExpanded ? '' : 'flex justify-center'}`}>
              <button 
                onClick={handleLogout}
                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all
                  ${sidebarExpanded ? 'justify-start' : 'justify-center'}
                `}
                title={!sidebarExpanded ? 'Logout' : undefined}
              >
                <Icon name="logout" className="h-5 w-5 flex-shrink-0" />
                {sidebarExpanded && (
                  <span className="text-sm font-semibold whitespace-nowrap">Logout</span>
                )}
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Main Container with padding for sidebar on desktop */}
      <div className={showBottomNav ? (sidebarExpanded ? "lg:pl-64" : "lg:pl-20") : ""} style={{ transition: 'padding-left 0.3s' }}>
        {/* Top Header - Stats Bar (Mobile Only) */}
        {showHeader && (
          <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm lg:hidden">
            <div className="max-w-7xl mx-auto px-5 py-3">
              <div className="flex items-center justify-between">
                {/* User Profile - Avatar & Username */}
                <Link to="/student/profile" className="flex items-center gap-3 group">
                  {/* Avatar with gradient border */}
                  <div className="relative">
                    {/* Avatar container using Avatar component */}
                    <Avatar className="h-10 w-10 ring-2 ring-offset-2 ring-blue-500 group-hover:ring-purple-500 transition-all duration-300">
                      <AvatarImage src={studentStats.avatarUrl} alt={studentStats.fullName} />
                      <AvatarFallback className="bg-blue-600 text-white font-bold text-base">
                        {studentStats.fullName.charAt(0).toUpperCase() || 'S'}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Online indicator */}
                    <div className="absolute -bottom-0.5 -right-0.5 z-10">
                      <div className="h-3 w-3 bg-green-400 border-2 border-white rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* Username & Level - Always visible on mobile, more details on tablet+ */}
                  <div>
                    <h1 className="text-sm font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                      {/* Show first name on mobile, full name on sm+ */}
                      <span className="sm:hidden">
                        {studentStats.fullName.split(' ')[0] || 'Student'}
                      </span>
                      <span className="hidden sm:inline">
                        {studentStats.fullName || 'Student'}
                      </span>
                    </h1>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="flex items-center gap-1 bg-blue-100 px-1.5 py-0.5 rounded-full">
                        <span className="text-xs font-bold text-blue-700">Lvl {studentStats.level}</span>
                      </div>
                      <span className="hidden sm:inline text-xs text-gray-400">•</span>
                      <span className="hidden sm:inline text-xs text-gray-500 font-medium">Siswa</span>
                    </div>
                  </div>
                </Link>

              {/* Stats Display */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* XP */}
                <div className="flex items-center gap-1 bg-blue-500 text-white px-2 sm:px-3 py-1.5 rounded-full shadow-sm">
                  <Icon name="xp" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="text-xs font-bold">{studentStats.xp}</span>
                  <span className="hidden sm:inline text-xs font-medium">XP</span>
                </div>

                {/* Coins */}
                <div className="flex items-center gap-1 bg-yellow-500 text-white px-2 sm:px-3 py-1.5 rounded-full shadow-sm">
                  <Icon name="coin" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="text-xs font-bold">{studentStats.coins}</span>
                  <span className="hidden sm:inline text-xs font-medium">Coins</span>
                </div>

                {/* Streak (optional) */}
                {studentStats.currentStreak > 0 && (
                  <div className="flex items-center gap-1 bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 px-2 sm:px-3 py-1.5 rounded-full shadow-sm border border-orange-200">
                    <span className="text-sm">🔥</span>
                    <span className="text-xs font-bold">{studentStats.currentStreak}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

        {/* Main Content */}
        <main className="w-full px-4 py-6 pb-24 lg:pb-6">
          {children}
        </main>

        {/* Bottom Navigation Bar - Mobile Only (Capsule Glassmorphism Style) */}
        {showBottomNav && (
          <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 lg:hidden">
            <div className="bg-white/50 backdrop-blur-xl border border-white/30 shadow-2xl rounded-full px-4 py-3">
              <div className="flex items-center gap-3">
                {/* Show Class Navigation when in class detail page */}
                {showClassNav ? (
                classNavItems.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => onClassTabChange(item.value)}
                    className={`
                      relative p-3.5 rounded-full transition-all duration-300
                      ${activeClassTab === item.value
                        ? 'bg-[#4450FF] text-white shadow-lg shadow-blue-500/50 scale-110'
                        : 'text-gray-600 hover:bg-white/80 hover:text-gray-800'
                      }
                    `}
                    title={item.label}
                  >
                    <Icon name={item.icon} className="h-6 w-6" />
                    
                    {/* Active indicator dot */}
                    {activeClassTab === item.value && (
                      <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-lg" />
                    )}
                  </button>
                ))
              ) : (
                /* Show Default Navigation */
                bottomNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    {...(item.badge && { onClick: (e) => e.preventDefault() })}
                    className={`
                      relative p-3.5 rounded-full transition-all duration-300
                      ${isActive(item.path)
                        ? 'bg-[#1E258F] text-white shadow-lg shadow-blue-500/50 scale-110'
                        : 'text-gray-600 hover:bg-white/80 hover:text-gray-800'
                      }
                      ${item.badge ? 'opacity-40 cursor-not-allowed' : ''}
                    `}
                  >
                    <Icon name={item.icon} className="h-6 w-6" />
                    
                    {/* Active indicator dot */}
                    {isActive(item.path) && (
                      <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-lg" />
                    )}
                    
                    {/* Soon Badge */}
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-yellow-500 shadow-md">
                        !
                      </span>
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>
        </nav>
        )}
      </div>
    </div>
  )
}
