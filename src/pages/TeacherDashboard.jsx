/**
 * TeacherDashboard.jsx
 * Dashboard utama untuk Guru dengan 3-column layout
 * Left: Navigation (handled by TeacherLayout)
 * Center: Main Content (Stats, Quick Actions, Recent Classes)
 * Right: Activity Panel (Recent Activities)
 * 
 * @component
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import TeacherLayout from '../components/TeacherLayout'

/**
 * Icon component untuk dashboard
 */
function Icon({ name, className = "h-5 w-5" }) {
  const icons = {
    class: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    students: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    chapter: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    quest: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    plus: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
      </svg>
    ),
    arrow: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
      </svg>
    ),
    time: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    check: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    user: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  }
  return icons[name] || null
}

function TeacherDashboard() {
  const navigate = useNavigate()
  const [teacherProfile, setTeacherProfile] = useState({ fullName: 'Guru', email: '' })
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalChapters: 0,
    totalQuests: 0
  })
  const [recentClasses, setRecentClasses] = useState([])
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      // Fetch teacher profile
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

      // Fetch classes
      const { data: classes } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false })

      const classesWithStudents = await Promise.all(
        (classes || []).map(async (classItem) => {
          const { count } = await supabase
            .from('class_members')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', classItem.id)

          const { count: chapterCount } = await supabase
            .from('class_chapters')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', classItem.id)

          return {
            ...classItem,
            studentCount: count || 0,
            chapterCount: chapterCount || 0
          }
        })
      )

      const totalStudents = classesWithStudents.reduce((sum, c) => sum + c.studentCount, 0)
      const totalChapters = classesWithStudents.reduce((sum, c) => sum + c.chapterCount, 0)

      const { count: questCount } = await supabase
        .from('quests')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', user.id)

      setStats({
        totalClasses: classes?.length || 0,
        totalStudents,
        totalChapters,
        totalQuests: questCount || 0
      })

      setRecentClasses(classesWithStudents.slice(0, 4))

      // Generate recent activities from classes (dummy data for now)
      const activities = classesWithStudents.slice(0, 5).map((c, i) => ({
        id: i,
        type: i % 2 === 0 ? 'class_created' : 'student_joined',
        title: i % 2 === 0 ? `Kelas "${c.class_name}" dibuat` : `Siswa bergabung di "${c.class_name}"`,
        time: formatRelativeTime(c.created_at),
        icon: i % 2 === 0 ? 'class' : 'user'
      }))
      setRecentActivities(activities)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Hari ini'
    if (days === 1) return 'Kemarin'
    if (days < 7) return `${days} hari lalu`
    if (days < 30) return `${Math.floor(days / 7)} minggu lalu`
    return `${Math.floor(days / 30)} bulan lalu`
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Selamat Pagi'
    if (hour < 17) return 'Selamat Siang'
    return 'Selamat Malam'
  }

  // Right Activity Panel Component
  const ActivityPanel = () => (
    <div className="h-full flex flex-col">
      {/* Panel Header */}
      <div className="p-6 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800">Aktivitas Terbaru</h3>
        <p className="text-sm text-slate-500 mt-1">Pembaruan kelas dan siswa</p>
      </div>

      {/* Activities List */}
      <div className="flex-1 overflow-y-auto p-4">
        {recentActivities.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Icon name="time" className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm">Belum ada aktivitas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className={`p-2 rounded-lg flex-shrink-0 ${
                  activity.icon === 'class' ? 'bg-[#1E258F]/10 text-[#1E258F]' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  <Icon name={activity.icon} className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 line-clamp-2">{activity.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Panel Footer */}
      <div className="p-4 border-t border-slate-200">
        <button className="w-full text-center text-sm text-[#1E258F] hover:text-[#1E258F]/80 font-medium">
          Lihat semua aktivitas
        </button>
      </div>
    </div>
  )

  if (loading) {
    return (
      <TeacherLayout showRightPanel={true} rightPanel={<ActivityPanel />}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E258F]"></div>
        </div>
      </TeacherLayout>
    )
  }

  return (
    <TeacherLayout showRightPanel={true} rightPanel={<ActivityPanel />}>
      <div className="space-y-6 max-w-4xl">
        {/* Welcome Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {getGreeting()}, {teacherProfile.fullName}! 👋
              </h1>
              <p className="text-slate-500 mt-1">
                Kelola kelas, chapter, dan quest bahasa Prancis Anda dengan mudah
              </p>
            </div>
            <div className="hidden sm:block">
              <div className="text-right">
                <p className="text-sm text-slate-400">Hari ini</p>
                <p className="text-lg font-semibold text-slate-700">
                  {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Kelas */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-[#1E258F]/10">
                <Icon name="class" className="h-5 w-5 text-[#1E258F]" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.totalClasses}</p>
            <p className="text-sm text-slate-500 mt-1">Total Kelas</p>
          </div>

          {/* Total Siswa */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-emerald-100">
                <Icon name="students" className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.totalStudents}</p>
            <p className="text-sm text-slate-500 mt-1">Total Siswa</p>
          </div>

          {/* Total Chapter */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-amber-100">
                <Icon name="chapter" className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.totalChapters}</p>
            <p className="text-sm text-slate-500 mt-1">Total Chapter</p>
          </div>

          {/* Total Quest */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-purple-100">
                <Icon name="quest" className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.totalQuests}</p>
            <p className="text-sm text-slate-500 mt-1">Total Quest</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/teacher/classes')}
            className="flex items-center gap-4 p-4 bg-[#1E258F] text-white rounded-2xl hover:bg-[#1E258F]/90 transition-colors group"
          >
            <div className="p-3 bg-white/20 rounded-xl">
              <Icon name="plus" className="h-6 w-6" />
            </div>
            <div className="text-left">
              <p className="font-semibold">Buat Kelas Baru</p>
              <p className="text-sm text-white/70">Mulai kelas bahasa Prancis</p>
            </div>
            <Icon name="arrow" className="h-5 w-5 ml-auto opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </button>

          <button
            onClick={() => navigate('/teacher/quest-builder')}
            className="flex items-center gap-4 p-4 bg-white border border-slate-200 text-slate-800 rounded-2xl hover:border-[#1E258F] hover:shadow-md transition-all group"
          >
            <div className="p-3 bg-[#1E258F]/10 rounded-xl">
              <Icon name="quest" className="h-6 w-6 text-[#1E258F]" />
            </div>
            <div className="text-left">
              <p className="font-semibold">Buat Quest Baru</p>
              <p className="text-sm text-slate-500">Tambah latihan interaktif</p>
            </div>
            <Icon name="arrow" className="h-5 w-5 ml-auto text-slate-400 group-hover:text-[#1E258F] group-hover:translate-x-1 transition-all" />
          </button>
        </div>

        {/* Recent Classes */}
        <div className="bg-white rounded-2xl border border-slate-200">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Kelas Terbaru</h2>
              <p className="text-sm text-slate-500 mt-0.5">Kelola dan pantau kelas Anda</p>
            </div>
            <button
              onClick={() => navigate('/teacher/classes')}
              className="text-[#1E258F] hover:text-[#1E258F]/80 text-sm font-medium flex items-center gap-1"
            >
              Lihat Semua
              <Icon name="arrow" className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5">
            {recentClasses.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon name="class" className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-slate-600 font-medium mb-2">Belum ada kelas</p>
                <p className="text-slate-400 text-sm mb-4">Mulai dengan membuat kelas pertama Anda</p>
                <button
                  onClick={() => navigate('/teacher/classes')}
                  className="bg-[#1E258F] hover:bg-[#1E258F]/90 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
                >
                  Buat Kelas Pertama
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recentClasses.map((classItem) => (
                  <div
                    key={classItem.id}
                    className="border border-slate-200 rounded-xl p-4 hover:border-[#1E258F]/30 hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => navigate(`/teacher/classes/${classItem.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 truncate group-hover:text-[#1E258F] transition-colors">
                          {classItem.class_name}
                        </h3>
                        <span className="inline-block mt-1 bg-[#1E258F]/10 text-[#1E258F] px-2 py-0.5 rounded text-xs font-medium">
                          {classItem.class_code}
                        </span>
                      </div>
                      <Icon name="arrow" className="h-5 w-5 text-slate-300 group-hover:text-[#1E258F] group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Icon name="students" className="h-4 w-4" />
                        {classItem.studentCount} siswa
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="chapter" className="h-4 w-4" />
                        {classItem.chapterCount} chapter
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </TeacherLayout>
  )
}

export default TeacherDashboard