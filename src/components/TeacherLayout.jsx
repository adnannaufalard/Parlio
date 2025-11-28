/**
 * TeacherLayout.jsx
 * Layout component khusus untuk halaman Guru
 * Menyediakan sidebar navigation sesuai blueprint Parlio
 * 
 * Features:
 * - Sidebar navigation dengan menu: Dashboard, Kelola Kelas, Quest Builder, Leaderboard, Reward, Laporan, Akun
 * - Mobile-responsive dengan hamburger menu
 * - Active state highlighting
 * - Logout functionality
 * 
 * @component
 */

import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Icon component untuk render SVG icons
 * @param {string} name - Nama icon yang akan di-render
 */
function Icon({ name }) {
  const iconMap = {
    dashboard: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    classes: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    questBuilder: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    leaderboard: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    reward: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
    ),
    report: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    account: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    logout: (
      <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    )
  }

  return iconMap[name] || null
}

/**
 * TeacherLayout Component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content yang akan di-render di dalam layout
 */
export default function TeacherLayout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  /**
   * Check apakah path saat ini aktif
   * @param {string} path - Path untuk dicek
   * @returns {boolean}
   */
  const isActive = (path) => {
    // Exact match untuk dashboard
    if (path === '/teacher/dashboard') {
      return location.pathname === path
    }
    // Partial match untuk routes lainnya
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
   * Menu navigasi guru sesuai blueprint
   */
  const menuItems = [
    {
      label: 'Dashboard',
      path: '/teacher/dashboard',
      icon: 'dashboard'
    },
    {
      label: 'Kelola Kelas',
      path: '/teacher/classes',
      icon: 'classes'
    },
    {
      label: 'Quest Builder',
      path: '/teacher/quest-builder',
      icon: 'questBuilder'
    },
    {
      label: 'Leaderboard',
      path: '/teacher/leaderboard',
      icon: 'leaderboard',
      badge: 'Soon' // Feature belum tersedia
    },
    {
      label: 'Reward',
      path: '/teacher/reward',
      icon: 'reward',
      badge: 'Soon' // Feature belum tersedia
    },
    {
      label: 'Laporan',
      path: '/teacher/reports',
      icon: 'report',
      badge: 'Soon' // Feature belum tersedia
    },
    {
      label: 'Akun',
      path: '/teacher/account',
      icon: 'account',
      badge: 'Soon' // Feature belum tersedia
    }
  ]

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile Header - Hanya tampil di mobile */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 lg:hidden flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-md hover:bg-gray-100"
          aria-label="Open sidebar"
        >
          <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <div className="text-lg font-bold text-gray-900">Parlio</div>
        </div>
        <div className="w-10" /> {/* Spacer untuk balance */}
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Logo & Brand */}
        <div className="px-6 py-6 flex items-center justify-between lg:justify-start">
          <Link to="/teacher/dashboard" className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Parlio</h3>
              <p className="text-xs text-gray-500">Guru Dashboard</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100"
            aria-label="Close sidebar"
          >
            <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="mt-6 px-3 flex-1 overflow-y-auto">
          {menuItems.map((item, index) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-sm font-medium
                transition-all duration-200
                ${index > 0 ? 'mt-1' : ''}
                ${isActive(item.path)
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
                }
                ${item.badge ? 'cursor-not-allowed opacity-60' : ''}
              `}
              {...(item.badge && { onClick: (e) => e.preventDefault() })}
            >
              <div className="flex items-center gap-3">
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="bg-yellow-400 text-yellow-900 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="px-3 py-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <Icon name="logout" />
            <span>Logout</span>
          </button>
        </div>

        {/* Version Info */}
        <div className="px-6 py-3 text-xs text-gray-500 border-t border-gray-100">
          <p>Version 1.0.0-alpha</p>
          <p className="text-gray-400">© 2025 Parlio</p>
        </div>
      </aside>

      {/* Overlay untuk mobile - menutup sidebar saat diklik */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 pt-16 lg:pt-0 lg:ml-64 min-h-screen">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
