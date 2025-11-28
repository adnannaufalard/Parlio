import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function Icon({ name }) {
  switch (name) {
    case 'dashboard':
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12h6v8H3zM15 3h6v17h-6zM9 7h6v13H9z" /></svg>
      )
    case 'users':
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m0-4a4 4 0 11-8 0 4 4 0 018 0zm8 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
      )
    case 'content':
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 20h9" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4h9M12 12h9M3 6h.01M3 18h.01" /></svg>
      )
    case 'monitoring':
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3v18h18" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 3L3 21" /></svg>
      )
    case 'classes':
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
      )
    case 'assignments':
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
      )
    case 'materials':
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
      )
    case 'students':
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
      )
    case 'leaderboard':
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
      )
    case 'logout':
      return (
        <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8v8" /></svg>
      )
    default:
      return null
  }
}

export default function DashboardLayout({ children, title = 'Dashboard', menuItems = [], homeLink = '/admin/dashboard' }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  // simple breadcrumbs from path
  const segments = location.pathname.split('/').filter(Boolean)
  const breadcrumbs = [{ label: 'Home', to: '/' }, ...segments.map((s, i) => ({ label: s.replace(/-/g, ' '), to: '/' + segments.slice(0, i + 1).join('/') }))]

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error('Logout error', e)
    }
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 md:hidden flex items-center justify-between px-4 py-2">
        <button onClick={() => setOpen(true)} className="p-2 rounded-md">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 bg-indigo-600 rounded-md" />
          <div className="text-sm font-semibold">Parlio</div>
        </div>
        <div />
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col transform ${open ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-200 md:translate-x-0`}>
        <div className="px-4 py-6 flex items-center justify-between md:block">
          <Link to={homeLink} className="flex items-center gap-3">
            <div className="h-8 w-8 bg-indigo-600 rounded-md" />
            <div>
              <h3 className="text-lg font-bold">Parlio</h3>
            </div>
          </Link>
          <button onClick={() => setOpen(false)} className="md:hidden p-1 rounded-md">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <nav className="mt-6 px-2 flex-1 overflow-auto">
          {menuItems.length > 0 ? (
            menuItems.map((item, index) => (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`flex items-center gap-3 ${index > 0 ? 'mt-2' : ''} px-3 py-2 rounded-md text-sm font-medium ${isActive(item.path) ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            ))
          ) : (
            <>
              <Link to="/admin/dashboard" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${isActive('/admin/dashboard') ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}>
                <Icon name="dashboard" />
                <span>Dashboard</span>
              </Link>

              <Link to="/admin/users" className={`flex items-center gap-3 mt-2 px-3 py-2 rounded-md text-sm font-medium ${isActive('/admin/users') ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}>
                <Icon name="users" />
                <span>User Management</span>
              </Link>

              <Link to="/admin/content" className={`flex items-center gap-3 mt-2 px-3 py-2 rounded-md text-sm font-medium ${isActive('/admin/content') ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}>
                <Icon name="content" />
                <span>Fitur & Konten</span>
              </Link>

              <Link to="/admin/monitoring" className={`flex items-center gap-3 mt-2 px-3 py-2 rounded-md text-sm font-medium ${isActive('/admin/monitoring') ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}>
                <Icon name="monitoring" />
                <span>Monitoring</span>
              </Link>
            </>
          )}
        </nav>

        <div className="px-4 py-4">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50">
            <Icon name="logout" />
            <span>Logout</span>
          </button>
        </div>

        <div className="px-4 py-2 text-xs text-gray-500">
          <p>Version alpha • © Parlio</p>
        </div>
      </aside>

      {/* overlay for mobile */}
      {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-black/30 md:hidden" />}

      {/* Content area */}
      <main className="flex-1 pt-16 md:pt-0 md:ml-64 min-h-screen">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
           {children}
         </div>
        </main>
      </div>
    )
  }
