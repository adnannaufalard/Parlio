/**
 * TeacherLayout.jsx
 * Layout component khusus untuk halaman Guru
 * Professional Design dengan Collapsible Sidebar
 * 
 * Features:
 * - Collapsible Sidebar (icon-only / expanded) - similar to StudentLayout
 * - Menu: Dashboard, Kelola Kelas, Quest Builder, Leaderboard, Store, Reward, Laporan, Akun
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
import { ActivityLogger } from '../lib/activityLogger'
import { presenceService } from '../lib/presenceService'
import Logo1 from '../assets/logo/1.png'
import { 
  LayoutDashboard, 
  GraduationCap, 
  FlaskConical, 
  Trophy, 
  Gift, 
  FileBarChart, 
  User, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ShoppingBag
} from 'lucide-react'

/**
 * Icon component untuk render lucide icons
 * @param {string} name - Nama icon yang akan di-render
 * @param {string} className - CSS class untuk icon
 */
function Icon({ name, className = "h-5 w-5" }) {
  const iconMap = {
    dashboard: <LayoutDashboard className={className} />,
    classes: <GraduationCap className={className} />,
    questBuilder: <FlaskConical className={className} />,
    leaderboard: <Trophy className={className} />,
    store: <ShoppingBag className={className} />,
    reward: <Gift className={className} />,
    report: <FileBarChart className={className} />,
    account: <User className={className} />,
    logout: <LogOut className={className} />,
    expand: <ChevronRight className={className} />,
    collapse: <ChevronLeft className={className} />,
    menu: <Menu className={className} />,
    close: <X className={className} />
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
  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    try {
      return localStorage.getItem('parlio_teacher_sidebar_expanded') === 'true'
    } catch {
      return false
    }
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [teacherProfile, setTeacherProfile] = useState({ fullName: 'Guru', email: '' })

  useEffect(() => {
    fetchTeacherProfile()
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('parlio_teacher_sidebar_expanded', String(sidebarExpanded))
    } catch {
      // ignore storage errors
    }
  }, [sidebarExpanded])

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
      await ActivityLogger.logout()
      await presenceService.disconnect()
      await supabase.auth.signOut()
      try {
        localStorage.removeItem('parlio_active_user_id')
      } catch {
        // ignore storage errors
      }
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
    { label: 'Leaderboard', path: '/teacher/leaderboard', icon: 'leaderboard' },
    { label: 'Store', path: '/teacher/store', icon: 'store' },
    { label: 'Reward', path: '/teacher/reward', icon: 'reward' },
    { label: 'Laporan', path: '/teacher/reports', icon: 'report' },
    { label: 'Profile', path: '/teacher/account', icon: 'account' }
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
            <img src={Logo1} alt="Parlio" className="h-8 object-contain" />
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
        <div className={`flex items-center gap-2 border-b border-slate-100 ${sidebarExpanded ? 'p-4 justify-between' : 'px-2 py-3 justify-center'}`}>
          {sidebarExpanded ? (
            <img src={Logo1} alt="Parlio" className="h-10 object-contain" />
          ) : (
            <div />
          )}
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
