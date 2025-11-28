/**
 * StudentLayout.jsx
 * Layout component khusus untuk halaman Siswa
 * Mobile-First Design dengan Bottom Navigation sesuai blueprint Parlio
 * 
 * Features:
 * - Bottom Navigation Bar untuk mobile-first experience
 * - Menu: Dashboard, Kelas, Leaderboard, Reward, Profile
 * - Responsive design (mobile-first)
 * - Active state highlighting
 * - XP & Coins display di header
 * 
 * @component
 */

import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Icon component untuk render SVG icons
 * @param {string} name - Nama icon yang akan di-render
 */
function Icon({ name, className = "h-6 w-6" }) {
  const iconMap = {
    dashboard: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    classes: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    leaderboard: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    reward: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    profile: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    eiffel: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
      </svg>
    ),
    xp: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    coin: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
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
  activeClassTab = 'chapter',
  onClassTabChange = () => {}
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const [studentStats, setStudentStats] = useState({
    xp: 0,
    coins: 0,
    level: 1,
    currentStreak: 0,
    fullName: '',
    userId: ''
  })

  useEffect(() => {
    fetchStudentStats()
  }, [])

  /**
   * Fetch student stats from database
   */
  const fetchStudentStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      // Fetch from profiles table (student_stats table doesn't exist yet)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return
      }

      if (profile) {
        const xp = profile.xp_points || 0
        const level = Math.floor(xp / 100) + 1
        
        setStudentStats({
          xp: xp,
          coins: profile.coins || 0,
          level: level,
          currentStreak: 0, // TODO: implement streak tracking
          fullName: profile.full_name || 'Student',
          userId: user.id
        })
      }
    } catch (error) {
      console.error('Error fetching student stats:', error)
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
      icon: 'leaderboard',
      badge: 'Soon'
    },
    {
      label: 'Reward',
      path: '/student/reward',
      icon: 'reward',
      badge: 'Soon'
    },
    {
      label: 'Profile',
      path: '/student/profile',
      icon: 'profile',
      badge: 'Soon'
    }
  ]

  /**
   * Class Navigation items (Chapter, Pengumuman, Anggota)
   */
  const classNavItems = [
    {
      label: 'Chapter',
      value: 'chapter',
      icon: 'classes'
    },
    {
      label: 'Pengumuman',
      value: 'announcements',
      icon: 'eiffel'
    },
    {
      label: 'Anggota',
      value: 'members',
      icon: 'profile'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Desktop: Sidebar Navigation */}
      {showBottomNav && (
        <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col z-50">
          <div className="flex flex-col h-full bg-white border-r border-gray-200 shadow-sm">
            {/* Navigation Menu */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {showClassNav ? (
                // Class Navigation
                classNavItems.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => onClassTabChange(item.value)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all
                      ${activeClassTab === item.value
                        ? 'bg-[#1E258F] text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon name={item.icon} className="h-5 w-5" />
                    <span className="text-sm font-semibold">{item.label}</span>
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
                      relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all
                      ${isActive(item.path)
                        ? 'bg-[#1E258F] text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                      ${item.badge ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <Icon name={item.icon} className="h-5 w-5" />
                    <span className="text-sm font-semibold">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))
              )}
            </nav>

            {/* Testing Button - DEV ONLY (Sidebar) */}
            <div className="px-4 pb-4 border-t border-gray-200 pt-4">
              <Link 
                to="/student/testing"
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-50 text-yellow-800 border border-yellow-200 hover:shadow-md transition-all"
              >
                <span className="text-lg">🧪</span>
                <span className="text-sm font-bold">Testing Panel</span>
              </Link>
            </div>
          </div>
        </aside>
      )}

      {/* Main Container with padding for sidebar on desktop */}
      <div className={showBottomNav ? "lg:pl-64" : ""}>
        {/* Top Header - Stats Bar (Mobile Only) */}
        {showHeader && (
          <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm lg:hidden">
            <div className="max-w-7xl mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                {/* User Profile - Avatar & Username */}
                <Link to="/student/profile" className="flex items-center gap-3 group">
                  {/* Avatar with animated gradient border */}
                  <div className="relative">
                    {/* Animated gradient ring */}
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-75 group-hover:opacity-100 blur-sm group-hover:blur transition duration-300"></div>
                    
                    {/* Avatar container */}
                    <div className="relative h-10 w-10 bg-white rounded-full p-0.5 ring-2 ring-white shadow-lg">
                      <div className="h-full w-full bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                        <span className="text-white font-bold text-base">
                          {studentStats.fullName.charAt(0).toUpperCase() || 'S'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Online indicator with pulse */}
                    <div className="absolute bottom-0 right-0">
                      <div className="h-3 w-3 bg-green-400 border-2 border-white rounded-full"></div>
                      <div className="absolute inset-0 h-3 w-3 bg-green-400 rounded-full animate-ping opacity-75"></div>
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
                      <div className="flex items-center gap-1 bg-gradient-to-r from-purple-100 to-pink-100 px-1.5 py-0.5 rounded-full">
                        <span className="text-xs font-bold text-purple-600">Lvl {studentStats.level}</span>
                      </div>
                      <span className="hidden sm:inline text-xs text-gray-400">•</span>
                      <span className="hidden sm:inline text-xs text-gray-500 font-medium">Siswa</span>
                    </div>
                  </div>
                </Link>

              {/* Stats Display */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* XP */}
                <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-700 px-2 sm:px-3 py-1.5 rounded-full shadow-sm border border-yellow-200">
                  <Icon name="xp" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="text-xs font-bold">{studentStats.xp}</span>
                  <span className="hidden sm:inline text-xs font-medium">XP</span>
                </div>

                {/* Coins */}
                <div className="flex items-center gap-1 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 px-2 sm:px-3 py-1.5 rounded-full shadow-sm border border-blue-200">
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

                {/* Testing Button - DEV ONLY */}
                <Link 
                  to="/student/testing"
                  className="flex items-center gap-1 bg-gradient-to-r from-yellow-200 to-orange-200 text-yellow-800 px-2 sm:px-3 py-1.5 rounded-full shadow-sm border border-yellow-300 hover:shadow-md transition-shadow"
                  title="Testing Panel"
                >
                  <span className="text-sm">🧪</span>
                  <span className="hidden sm:inline text-xs font-bold">Testing</span>
                </Link>
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
          <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 lg:hidden">
            <div className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-2xl rounded-full px-4 py-3">
              <div className="flex items-center gap-5">
                {/* Show Class Navigation when in class detail page */}
                {showClassNav ? (
                classNavItems.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => onClassTabChange(item.value)}
                    className={`
                      relative p-3 rounded-full transition-all duration-300
                      ${activeClassTab === item.value
                        ? 'bg-[#4450FF] text-white shadow-lg shadow-blue-500/50 scale-110'
                        : 'text-gray-600 hover:bg-white/80 hover:text-blue-500'
                      }
                    `}
                  >
                    <Icon name={item.icon} className="h-6 w-6" />
                    
                    {/* Active indicator dot */}
                    {activeClassTab === item.value && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-lg" />
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
                      relative p-3 rounded-full transition-all duration-300
                      ${isActive(item.path)
                        ? 'bg-[#4450FF] text-white shadow-lg shadow-blue-500/50 scale-110'
                        : 'text-gray-600 hover:bg-white/80 hover:text-blue-500'
                      }
                      ${item.badge ? 'opacity-40 cursor-not-allowed' : ''}
                    `}
                  >
                    <Icon name={item.icon} className="h-6 w-6" />
                    
                    {/* Active indicator dot */}
                    {isActive(item.path) && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-lg" />
                    )}
                    
                    {/* Soon Badge */}
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-yellow-500 shadow-md">
                        {item.badge}
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
