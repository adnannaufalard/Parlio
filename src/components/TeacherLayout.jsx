/**
 * TeacherLayout.jsx
 * Layout component khusus untuk halaman Guru
 * Professional Design dengan Collapsible Sidebar
 * 
 * Features:
 * - Collapsible Sidebar (icon-only / expanded) - similar to StudentLayout
 * - Menu: Dashboard, Kelola Kelas, Quest Builder, Leaderboard, Reward, Laporan, Akun
 * - Mobile-responsive dengan hamburger menu
 * - Active state highlighting
 * - Logout functionality
 * - Clean, professional UI with consistent colors
 * 
 * @component
 */

import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import Logo1 from '../assets/logo/1.png'

/**
 * Icon component untuk render SVG icons
 * @param {string} name - Nama icon yang akan di-render
 * @param {string} className - CSS class untuk icon
 */
function Icon({ name, className = "h-5 w-5" }) {
  const iconMap = {
    dashboard: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    classes: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    questBuilder: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    leaderboard: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    reward: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
    ),
    report: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    account: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    logout: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    ),
    expand: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
      </svg>
    ),
    collapse: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
      </svg>
    ),
    menu: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
    close: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    )
  }

  return iconMap[name] || null
}

/**
 * TeacherLayout Component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content yang akan di-render di dalam layout
 * @param {React.ReactNode} props.rightPanel - Optional right panel content (activity panel)
 * @param {boolean} props.showRightPanel - Show right panel (default: false)
 */
export default function TeacherLayout({ children, rightPanel, showRightPanel = false }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [teacherProfile, setTeacherProfile] = useState({ fullName: 'Guru', email: '' })

  useEffect(() => {
    fetchTeacherProfile()
  }, [])

  const fetchTeacherProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setTeacherProfile({
            fullName: profile.full_name || 'Guru',
            email: profile.email || user.email
          })
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  /**
   * Check apakah path saat ini aktif
   * @param {string} path - Path untuk dicek
   * @returns {boolean}
   */
  const isActive = (path) => {
    if (path === '/teacher/dashboard') {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  /**
   * Handle logout user
   */
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  /**
   * Menu navigasi guru
   */
  const menuItems = [
    { label: 'Dashboard', path: '/teacher/dashboard', icon: 'dashboard' },
    { label: 'Kelola Kelas', path: '/teacher/classes', icon: 'classes' },
    { label: 'Quest Builder', path: '/teacher/quest-builder', icon: 'questBuilder' },
    { label: 'Leaderboard', path: '/teacher/leaderboard', icon: 'leaderboard', badge: 'Soon' },
    { label: 'Reward', path: '/teacher/reward', icon: 'reward', badge: 'Soon' },
    { label: 'Laporan', path: '/teacher/reports', icon: 'report', badge: 'Soon' },
    { label: 'Akun', path: '/teacher/account', icon: 'account' }
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <Icon name="menu" className="h-6 w-6" />
          </button>
          <img src={Logo1} alt="Parlio" className="h-8 object-contain" />
          <div className="w-10" />
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`
          lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 
          transform transition-transform duration-300
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <img src={Logo1} alt="Parlio" className="h-10 object-contain" />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>
          </div>

          {/* Menu */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.badge ? '#' : item.path}
                onClick={(e) => {
                  if (item.badge) {
                    e.preventDefault()
                  } else {
                    setMobileMenuOpen(false)
                  }
                }}
                className={`
                  flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${isActive(item.path)
                    ? 'bg-[#1E258F] text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                  }
                  ${item.badge ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon name={item.icon} className="h-5 w-5" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-slate-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
            >
              <Icon name="logout" className="h-5 w-5" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Desktop Sidebar - Collapsible */}
      <aside
        className={`
          hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 z-40
          bg-white border-r border-slate-200 transition-all duration-300
          ${sidebarExpanded ? 'lg:w-64' : 'lg:w-20'}
        `}
      >
        {/* Logo */}
        <div className={`p-4 border-b border-slate-100 ${sidebarExpanded ? '' : 'flex justify-center'}`}>
          {sidebarExpanded ? (
            <img src={Logo1} alt="Parlio" className="h-10 object-contain" />
          ) : (
            <img src={Logo1} alt="Parlio" className="h-10 w-10 object-contain" />
          )}
        </div>

        {/* Toggle */}
        <div className="flex justify-center py-3 border-b border-slate-100">
          <button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            title={sidebarExpanded ? 'Collapse' : 'Expand'}
          >
            <Icon name={sidebarExpanded ? 'collapse' : 'expand'} className="h-5 w-5" />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.badge ? '#' : item.path}
              onClick={(e) => item.badge && e.preventDefault()}
              className={`
                relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all
                ${isActive(item.path)
                  ? 'bg-[#1E258F] text-white'
                  : 'text-slate-600 hover:bg-slate-100'
                }
                ${item.badge ? 'opacity-50 cursor-not-allowed' : ''}
                ${sidebarExpanded ? 'justify-start' : 'justify-center'}
              `}
              title={!sidebarExpanded ? item.label : undefined}
            >
              <Icon name={item.icon} className="h-5 w-5 flex-shrink-0" />
              {sidebarExpanded && (
                <>
                  <span className="whitespace-nowrap">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              {!sidebarExpanded && item.badge && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full" />
              )}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className={`p-3 border-t border-slate-200 ${sidebarExpanded ? '' : 'flex justify-center'}`}>
          <button
            onClick={handleLogout}
            className={`
              flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors
              ${sidebarExpanded ? 'w-full justify-start' : 'justify-center'}
            `}
            title={!sidebarExpanded ? 'Logout' : undefined}
          >
            <Icon name="logout" className="h-5 w-5 flex-shrink-0" />
            {sidebarExpanded && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`
          min-h-screen pt-16 lg:pt-0 transition-all duration-300
          ${sidebarExpanded ? 'lg:pl-64' : 'lg:pl-20'}
          ${showRightPanel ? 'lg:pr-80' : ''}
        `}
      >
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>

      {/* Right Panel (Activity) - Desktop Only */}
      {showRightPanel && rightPanel && (
        <aside className="hidden lg:block fixed inset-y-0 right-0 w-80 bg-white border-l border-slate-200 overflow-y-auto">
          {rightPanel}
        </aside>
      )}
    </div>
  )
}
